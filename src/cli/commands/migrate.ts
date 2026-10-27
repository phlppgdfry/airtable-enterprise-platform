/**
 * CLI Command: migrate
 * 
 * Declarative Database Migration CLI for Airtable:
 * - plan: inspects remote base and displays planned DDL changes without executing
 * - apply: executes safe additive migrations (creates missing tables and fields)
 */

import { logger } from '../utils/logger.js';
import { ENTERPRISE_SCHEMA } from '../../schemas/enterpriseSchema.js';
import { AirtableMetadataClient } from '../../client/metadataClient.js';
import { SchemaMigrationEngine } from '../../migrations/schemaDiff.js';

export async function runMigrateCommand(action: 'plan' | 'apply', options: { baseId?: string }) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = options.baseId || process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    logger.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env');
    return;
  }

  logger.section(`Airtable Declarative Schema Migration [${action.toUpperCase()}]`);
  logger.keyVal('Target Base ID', baseId);

  const metaClient = new AirtableMetadataClient(apiKey);
  logger.info('Fetching live remote schema from Metadata API...');
  const remoteSchema = await metaClient.getBaseSchema(baseId);

  const diff = SchemaMigrationEngine.calculateDiff(ENTERPRISE_SCHEMA, remoteSchema.tables);

  if (!diff.hasDiff) {
    logger.success('No schema drift detected! Remote base is 100% in sync with local TypeScript DDL.');
    return;
  }

  console.log(`\nFound ${diff.steps.length} schema differences:`);
  for (let i = 0; i < diff.steps.length; i++) {
    const s = diff.steps[i];
    console.log(`  ${i + 1}. [${s.type}] ${s.description} (${s.safety})`);
  }

  if (action === 'plan') {
    logger.info('\nDry-run complete. Run "npm run migrate:apply" to execute these changes.');
    return;
  }

  logger.info('\nApplying schema migration...');
  const result = await SchemaMigrationEngine.applyMigration(baseId, diff, metaClient);
  logger.section('🎉 Migration Applied Successfully');
  logger.keyVal('Tables Created', result.createdTables);
  logger.keyVal('Fields Created', result.createdFields);
}
