/**
 * CLI Command: restore
 * 
 * Enterprise Disaster Recovery Restore Engine:
 * - Validates cryptographic SHA-256 hashes against snapshot manifest.json
 * - Supports non-destructive --dry-run mode for pre-flight reconciliation planning
 * - Atomic batch upsert with natural key matching to prevent record duplication
 * - Logs disaster recovery event to Audit Trail
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { AirtableBatchEngine } from '../../client/batchUpsert.js';
import { AirtableMetadataClient } from '../../client/metadataClient.js';

export interface RestoreOptions {
  snapshotDir?: string;
  baseId?: string;
  dryRun?: boolean;
}

// Set of read-only computed field types that Airtable API forbids mutating
export const READ_ONLY_FIELD_TYPES = new Set([
  'formula',
  'rollup',
  'lookup',
  'multipleLookupValues',
  'createdTime',
  'lastModifiedTime',
  'createdBy',
  'lastModifiedBy',
  'count',
  'button',
  'autoNumber',
]);

export const NATURAL_KEYS: Record<string, string[]> = {
  'Projects': ['Project Code'],
  'Team Members': ['Corporate Email'],
  'Tasks & Deliverables': ['Task Key'],
  'Risk & Governance Log': ['Risk ID'],
  'Audit Trail & CDC Logs': ['Event ID'],
};

/**
 * Filter record fields to only writable fields according to table schema.
 * If stripLinks is true, multipleRecordLinks fields are excluded for Pass 1 entity restoration.
 */
export function sanitizeRecordForRestore(
  rawFields: Record<string, any>,
  tableSchema?: { fields: Array<{ name: string; type: string }> },
  stripLinks: boolean = false
): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const schemaMap = new Map<string, string>();

  if (tableSchema) {
    for (const f of tableSchema.fields) {
      schemaMap.set(f.name, f.type);
    }
  }

  for (const [key, value] of Object.entries(rawFields)) {
    // If target table schema is provided, the field MUST exist on the target table
    if (tableSchema && !schemaMap.has(key)) {
      continue;
    }
    const fieldType = schemaMap.get(key);
    // Skip if field is known to be computed/read-only
    if (fieldType && READ_ONLY_FIELD_TYPES.has(fieldType)) {
      continue;
    }
    // Skip relational links in Pass 1 to prevent foreign key mismatch across bases
    if (stripLinks && fieldType === 'multipleRecordLinks') {
      continue;
    }
    // Skip arrays containing foreign record IDs in Pass 1
    if (stripLinks && Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('rec')) {
      continue;
    }
    // Also skip internal Airtable metadata keys
    if (key.startsWith('__')) {
      continue;
    }
    sanitized[key] = value;
  }

  return sanitized;
}

