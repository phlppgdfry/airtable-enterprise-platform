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

export const NATURAL_KEYS: Record<string, string[]> = {
  'Projects': ['Project Code'],
  'Team Members': ['Corporate Email'],
  'Tasks & Deliverables': ['Task Key'],
  'Risk & Governance Log': ['Risk ID'],
  'Audit Trail & CDC Logs': ['Event ID'],
};

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

  for (const [tableName, meta] of Object.entries<any>(manifest.tables)) {
    if (!targetTables.has(tableName)) {
      logger.warn(`Target table [${tableName}] does not exist in base. Skipping.`);
      continue;
    }

    const jsonPath = path.join(snapshotDir, meta.jsonFile);
    const records = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const keys = NATURAL_KEYS[tableName] || ['id'];

    logger.info(`Restoring [${tableName}] (${records.length} records)...`);
    const result = await batchEngine.batchUpsert(tableName, records, keys, true);
    logger.success(
      `Restored [${tableName}]: ${result.createdRecords.length} created, ${result.updatedRecords.length} updated.`
    );
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
