/**
 * Enterprise Type-Safe Airtable Repository Client ("Prisma for Airtable")
 * 
 * Provides strongly-typed CRUD repositories and domain query helpers
 * for each table in the Enterprise Platform.
 */

import axios, { AxiosInstance } from 'axios';
import { AirtableRateLimiter, globalRateLimiter } from '../cli/utils/rateLimiter.js';
import {
  AirtableRecordProjects,
  AirtableRecordTeamMembers,
  AirtableRecordTasksDeliverables,
  AirtableRecordRiskGovernanceLog,
  AirtableRecordAuditTrailCDCLogs,
} from '../generated/airtable-schema.js';

export class EnterpriseTypedClient {
  private client: AxiosInstance;
  private rateLimiter: AirtableRateLimiter;

  constructor(baseId: string, apiKey: string, rateLimiter?: AirtableRateLimiter) {
    this.rateLimiter = rateLimiter ?? globalRateLimiter;
    this.client = axios.create({
      baseURL: `https://api.airtable.com/v0/${baseId}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  // --- Projects Repository ---
  public projects = {
    list: async (filterFormula?: string): Promise<AirtableRecordProjects[]> => {
      const query = filterFormula ? `?filterByFormula=${encodeURIComponent(filterFormula)}` : '';
      const res = await this.rateLimiter.execute(() => this.client.get(`/Projects${query}`));
      return res.data.records;
    },
    findByCode: async (code: string): Promise<AirtableRecordProjects | null> => {
      const records = await this.projects.list(`{Project Code} = '${code}'`);
      return records[0] || null;
    },
    listMissionCritical: async (): Promise<AirtableRecordProjects[]> => {
      return this.projects.list(`{Priority} = 'P0 - Mission Critical'`);
    },
  };

  // --- Team Members Repository ---
  public team = {
    list: async (): Promise<AirtableRecordTeamMembers[]> => {
      const res = await this.rateLimiter.execute(() => this.client.get('/Team%20Members'));
      return res.data.records;
    },
    listActive: async (): Promise<AirtableRecordTeamMembers[]> => {
      const res = await this.rateLimiter.execute(() =>
        this.client.get('/Team%20Members?filterByFormula={Is Active} = 1')
      );
      return res.data.records;
    },
    findByEmail: async (email: string): Promise<AirtableRecordTeamMembers | null> => {
      const res = await this.rateLimiter.execute(() =>
        this.client.get(`/Team%20Members?filterByFormula={Corporate Email} = '${email}'`)
      );
      return res.data.records[0] || null;
    },
  };

  // --- Tasks & Deliverables Repository ---
  public tasks = {
    list: async (filterFormula?: string): Promise<AirtableRecordTasksDeliverables[]> => {
      const query = filterFormula ? `?filterByFormula=${encodeURIComponent(filterFormula)}` : '';
      const res = await this.rateLimiter.execute(() =>
        this.client.get(`/Tasks%20%26%20Deliverables${query}`)
      );
      return res.data.records;
    },
    listInFlight: async (): Promise<AirtableRecordTasksDeliverables[]> => {
      return this.tasks.list(`OR({Workflow Stage} = 'In Progress', {Workflow Stage} = 'Code Review')`);
    },
    create: async (fields: Record<string, any>): Promise<AirtableRecordTasksDeliverables> => {
      const res = await this.rateLimiter.execute(() =>
        this.client.post('/Tasks%20%26%20Deliverables', { fields })
      );
      return res.data;
    },
    update: async (recordId: string, fields: Record<string, any>): Promise<AirtableRecordTasksDeliverables> => {
      const res = await this.rateLimiter.execute(() =>
        this.client.patch(`/Tasks%20%26%20Deliverables/${recordId}`, { fields })
      );
      return res.data;
    },
  };

  // --- Risk & Governance Repository ---
  public risks = {
    list: async (): Promise<AirtableRecordRiskGovernanceLog[]> => {
      const res = await this.rateLimiter.execute(() =>
        this.client.get('/Risk%20%26%20Governance%20Log')
      );
      return res.data.records;
    },
    listCritical: async (): Promise<AirtableRecordRiskGovernanceLog[]> => {
      const res = await this.rateLimiter.execute(() =>
        this.client.get(
          `/Risk%20%26%20Governance%20Log?filterByFormula=OR({Severity} = 'Critical', {Severity} = 'Major')`
        )
      );
      return res.data.records;
    },
    create: async (fields: Record<string, any>): Promise<AirtableRecordRiskGovernanceLog> => {
      const res = await this.rateLimiter.execute(() =>
        this.client.post('/Risk%20%26%20Governance%20Log', { fields })
      );
      return res.data;
    },
    update: async (recordId: string, fields: Record<string, any>): Promise<AirtableRecordRiskGovernanceLog> => {
      const res = await this.rateLimiter.execute(() =>
        this.client.patch(`/Risk%20%26%20Governance%20Log/${recordId}`, { fields })
      );
      return res.data;
    },
  };

  // --- Audit Trail Repository ---
  public audit = {
    listRecent: async (limit: number = 20): Promise<AirtableRecordAuditTrailCDCLogs[]> => {
      const res = await this.rateLimiter.execute(() =>
        this.client.get(`/Audit%20Trail%20%26%20CDC%20Logs?maxRecords=${limit}`)
      );
      return res.data.records;
    },
    create: async (fields: Record<string, any>): Promise<AirtableRecordAuditTrailCDCLogs> => {
      const res = await this.rateLimiter.execute(() =>
        this.client.post('/Audit%20Trail%20%26%20CDC%20Logs', { fields })
      );
      return res.data;
    },
  };
}
