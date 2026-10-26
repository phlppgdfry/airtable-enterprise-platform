/**
 * Enterprise Airtable Metadata & Schema API Client
 * 
 * Provides complete programmatic access to:
 * - Base schema discovery and introspection
 * - Declarative Table & Field DDL migrations
 * - Enterprise Webhook lifecycle (Create, List, Refresh, Payloads)
 */

import axios, { AxiosInstance } from 'axios';
import { AirtableRateLimiter, globalRateLimiter } from '../cli/utils/rateLimiter.js';

export interface AirtableFieldSchema {
  id?: string;
  name: string;
  type: string;
  description?: string;
  options?: Record<string, any>;
}

export interface AirtableTableSchema {
  id?: string;
  name: string;
  description?: string;
  primaryFieldId?: string;
  fields: AirtableFieldSchema[];
  views?: Array<{ id: string; name: string; type: string }>;
}

export interface AirtableBaseSchemaResponse {
  tables: AirtableTableSchema[];
}

export interface WebhookSpecification {
  options: {
    filters: {
      dataTypes: ('tableData' | 'tableFields' | 'tableMetadata')[];
      recordChangeScope?: string;
      watchDataInFieldIds?: string[];
      fromSources?: ('client' | 'publicApi' | 'formSubmission' | 'automation' | 'sync')[];
    };
  };
}

export class AirtableMetadataClient {
  private client: AxiosInstance;
  private rateLimiter: AirtableRateLimiter;

  constructor(apiKey: string, rateLimiter?: AirtableRateLimiter) {
    this.rateLimiter = rateLimiter ?? globalRateLimiter;
    this.client = axios.create({
      baseURL: 'https://api.airtable.com/v0',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Get all tables and fields schema for a base
   */
  public async getBaseSchema(baseId: string): Promise<AirtableBaseSchemaResponse> {
    const response = await this.rateLimiter.execute(async () => {
      return this.client.get(`/meta/bases/${baseId}/tables`);
    });
    return response.data;
  }

  /**
   * List all bases the token has access to
   */
  public async listBases(): Promise<Array<{ id: string; name: string; permissionLevel: string }>> {
    const response = await this.rateLimiter.execute(async () => {
      return this.client.get('/meta/bases');
    });
    return response.data.bases;
  }

  /**
   * Create a new table via Metadata API
   */
  public async createTable(
    baseId: string,
    table: {
      name: string;
      description?: string;
      fields: AirtableFieldSchema[];
    }
  ): Promise<AirtableTableSchema> {
    const response = await this.rateLimiter.execute(async () => {
      return this.client.post(`/meta/bases/${baseId}/tables`, table);
    });
    return response.data;
  }

  /**
   * Create a field on an existing table
   */
  public async createField(
    baseId: string,
    tableId: string,
    field: AirtableFieldSchema
  ): Promise<AirtableFieldSchema> {
    const response = await this.rateLimiter.execute(async () => {
      return this.client.post(`/meta/bases/${baseId}/tables/${tableId}/fields`, field);
    });
    return response.data;
  }

  /**
   * Register a new Airtable Webhook
   */
  public async createWebhook(
    baseId: string,
    notificationUrl: string,
    specification: WebhookSpecification
  ): Promise<{
    id: string;
    areNotificationsEnabled: boolean;
    cursorForNextPayload: number;
    expirationTime: string;
    macSecretConfirmation: string;
  }> {
    const response = await this.rateLimiter.execute(async () => {
      return this.client.post(`/bases/${baseId}/webhooks`, {
        notificationUrl,
        specification,
      });
    });
    return response.data;
  }

  /**
   * List all webhooks on a base
   */
  public async listWebhooks(baseId: string): Promise<any[]> {
    const response = await this.rateLimiter.execute(async () => {
      return this.client.get(`/bases/${baseId}/webhooks`);
    });
    return response.data.webhooks;
  }

  /**
   * Fetch webhook payloads from a cursor
   */
  public async getWebhookPayloads(
    baseId: string,
    webhookId: string,
    cursor: number = 1,
    limit: number = 50
  ): Promise<{
    cursor: number;
    mightHaveMore: boolean;
    payloads: any[];
  }> {
    const response = await this.rateLimiter.execute(async () => {
      return this.client.get(
        `/bases/${baseId}/webhooks/${webhookId}/payloads?cursor=${cursor}&limit=${limit}`
      );
    });
    return response.data;
  }

  /**
   * Refresh a webhook to extend its 7-day expiration
   */
  public async refreshWebhook(
    baseId: string,
    webhookId: string
  ): Promise<{ expirationTime: string }> {
    const response = await this.rateLimiter.execute(async () => {
      return this.client.post(`/bases/${baseId}/webhooks/${webhookId}/refresh`);
    });
    return response.data;
  }

  /**
   * Delete a webhook
   */
  public async deleteWebhook(baseId: string, webhookId: string): Promise<void> {
    await this.rateLimiter.execute(async () => {
      return this.client.delete(`/bases/${baseId}/webhooks/${webhookId}`);
    });
  }
}
