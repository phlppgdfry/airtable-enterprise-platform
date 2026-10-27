/**
 * CLI Command: menu
 * 
 * Interactive Terminal Control Plane & Navigator:
 * - Menu-driven terminal interface
 * - Quick launch for all platform capabilities (dashboard, linter, query, migrations, backup)
 */

import readline from 'readline';
import chalk from 'chalk';
import { runDashboardCommand } from './dashboard.js';
import { runDataLintCommand } from './dataLint.js';
import { runQueryCommand } from './query.js';
import { runMigrateCommand } from './migrate.js';
import { runBackupCommand } from './backup.js';
import { runFormulaCommand } from './formulaPlayground.js';
import { runDocsGenerateCommand } from './docsGenerate.js';
import { runWebhookSimulateCommand } from './webhookSimulate.js';
import { runAICopilotCommand } from './aiCopilot.js';

export async function runInteractiveMenuCommand() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const baseId = process.env.AIRTABLE_BASE_ID || 'app03l5bkNRgzjWv4';

  console.clear();
  console.log(chalk.cyan.bold('╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           ⚡ AIRTABLE ENTERPRISE PLATFORM — CONTROL PLANE            ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝'));
  console.log(`  Base ID: ${chalk.bold(baseId)}  •  URL: ${chalk.underline(`https://airtable.com/${baseId}`)}\n`);

  console.log(chalk.yellow.bold('Select an action:'));
  console.log(`  ${chalk.cyan('1.')} 📊 View Executive Live Dashboard`);
  console.log(`  ${chalk.cyan('2.')} 🛡  Run Data Governance & Quality Linter`);
  console.log(`  ${chalk.cyan('3.')} 🤖 Ask AI Copilot (Natural Language Analysis)`);
  console.log(`  ${chalk.cyan('4.')} 🔍 Query Table Records (filterByFormula)`);
  console.log(`  ${chalk.cyan('5.')} 📐 Inspect Schema Drift (Migrate Plan)`);
  console.log(`  ${chalk.cyan('6.')} 💾 Generate Disaster Recovery Snapshot (Backup)`);
  console.log(`  ${chalk.cyan('7.')} 📖 Generate Markdown Data Dictionary`);
  console.log(`  ${chalk.cyan('8.')} 🧮 Explore Enterprise Formulas`);
  console.log(`  ${chalk.cyan('9.')} ⚡ Simulate Webhook CDC Transaction`);
  console.log(`  ${chalk.cyan('0.')} 🚪 Exit\n`);

  rl.question(chalk.green('Enter choice (0-9): '), async (answer) => {
    rl.close();
    const choice = answer.trim();

    switch (choice) {
      case '1':
        await runDashboardCommand();
        break;
      case '2':
        await runDataLintCommand();
        break;
      case '3':
        await runAICopilotCommand();
        break;
      case '4':
        await runQueryCommand({ table: 'Projects' });
        break;
      case '5':
        await runMigrateCommand('plan', {});
        break;
      case '6':
        await runBackupCommand({});
        break;
      case '7':
        await runDocsGenerateCommand();
        break;
      case '8':
        await runFormulaCommand();
        break;
      case '9':
        await runWebhookSimulateCommand();
        break;
      case '0':
        console.log(chalk.gray('Goodbye!'));
        process.exit(0);
      default:
        console.log(chalk.red('Invalid selection. Exiting.'));
        process.exit(1);
    }
  });
}
