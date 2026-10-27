/**
 * CLI Command: query
 * 
 * Interactive Terminal Query Engine for Airtable:
 * - Query records from any base table with formula filtering (filterByFormula)
 * - Select specific fields, limits, and sort orders
 * - Beautiful tabular terminal output
 */

import axios from 'axios';
import { table as renderTable } from 'table';
import { logger } from '../utils/logger.js';

export interface QueryOptions {
  table?: string;
  filter?: string;
  limit?: number;
}

export async function runQueryCommand(options: QueryOptions) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    logger.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env');
    return;
  }

  const tableName = options.table || 'Projects';
  const limit = options.limit || 10;

  logger.section(`Airtable Query Engine: [${tableName}]`);
  logger.keyVal('Base ID', baseId);
  if (options.filter) {
    logger.keyVal('Formula Filter', options.filter);
  }

  const client = axios.create({
    baseURL: `https://api.airtable.com/v0/${baseId}`,
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  try {
    let url = `/${encodeURIComponent(tableName)}?maxRecords=${limit}`;
    if (options.filter) {
      url += `&filterByFormula=${encodeURIComponent(options.filter)}`;
    }

    const response = await client.get(url);
    const records = response.data.records;

    if (records.length === 0) {
      logger.warn(`No records matched query on table "${tableName}".`);
      return;
    }

    // Extract first 4 non-empty field names for clean display
    const sampleFields = Object.keys(records[0].fields).slice(0, 5);
    const tableData = [['Record ID', ...sampleFields]];

    for (const r of records) {
      const row = [r.id];
      for (const f of sampleFields) {
        const val = r.fields[f];
        if (Array.isArray(val)) {
          row.push(val.join(', ').slice(0, 25));
        } else if (typeof val === 'object' && val !== null) {
          row.push(JSON.stringify(val).slice(0, 25));
        } else {
          row.push(String(val ?? '-').slice(0, 25));
        }
      }
      tableData.push(row);
    }

    console.log(renderTable(tableData));
    logger.success(`Returned ${records.length} records.`);
  } catch (err: any) {
    logger.error('Query execution failed:', err?.response?.data || err?.message || err);
  }
}
