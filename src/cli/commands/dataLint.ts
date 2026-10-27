/**
 * CLI Command: data:lint
 * 
 * Executes enterprise data governance & hygiene linter:
 * - Scans all records across tables in the base
 * - Evaluates integrity rules, foreign key links, and logic inversions
 * - Outputs Executive Data Quality Scorecard and remediation checklist
 */

import axios from 'axios';
import chalk from 'chalk';
import { table as renderTable } from 'table';
import { logger } from '../utils/logger.js';
import { EnterpriseDataLinter } from '../../quality/dataLinter.js';

export async function runDataLintCommand() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    logger.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env');
    return;
  }

  logger.section('Airtable Enterprise Data Governance & Quality Linter');
  logger.keyVal('Scanning Base ID', baseId);

  const client = axios.create({
    baseURL: `https://api.airtable.com/v0/${baseId}`,
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  try {
    const [prjRes, teamRes, taskRes, riskRes] = await Promise.all([
      client.get('/Projects'),
      client.get('/Team%20Members'),
      client.get('/Tasks%20%26%20Deliverables'),
      client.get('/Risk%20%26%20Governance%20Log'),
    ]);

    const report = EnterpriseDataLinter.lint({
      projects: prjRes.data.records,
      teamMembers: teamRes.data.records,
      tasks: taskRes.data.records,
      risks: riskRes.data.records,
    });

    console.log('\n' + chalk.cyan.bold('╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold(`║       DATA GOVERNANCE SCORECARD:  GRADE ${chalk.white.bold(report.grade)}  (${report.score}/100)        ║`));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════╝'));

    console.log(`  Total Entities Inspected: ${chalk.bold(report.totalChecked)}`);
    console.log(`  Critical Violations:      ${report.summary.criticalCount === 0 ? chalk.green('0') : chalk.red(report.summary.criticalCount)}`);
    console.log(`  Warnings:                 ${report.summary.warningCount === 0 ? chalk.green('0') : chalk.yellow(report.summary.warningCount)}`);
    console.log(`  Notices:                  ${chalk.blue(report.summary.noticeCount)}\n`);

    if (report.findings.length === 0) {
      logger.success('🎉 Base Data is 100% compliant with Enterprise Governance standards!');
      return;
    }

    const tableRows = [['Severity', 'Table', 'Record', 'Violation', 'Remediation']];
    for (const f of report.findings) {
      const sevColor =
        f.severity === 'CRITICAL' ? chalk.red.bold : f.severity === 'WARNING' ? chalk.yellow : chalk.blue;
      tableRows.push([
        sevColor(f.severity),
        f.tableName,
        f.recordIdentifier,
        f.message.slice(0, 40),
        chalk.gray(f.remediation.slice(0, 45)),
      ]);
    }

    console.log(renderTable(tableRows));
  } catch (err: any) {
    logger.error('Failed to run data linter on live base:', err?.response?.data || err?.message || err);
  }
}
