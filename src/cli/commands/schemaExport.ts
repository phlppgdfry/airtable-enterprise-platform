/**
 * CLI Command: schema:export
 * 
 * Introspects Airtable base schema using Metadata API:
 * - Generates JSON schema definition
 * - Generates strongly-typed TypeScript interfaces (.d.ts) for all tables
 * - Includes offline fallback / mock generation
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { AirtableMetadataClient } from '../../client/metadataClient.js';
import { ENTERPRISE_SCHEMA } from '../../schemas/enterpriseSchema.js';

export async function runSchemaExportCommand(options: { baseId?: string; outDir?: string }) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = options.baseId || process.env.AIRTABLE_BASE_ID || 'appEnterpriseShowcase01';
  const outDir = options.outDir || path.resolve(process.cwd(), 'src/generated');

  logger.section('Airtable Schema Introspection & TypeScript Generator');
  logger.keyVal('Target Base ID', baseId);
  logger.keyVal('Output Directory', outDir);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let tables: any[] = [];

  if (!apiKey || apiKey.startsWith('pat_your')) {
    logger.warn('No active AIRTABLE_API_KEY in .env. Generating TypeScript definitions from canonical Enterprise Schema.');
    tables = ENTERPRISE_SCHEMA;
  } else {
    try {
      const metaClient = new AirtableMetadataClient(apiKey);
      logger.info('Fetching live schema from Metadata API...');
      const res = await metaClient.getBaseSchema(baseId);
      tables = res.tables;
    } catch (err: any) {
      logger.warn(`Could not reach Metadata API (${err.message}). Falling back to canonical Enterprise Schema.`);
      tables = ENTERPRISE_SCHEMA;
    }
  }

  // 1. Write JSON Schema
  const jsonPath = path.join(outDir, 'airtable-schema.json');
  fs.writeFileSync(jsonPath, JSON.stringify(tables, null, 2), 'utf-8');
  logger.success(`Wrote schema JSON -> ${jsonPath}`);

  // 2. Generate TypeScript Interfaces
  let tsContent = `/**\n * Auto-generated Airtable TypeScript Type Definitions\n * Generated: ${new Date().toISOString()}\n */\n\n`;

  for (const table of tables) {
    const interfaceName = table.name.replace(/[^a-zA-Z0-9]/g, '');
    tsContent += `export interface AirtableRecord${interfaceName} {\n  id: string;\n  fields: {\n`;

    for (const field of table.fields) {
      let tsType = 'any';
      if (['singleLineText', 'multilineText', 'singleSelect', 'email', 'url', 'phoneNumber'].includes(field.type)) {
        tsType = 'string';
      } else if (['number', 'currency', 'percent', 'rating', 'autoNumber'].includes(field.type)) {
        tsType = 'number';
      } else if (['checkbox'].includes(field.type)) {
        tsType = 'boolean';
      } else if (['multipleSelects', 'multipleRecordLinks', 'multipleAttachments'].includes(field.type)) {
        tsType = 'string[]';
      } else if (['date', 'dateTime', 'createdTime', 'lastModifiedTime'].includes(field.type)) {
        tsType = 'string';
      }

      tsContent += `    '${field.name}'?: ${tsType};\n`;
    }

    tsContent += `  };\n}\n\n`;
  }

  const tsPath = path.join(outDir, 'airtable-schema.d.ts');
  fs.writeFileSync(tsPath, tsContent, 'utf-8');
  logger.success(`Wrote TypeScript definitions -> ${tsPath}`);
}