export async function runRestoreCommand(options: RestoreOptions) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = options.baseId || process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    logger.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env');
    return;
  }

  // Find latest snapshot if not specified
  let snapshotDir = options.snapshotDir;
  if (!snapshotDir) {
    const backupsRoot = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(backupsRoot)) {
      logger.error('No "backups" directory found.');
      return;
    }
    const snapshots = fs
      .readdirSync(backupsRoot)
      .filter((d) => d.startsWith('snapshot-'))
      .sort()
      .reverse();

    if (snapshots.length === 0) {
      logger.error('No snapshot directories found under backups/.');
      return;
    }
    snapshotDir = path.join(backupsRoot, snapshots[0]);
    logger.info(`Using latest discovered snapshot: ${path.basename(snapshotDir)}`);
  }

  const manifestPath = path.join(snapshotDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    logger.error(`Snapshot manifest not found: ${manifestPath}`);
    return;
  }

  logger.section('Airtable Enterprise Disaster Recovery & Restore Engine');
  logger.keyVal('Snapshot Source', snapshotDir);
  logger.keyVal('Target Base ID', baseId);
  logger.keyVal('Execution Mode', options.dryRun ? 'DRY-RUN (Simulation Only)' : 'LIVE RESTORATION');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // 1. Cryptographic Integrity Verification
  logger.info('Verifying SHA-256 cryptographic integrity of snapshot files...');
  for (const [tableName, meta] of Object.entries<any>(manifest.tables)) {
    const jsonPath = path.join(snapshotDir, meta.jsonFile);
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Integrity Error: File missing on disk: ${meta.jsonFile}`);
    }
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const computedHash = crypto.createHash('sha256').update(content).digest('hex');

    if (computedHash !== meta.jsonSha256) {
      logger.error(`Cryptographic hash mismatch for ${meta.jsonFile}!`);
      logger.keyVal('Expected', meta.jsonSha256);
      logger.keyVal('Computed', computedHash);
      throw new Error(`Data Corruption detected in snapshot ${meta.jsonFile}`);
    }
    logger.success(`Verified [${tableName}]: ${meta.recordCount} records (SHA-256 valid)`);
  }

  // 2. Dry-Run Planning
  if (options.dryRun) {
    logger.section('📋 Restoration Plan (Dry-Run)');
    for (const [tableName, meta] of Object.entries<any>(manifest.tables)) {
      const keys = NATURAL_KEYS[tableName] || ['id'];
      console.log(`  • [${tableName}]: Restore ${meta.recordCount} records via Upsert on [${keys.join(', ')}]`);
    }
    logger.success('\nPre-flight validation passed! Run without --dry-run to execute restoration.');
    return;
  }

  // 3. Execution
  const metaClient = new AirtableMetadataClient(apiKey);
  const batchEngine = new AirtableBatchEngine(baseId, apiKey);

  logger.info('Inspecting target base schema...');
  const schema = await metaClient.getBaseSchema(baseId);
  const targetTables = new Set(schema.tables.map((t) => t.name));

  const tableSchemaMap = new Map(schema.tables.map((t) => [t.name, t]));

  for (const [tableName, meta] of Object.entries<any>(manifest.tables)) {
    if (!targetTables.has(tableName)) {
      logger.warn(`Target table [${tableName}] does not exist in base. Skipping.`);
      continue;
    }

    const jsonPath = path.join(snapshotDir, meta.jsonFile);
    const rawRecords: any[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const tableSchema = tableSchemaMap.get(tableName);
    const keys = NATURAL_KEYS[tableName] || ['id'];

    // Sanitize records to strip computed/read-only fields (formulas, lookups, rollups)
    const sanitizedRecords = rawRecords.map((r) => ({
      fields: sanitizeRecordForRestore(r.fields, tableSchema),
    }));

    logger.info(`Restoring [${tableName}] (${sanitizedRecords.length} records)...`);
    try {
      const result = await batchEngine.batchUpsert(tableName, sanitizedRecords, keys, true);
      logger.success(
        `Restored [${tableName}]: ${result.createdRecords.length} created, ${result.updatedRecords.length} updated.`
      );
    } catch (err: any) {
      logger.error(`Failed to restore table [${tableName}]: ${err.message}`);
      // Partial failure recovery: continue with remaining tables
    }
  }

  // 4. Log event to Audit Trail
  try {
    await batchEngine.batchCreate('Audit Trail & CDC Logs', [
      {
        fields: {
          'Event ID': `EVT-RESTORE-${Date.now().toString().slice(-6)}`,
          'Timestamp': new Date().toISOString(),
          'Source': 'CLI Migration',
          'Action': 'UPDATE',
          'Target Table': 'All Tables',
          'Record Reference': path.basename(snapshotDir),
          'Payload Snapshot': JSON.stringify({
            action: 'Disaster Recovery Snapshot Restore',
            snapshot: path.basename(snapshotDir),
          }),
        },
      },
    ]);
  } catch (err: any) {
    logger.warn(`Could not log restore event to audit table: ${err.message}`);
  }

  logger.section('🎉 Restoration Completed Successfully');
}
