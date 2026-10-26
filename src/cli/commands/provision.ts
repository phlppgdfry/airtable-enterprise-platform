/**
 * CLI Command: provision
 * 
 * Automatically creates and seeds a complete Airtable Base in a target workspace
 * via Airtable Metadata API (POST /v0/meta/bases):
 * 1. Creates the base "Enterprise Operations Hub" in workspace wsp3p16CPCotJVZdX
 * 2. Deploys all 5 enterprise tables and fields in a single atomic transaction
 * 3. Writes AIRTABLE_BASE_ID to .env
 * 4. Seeds all tables with realistic enterprise records
 * 5. Automatically launches the base URL in your browser
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { logger } from '../utils/logger.js';
import { ENTERPRISE_SCHEMA } from '../../schemas/enterpriseSchema.js';
import {
  SEED_PROJECTS,
  SEED_TEAM,
  SEED_TASKS,
  SEED_RISKS,
  SEED_AUDIT,
} from '../../schemas/enterpriseSeedData.js';
import { AirtableMetadataClient } from '../../client/metadataClient.js';
import { AirtableBatchEngine } from '../../client/batchUpsert.js';

export interface ProvisionOptions {
  token?: string;
  workspaceId?: string;
  baseName?: string;
  openBrowser?: boolean;
}

export async function runProvisionCommand(options: ProvisionOptions) {
  const token = options.token || process.env.AIRTABLE_API_KEY;
  const workspaceId = options.workspaceId || process.env.AIRTABLE_WORKSPACE_ID || 'wsp3p16CPCotJVZdX';
  const baseName = options.baseName || 'Enterprise Operations Hub';

  logger.section('Airtable Enterprise Workspace Provisioner');
  logger.keyVal('Target Workspace', `https://airtable.com/workspaces/${workspaceId}`);
  logger.keyVal('Base Name', baseName);

  if (!token || token.startsWith('pat_your')) {
    logger.warn('\nGeen actieve AIRTABLE_API_KEY gevonden.');
    console.log(`
Om deze complete enterprise base direct zichtbaar te maken in je Airtable workspace:

Optie A: 1-Click Automatische API Setup (30 seconden)
------------------------------------------------------
1. Open: https://airtable.com/create/tokens
2. Klik op "+ Create token", geef de naam "Enterprise CLI"
3. Voeg de volgende scopes toe:
   - data.records:read & data.records:write
   - schema.bases:read & schema.bases:write
   - webhook:manage & block:manage
4. Selecteer onder "Access" jouw workspace: "${workspaceId}" (of All workspaces)
5. Voer dit commando uit:
   npm run provision -- --token <JOUW_TOKEN_HIER>

Optie B: Direct Handmatig Importeren via CSV (Zonder Token!)
-----------------------------------------------------------
Er staan 5 kant-en-klare enterprise CSV-bestanden voor je klaar in:
data/csv/
  ├── 01_Projects.csv
  ├── 02_Team_Members.csv
  ├── 03_Tasks_Deliverables.csv
  ├── 04_Risk_Governance_Log.csv
  └── 05_Audit_Trail_CDC_Logs.csv

Ga naar https://airtable.com/workspaces/${workspaceId}
Klik op "Create base" -> "Import data" -> "CSV file" en sleep de bestanden erin!
`);
    return;
  }

  try {
    const metaClient = new AirtableMetadataClient(token);
    logger.info(`Creating base "${baseName}" in workspace ${workspaceId} via Metadata API...`);

    const newBase = await metaClient.createBase(workspaceId, baseName, ENTERPRISE_SCHEMA);
    const baseId = newBase.id;
    const baseWebUrl = `https://airtable.com/${baseId}`;

    logger.success(`Base created successfully! ID: ${baseId}`);
    logger.keyVal('Direct Airtable URL', baseWebUrl);

    // Save to .env
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    if (envContent.includes('AIRTABLE_BASE_ID=')) {
      envContent = envContent.replace(/AIRTABLE_BASE_ID=.*/g, `AIRTABLE_BASE_ID=${baseId}`);
    } else {
      envContent += `\nAIRTABLE_BASE_ID=${baseId}`;
    }

    if (!envContent.includes('AIRTABLE_API_KEY=')) {
      envContent += `\nAIRTABLE_API_KEY=${token}`;
    } else if (envContent.includes('AIRTABLE_API_KEY=pat_your')) {
      envContent = envContent.replace(/AIRTABLE_API_KEY=.*/g, `AIRTABLE_API_KEY=${token}`);
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
    logger.success('Updated .env with active Base ID and credentials.');

    // Seed records
    logger.info('Injecting enterprise seed records into newly provisioned base...');
    const batchEngine = new AirtableBatchEngine(baseId, token);

    await batchEngine.batchUpsert('Projects', SEED_PROJECTS as any, ['Project Code']);
    await batchEngine.batchUpsert('Team Members', SEED_TEAM as any, ['Corporate Email']);
    await batchEngine.batchUpsert('Tasks & Deliverables', SEED_TASKS as any, ['Task Key']);
    await batchEngine.batchUpsert('Risk & Governance Log', SEED_RISKS as any, ['Risk ID']);
    await batchEngine.batchCreate('Audit Trail & CDC Logs', SEED_AUDIT as any);

    logger.success('All tables seeded with rich enterprise records!');
    logger.section('🎉 Provisioning Complete!');
    logger.info(`Open je base direct in Airtable: ${baseWebUrl}`);

    if (options.openBrowser !== false) {
      exec(`open "${baseWebUrl}"`);
    }
  } catch (error: any) {
    logger.error('Failed to provision base:', error?.response?.data || error?.message || error);
  }
}
