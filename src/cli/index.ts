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
import { runProvisionCommand } from './commands/provision.js';
import { runSeedCommand } from './commands/seed.js';
import { runSchemaExportCommand } from './commands/schemaExport.js';
import { runAuditCommand } from './commands/audit.js';
import { runWebhookManageCommand } from './commands/webhookManage.js';
import { runFormulaCommand } from './commands/formulaPlayground.js';
import { runLinkRelationsCommand } from './commands/linkRelations.js';
import { runDashboardCommand } from './commands/dashboard.js';
import { runBackupCommand } from './commands/backup.js';
import { runRestoreCommand } from './commands/restore.js';
import { runMigrateCommand } from './commands/migrate.js';
import { runDataLintCommand } from './commands/dataLint.js';
import { runWebhookHeartbeat } from '../webhooks/heartbeat.js';
import { runQueryCommand } from './commands/query.js';
import { runDocsGenerateCommand } from './commands/docsGenerate.js';
import { runWebhookSimulateCommand } from './commands/webhookSimulate.js';
import { runInteractiveMenuCommand } from './commands/menu.js';
import { runAICopilotCommand } from './commands/aiCopilot.js';

dotenv.config();

const program = new Command();

program
  .name('airtable-toolkit')
  .description('Airtable Enterprise Engineering CLI — Extensions, Metadata API, Webhooks & Migrations')
  .version('1.0.0');

program
  .command('menu')
  .description('Launch interactive terminal Control Plane & navigation menu')
  .action(() => runInteractiveMenuCommand());

program
  .command('ai:ask [question...]')
  .description('Ask natural language questions to the Airtable AI Copilot')
  .action((args) => runAICopilotCommand(args ? args.join(' ') : undefined));

program
  .command('docs:generate')
  .description('Generate Markdown Data Dictionary (SSOT) from live base schema')
  .action(() => runDocsGenerateCommand());

program
  .command('webhook:simulate')
  .description('Simulate end-to-end Change Data Capture (CDC) and persist event to live Audit Log')
  .action(() => runWebhookSimulateCommand());

program
  .command('migrate <action>')
  .description('Declarative schema migration: plan | apply')
  .option('-b, --base-id <baseId>', 'Target Airtable Base ID')
  .action((action, options) => runMigrateCommand(action as any, options));

program
  .command('data:lint')
  .description('Audit base data against enterprise hygiene & anomaly detection rules')
  .action(() => runDataLintCommand());

program
  .command('webhook:heartbeat')
  .description('Check all webhooks and proactively refresh TTL (<72h remaining)')
  .action(() => runWebhookHeartbeat());

program
  .command('query')
  .description('Query records from any base table with formula filtering')
  .option('-t, --table <tableName>', 'Table name to query', 'Projects')
  .option('-f, --filter <formula>', 'filterByFormula expression')
  .option('-l, --limit <limit>', 'Maximum records to return', (v) => parseInt(v, 10), 10)
  .action((options) => runQueryCommand(options));

program
  .command('dashboard')
  .description('Display real-time terminal executive dashboard with telemetry and KPI meters')
  .action(() => runDashboardCommand());

program
  .command('backup')
  .description('Export complete base snapshot with JSON/NDJSON and checksum manifest')
  .option('-o, --out-dir <outDir>', 'Output directory for snapshot files')
  .action(async (options) => { await runBackupCommand(options); });

program
  .command('restore')
  .description('Restore base from snapshot with SHA-256 verification (supports --dry-run)')
  .option('-s, --snapshot-dir <snapshotDir>', 'Path to snapshot directory containing manifest.json')
  .option('-b, --base-id <baseId>', 'Target Airtable Base ID')
  .option('--dry-run', 'Simulate restoration plan without modifying remote records', false)
  .action(async (options) => { await runRestoreCommand(options); });

program
  .command('provision')
  .description('Automatically create and seed the complete base in your workspace (POST /v0/meta/bases)')
  .option('-t, --token <token>', 'Airtable Personal Access Token (PAT)')
  .option('-w, --workspace-id <workspaceId>', 'Target Workspace ID', process.env.AIRTABLE_WORKSPACE_ID)
  .option('-n, --base-name <baseName>', 'Base Name', 'Enterprise Operations Hub')
  .option('--no-open', 'Do not open browser automatically')
  .action((options) => runProvisionCommand(options));

program
  .command('formula')
  .description('Display enterprise formula snippets with syntax and output examples')
  .option('-c, --category <category>', 'Filter by category (Visualization, Date & Time, Finance, Governance, Text Manipulation)')
  .action((options) => runFormulaCommand(options.category));

program
  .command('link')
  .description('Connect tables with linked record fields and build the relational graph')
  .action(() => runLinkRelationsCommand());

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
