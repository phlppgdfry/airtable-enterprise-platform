import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { AirtableMetadataClient } from '../src/client/metadataClient.js';

async function main() {
  const apiKey = process.env.AIRTABLE_API_KEY!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const client = new AirtableMetadataClient(apiKey);
  const schema = await client.getBaseSchema(baseId);

  console.log(`=== Base Schema for ${baseId} ===`);
  for (const table of schema.tables) {
    console.log(`\nTable: ${table.name} (${table.id})`);
    console.log(`  Description: ${table.description || 'none'}`);
    console.log(`  Fields (${table.fields.length}):`);
    table.fields.forEach((f) => {
      console.log(`    - ${f.name} [${f.type}]`);
    });
    console.log(`  Views (${table.views?.length || 0}):`);
    table.views?.forEach((v: any) => {
      console.log(`    - ${v.name} [${v.type}] (id: ${v.id})`);
    });
  }
}

main().catch(console.error);
