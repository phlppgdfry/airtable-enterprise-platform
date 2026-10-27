/**
 * CLI Command: docs:generate
 * 
 * Programmatically generates an Enterprise Data Dictionary (Markdown)
 * directly from live base schema via Metadata API:
 * - Documents every table, primary key, and field type
 * - Catalogs select choices and relationships
 * - Outputs to docs/DATA_DICTIONARY.md
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { AirtableMetadataClient } from '../../client/metadataClient.js';

export async function runDocsGenerateCommand() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    logger.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env');
    return;
  }

  logger.section('Airtable Data Dictionary Generator');
  logger.keyVal('Target Base ID', baseId);

  const client = new AirtableMetadataClient(apiKey);
  logger.info('Fetching live schema from Metadata API...');
  const schema = await client.getBaseSchema(baseId);

  let md = `# 📖 Enterprise Data Dictionary\n\n`;
  md += `> **Base ID:** \`${baseId}\`  \n`;
  md += `> **Live URL:** [https://airtable.com/${baseId}](https://airtable.com/${baseId})  \n`;
  md += `> **Generated:** ${new Date().toISOString()} via \`airtable-toolkit docs:generate\`\n\n`;
  md += `This document serves as the single source of truth (SSOT) for data architects, analytics engineers, and integration developers.\n\n`;
  md += `## Table Summary\n\n`;
  md += `| Table Name | Table ID | Fields Count | Primary Field |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;

  for (const t of schema.tables) {
    const primary = t.fields.find((f) => f.id === t.primaryFieldId)?.name || t.fields[0]?.name || '-';
    md += `| **${t.name}** | \`${t.id}\` | ${t.fields.length} | \`${primary}\` |\n`;
  }

  md += `\n---\n\n## Table Specifications\n\n`;

  for (const t of schema.tables) {
    md += `### Table: \`${t.name}\`\n\n`;
    md += `* **Table ID:** \`${t.id}\`\n`;
    if (t.description) md += `* **Description:** ${t.description}\n`;
    md += `\n| Field Name | Type | Options / Choices | Field ID |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;

    for (const f of t.fields) {
      let optStr = '-';
      if (f.options?.choices) {
        optStr = f.options.choices.map((c: any) => `\`${c.name}\``).join(', ');
      } else if (f.options?.linkedTableId) {
        optStr = `Linked Table: \`${f.options.linkedTableId}\``;
      } else if (f.options?.symbol) {
        optStr = `Symbol: ${f.options.symbol}`;
      }
      md += `| **${f.name}** | \`${f.type}\` | ${optStr} | \`${f.id}\` |\n`;
    }
    md += `\n`;
  }

  const outPath = path.resolve(process.cwd(), 'docs/DATA_DICTIONARY.md');
  fs.writeFileSync(outPath, md, 'utf-8');
  logger.success(`Data Dictionary generated -> ${outPath}`);
}
