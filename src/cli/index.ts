#!/usr/bin/env node

/**
 * Airtable Enterprise Platform CLI
 * 
 * Developer and Operations CLI for Airtable enterprise lifecycle:
 * - seed: provisions schema & realistic enterprise data
 * - schema:export: introspects live base and exports TypeScript definitions
 * - audit: health-checks schema conventions and relationships
 * - webhook: manages enterprise webhooks (list, create, refresh)
 */

import { Command } from 'commander';
import dotenv from 'dotenv';
import { runSeedCommand } from './commands/seed.js';
import { runSchemaExportCommand } from './commands/schemaExport.js';
import { runAuditCommand } from './commands/audit.js';
import { runWebhookManageCommand } from './commands/webhookManage.js';

dotenv.config();

const program = new Command();

program
  .name('airtable-toolkit')
  .description('Airtable Enterprise Engineering CLI — Extensions, Metadata API, Webhooks & Migrations')
  .version('1.0.0');

program
  .command('seed')
  .description('Provision enterprise tables and seed records in target workspace')
  .option('-b, --base-id <baseId>', 'Target Airtable Base ID')
  .option('--dry-run', 'Simulate migration without modifying remote base', false)
  .action((options) => runSeedCommand(options));

program
  .command('schema:export')
  .description('Introspect base schema via Metadata API and generate TypeScript interfaces')
  .option('-b, --base-id <baseId>', 'Target Airtable Base ID')
  .option('-o, --out-dir <outDir>', 'Output directory for generated files')
  .action((options) => runSchemaExportCommand(options));

program
  .command('audit')
  .description('Perform structural, governance, and health audit on base schema')
  .option('-b, --base-id <baseId>', 'Target Airtable Base ID')
  .action((options) => runAuditCommand(options));

program
  .command('webhook')
  .description('Manage enterprise Airtable webhooks')
  .argument('<action>', 'list | create | refresh')
  .option('-b, --base-id <baseId>', 'Target Airtable Base ID')
  .option('-u, --url <url>', 'Webhook notification destination URL')
  .option('-w, --webhook-id <webhookId>', 'Specific webhook ID for refresh')
  .action((action, options) => runWebhookManageCommand(action as any, options));

program.parse(process.argv);
