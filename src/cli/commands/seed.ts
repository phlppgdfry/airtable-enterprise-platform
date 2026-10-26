/**
 * CLI Command: seed
 * 
 * Provisions enterprise tables and records in Airtable:
 * - Targets workspace wsp3p16CPCotJVZdX
 * - Deploys Enterprise Schema via Metadata API (if base does not exist or table is missing)
 * - Injects realistic enterprise seed data (Projects, Team Members, Tasks, Risks, Audit Log)
 * - Safe fallback to dry-run or mock mode if token is missing
 */

import { logger } from '../utils/logger.js';
import { ENTERPRISE_SCHEMA } from '../../schemas/enterpriseSchema.js';
import {
  SEED_PROJECTS,
  SEED_TEAM,
  SEED_TASKS,
  SEED_RISKS,
  SEED_AUDIT,
} from '../../schemas/enterpriseSeedData.js';
import { AirtableBatchEngine } from '../../client/batchUpsert.js';
import { AirtableMetadataClient } from '../../client/metadataClient.js';

export async function runSeedCommand(options: { baseId?: string; dryRun?: boolean }) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = options.baseId || process.env.AIRTABLE_BASE_ID || 'appEnterpriseShowcase01';
  const workspaceId = process.env.AIRTABLE_WORKSPACE_ID || 'wsp3p16CPCotJVZdX';

  logger.section('Airtable Enterprise Provisioning & Seed Engine');
  logger.keyVal('Target Workspace', workspaceId);
  logger.keyVal('Target Base ID', baseId);
  logger.keyVal('Execution Mode', options.dryRun ? 'DRY RUN (Simulated)' : 'LIVE API EXECUTION');

  if (!apiKey || apiKey.startsWith('pat_your') || options.dryRun) {
    logger.warn('No active AIRTABLE_API_KEY detected in .env (or running with --dry-run).');
    logger.info('Simulating enterprise schema creation and batch upsert workflow...');

    console.log('\n--- Planned Table DDL Migrations ---');
    for (const table of ENTERPRISE_SCHEMA) {
      console.log(` ✔ Table [${table.name}]: ${table.fields.length} fields defined`);
    }

    console.log('\n--- Planned Seed Record Insertion ---');
    console.log(` ✔ Projects: ${SEED_PROJECTS.length} records`);
    console.log(` ✔ Team Members: ${SEED_TEAM.length} records`);
    console.log(` ✔ Tasks & Deliverables: ${SEED_TASKS.length} records`);
    console.log(` ✔ Risk & Governance: ${SEED_RISKS.length} records`);
    console.log(` ✔ Audit Trail Logs: ${SEED_AUDIT.length} records`);

    logger.success('\nDry-run simulation completed successfully!');
    logger.info(`To execute live against https://airtable.com/workspaces/${workspaceId}:`);
    logger.info('1. Set AIRTABLE_API_KEY in your .env file');
    logger.info('2. Run: npm run seed -- --base-id <your-base-id>');
    return;
  }

  // Live execution
  try {
    const metaClient = new AirtableMetadataClient(apiKey);
    const batchEngine = new AirtableBatchEngine(baseId, apiKey);

    logger.info('Verifying base connectivity via Metadata API...');
    const currentSchema = await metaClient.getBaseSchema(baseId);
    const existingTableNames = new Set(currentSchema.tables.map((t) => t.name));

    for (const tableDef of ENTERPRISE_SCHEMA) {
      if (!existingTableNames.has(tableDef.name)) {
        logger.info(`Creating table "${tableDef.name}" via Metadata API...`);
        await metaClient.createTable(baseId, {
          name: tableDef.name,
          description: tableDef.description,
          fields: tableDef.fields,
        });
        logger.success(`Created table "${tableDef.name}"`);
      } else {
        logger.info(`Table "${tableDef.name}" already exists.`);
      }
    }

    logger.info('Injecting seed records via Batch Engine...');
    await batchEngine.batchUpsert('Projects', SEED_PROJECTS as any, ['Project Code']);
    await batchEngine.batchUpsert('Team Members', SEED_TEAM as any, ['Corporate Email']);
    await batchEngine.batchUpsert('Tasks & Deliverables', SEED_TASKS as any, ['Task Key']);
    await batchEngine.batchUpsert('Risk & Governance Log', SEED_RISKS as any, ['Risk ID']);
    await batchEngine.batchCreate('Audit Trail & CDC Logs', SEED_AUDIT as any);

    logger.success('Enterprise Base successfully provisioned and seeded!');
  } catch (err: any) {
    logger.error('Failed to seed base:', err?.response?.data || err?.message || err);
  }
}
