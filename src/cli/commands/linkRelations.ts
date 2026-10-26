/**
 * CLI Command: link:relations
 * 
 * Programmatically upgrades flat tables into a fully interconnected Relational Schema:
 * 1. Creates Linked Record field: Tasks & Deliverables -> Projects
 * 2. Creates Linked Record field: Tasks & Deliverables -> Assignee (Team Members)
 * 3. Creates Linked Record field: Risk & Governance Log -> Projects
 * 4. Automatically establishes relationships across existing seed records
 */

import { logger } from '../utils/logger.js';
import { AirtableMetadataClient } from '../../client/metadataClient.js';
import { AirtableBatchEngine } from '../../client/batchUpsert.js';
import axios from 'axios';

export async function runLinkRelationsCommand() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    logger.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env');
    return;
  }

  logger.section('Airtable Relational Link Architect');
  logger.keyVal('Target Base ID', baseId);

  const metaClient = new AirtableMetadataClient(apiKey);
  const schema = await metaClient.getBaseSchema(baseId);

  const projectTable = schema.tables.find((t) => t.name === 'Projects');
  const teamTable = schema.tables.find((t) => t.name === 'Team Members');
  const taskTable = schema.tables.find((t) => t.name === 'Tasks & Deliverables');
  const riskTable = schema.tables.find((t) => t.name === 'Risk & Governance Log');

  if (!projectTable || !teamTable || !taskTable || !riskTable) {
    logger.error('One or more required enterprise tables not found.');
    return;
  }

  const existingTaskFieldNames = new Set(taskTable.fields.map((f) => f.name));
  const existingRiskFieldNames = new Set(riskTable.fields.map((f) => f.name));

  // 1. Link Tasks -> Project
  if (!existingTaskFieldNames.has('Project')) {
    logger.info('Creating linked relationship: Tasks & Deliverables -> Projects...');
    await metaClient.createField(baseId, taskTable.id!, {
      name: 'Project',
      description: 'Parent project association',
      type: 'multipleRecordLinks',
      options: {
        linkedTableId: projectTable.id!,
      },
    });
    logger.success('Created "Project" link field on Tasks & Deliverables.');
  } else {
    logger.info('Field "Project" already exists on Tasks & Deliverables.');
  }

  // 2. Link Tasks -> Assignee (Team Members)
  if (!existingTaskFieldNames.has('Assignee')) {
    logger.info('Creating linked relationship: Tasks & Deliverables -> Team Members...');
    await metaClient.createField(baseId, taskTable.id!, {
      name: 'Assignee',
      description: 'Assigned engineering talent',
      type: 'multipleRecordLinks',
      options: {
        linkedTableId: teamTable.id!,
      },
    });
    logger.success('Created "Assignee" link field on Tasks & Deliverables.');
  } else {
    logger.info('Field "Assignee" already exists on Tasks & Deliverables.');
  }

  // 3. Link Risk -> Project
  if (!existingRiskFieldNames.has('Related Project')) {
    logger.info('Creating linked relationship: Risk & Governance Log -> Projects...');
    await metaClient.createField(baseId, riskTable.id!, {
      name: 'Related Project',
      description: 'Impacted strategic initiative',
      type: 'multipleRecordLinks',
      options: {
        linkedTableId: projectTable.id!,
      },
    });
    logger.success('Created "Related Project" link field on Risk & Governance Log.');
  } else {
    logger.info('Field "Related Project" already exists on Risk & Governance Log.');
  }

  // 4. Populate record links
  logger.info('Populating relational foreign keys across existing records...');
  const client = axios.create({
    baseURL: `https://api.airtable.com/v0/${baseId}`,
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const [projectsRes, teamRes, tasksRes, risksRes] = await Promise.all([
    client.get('/Projects'),
    client.get('/Team%20Members'),
    client.get('/Tasks%20%26%20Deliverables'),
    client.get('/Risk%20%26%20Governance%20Log'),
  ]);

  const projects = projectsRes.data.records;
  const team = teamRes.data.records;
  const tasks = tasksRes.data.records;
  const risks = risksRes.data.records;

  const prjAi = projects.find((p: any) => p.fields['Project Code'] === 'PRJ-2026-AI-01');
  const prjData = projects.find((p: any) => p.fields['Project Code'] === 'PRJ-2026-DATA-02');
  const memberPhilippe = team.find((m: any) => m.fields['Full Name'] === 'Philippe Godfroy');
  const memberElena = team.find((m: any) => m.fields['Full Name'] === 'Elena Vance');

  const taskUpdates: any[] = [];
  for (const task of tasks) {
    const key = task.fields['Task Key'];
    const fieldsToUpdate: any = {};

    if (key === 'TSK-AI-001' || key === 'TSK-AI-002') {
      if (prjAi) fieldsToUpdate['Project'] = [prjAi.id];
      if (memberPhilippe) fieldsToUpdate['Assignee'] = [memberPhilippe.id];
    } else if (key === 'TSK-DATA-003' || key === 'TSK-SEC-004') {
      if (prjData) fieldsToUpdate['Project'] = [prjData.id];
      if (memberElena) fieldsToUpdate['Assignee'] = [memberElena.id];
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      taskUpdates.push({ id: task.id, fields: fieldsToUpdate });
    }
  }

  const batchEngine = new AirtableBatchEngine(baseId, apiKey);
  if (taskUpdates.length > 0) {
    await batchEngine.batchUpdate('Tasks & Deliverables', taskUpdates);
    logger.success(`Linked ${taskUpdates.length} tasks to Projects and Assignees!`);
  }

  // Link Risks
  const riskUpdates: any[] = [];
  for (const risk of risks) {
    if (prjAi) {
      riskUpdates.push({ id: risk.id, fields: { 'Related Project': [prjAi.id] } });
    }
  }
  if (riskUpdates.length > 0) {
    await batchEngine.batchUpdate('Risk & Governance Log', riskUpdates);
    logger.success(`Linked ${riskUpdates.length} risks to Strategic Projects!`);
  }

  logger.section('🎉 Relational Graph Active!');
  logger.info(`Open your base to see 2-way linked records: https://airtable.com/${baseId}`);
}
