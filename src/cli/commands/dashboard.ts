/**
 * CLI Command: dashboard
 * 
 * Interactive Enterprise Terminal Executive Dashboard:
 * - Live overview of workspace and base metrics
 * - Real-time table counts and record summaries
 * - Project portfolio status & budget burn gauge
 * - Team capacity & resource allocation meters
 */

import { table as renderTable } from 'table';
import chalk from 'chalk';
import axios from 'axios';
import { logger } from '../utils/logger.js';

export async function runDashboardCommand() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    logger.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env');
    return;
  }

  const client = axios.create({
    baseURL: `https://api.airtable.com/v0/${baseId}`,
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 15000,
  });

  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           ⚡ AIRTABLE ENTERPRISE PLATFORM — EXECUTIVE DASHBOARD            ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════════════════════╝'));
  console.log(`  Base ID: ${chalk.bold(baseId)}  •  URL: ${chalk.underline(`https://airtable.com/${baseId}`)}\n`);

  try {
    const [prjRes, teamRes, tasksRes, riskRes, auditRes] = await Promise.all([
      client.get('/Projects'),
      client.get('/Team%20Members'),
      client.get('/Tasks%20%26%20Deliverables'),
      client.get('/Risk%20%26%20Governance%20Log'),
      client.get('/Audit%20Trail%20%26%20CDC%20Logs'),
    ]);

    const projects = prjRes.data.records;
    const team = teamRes.data.records;
    const tasks = tasksRes.data.records;
    const risks = riskRes.data.records;
    const audits = auditRes.data.records;

    // 1. Table Statistics
    console.log(chalk.yellow.bold('▶ 📊 Database Schema & Records Overview:'));
    const statsData = [
      ['Table Name', 'Records', 'Type', 'Status'],
      ['Projects', String(projects.length), 'Portfolio Management', chalk.green('● Active')],
      ['Team Members', String(team.length), 'Talent & Capacity', chalk.green('● Active')],
      ['Tasks & Deliverables', String(tasks.length), 'WBS Work Packages', chalk.green('● Active')],
      ['Risk & Governance Log', String(risks.length), 'Enterprise Risks', chalk.green('● Active')],
      ['Audit Trail & CDC Logs', String(audits.length), 'Immutable Log Stream', chalk.green('● Active')],
    ];
    console.log(renderTable(statsData));

    // 2. Project Portfolio Budget & Progress
    console.log(chalk.yellow.bold('▶ 🚀 Strategic Initiatives & Budget Burn:'));
    let totalBudget = 0;
    let totalSpent = 0;

    const prjRows = [['Code', 'Project Name', 'Priority', 'Status', 'Allocated', 'Spent', 'Burn %']];
    for (const p of projects) {
      const f = p.fields;
      const budget = Number(f['Budget Allocated (€)']) || 0;
      const spent = Number(f['Budget Spent (€)']) || 0;
      totalBudget += budget;
      totalSpent += spent;
      const burnPct = budget > 0 ? Math.round((spent / budget) * 100) : 0;

      prjRows.push([
        f['Project Code'] || '-',
        (f['Project Name'] || '').slice(0, 32),
        f['Priority'] || '-',
        f['Status'] || '-',
        `€${budget.toLocaleString()}`,
        `€${spent.toLocaleString()}`,
        `${burnPct}%`,
      ]);
    }
    console.log(renderTable(prjRows));
    console.log(
      `  Total Capex Allocated: ${chalk.bold('€' + totalBudget.toLocaleString())} | Spent: ${chalk.bold('€' + totalSpent.toLocaleString())} (${Math.round((totalSpent / totalBudget) * 100)}% portfolio burn)\n`
    );

    // 3. Team Member Capacity & Utilization
    console.log(chalk.yellow.bold('▶ 👥 Engineering Talent & Weekly Bandwidth:'));
    const teamRows = [['Member', 'Department', 'Role', 'Capacity', 'Status']];
    for (const m of team) {
      const f = m.fields;
      teamRows.push([
        f['Full Name'] || '-',
        f['Department'] || '-',
        f['Role Level'] || '-',
        `${f['Weekly Capacity (Hours)']} hrs`,
        f['Is Active'] ? chalk.green('Available') : chalk.gray('Inactive'),
      ]);
    }
    console.log(renderTable(teamRows));

    logger.success('Live base telemetry synced successfully!');
  } catch (err: any) {
    logger.error('Failed to retrieve live metrics from Airtable:', err?.response?.data || err?.message || err);
  }
}
