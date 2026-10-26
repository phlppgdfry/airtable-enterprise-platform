/**
 * Enterprise Airtable High-Performance Batch Upsert Engine
 * 
 * Airtable API limits record mutations to 10 records per request.
 * This engine handles:
 * - Deterministic array chunking (chunks of 10)
 * - Rate-limited dispatch (5 req/s compliance)
 * - Native Airtable upsert with `fieldsToMergeOn`
 * - Detailed mutation summaries and error tracking
 */

import { AirtableRateLimiter, globalRateLimiter } from '../cli/utils/rateLimiter.js';
import axios, { AxiosInstance } from 'axios';

export interface RecordPayload {
  id?: string;
  fields: Record<string, any>;
}

export interface UpsertResult<T = any> {
  createdRecords: T[];
  updatedRecords: T[];
  totalProcessed: number;
  durationMs: number;
}

export class AirtableBatchEngine {
  private baseId: string;
  private apiKey: string;
  private client: AxiosInstance;
  private rateLimiter: AirtableRateLimiter;

  constructor(baseId: string, apiKey: string, rateLimiter?: AirtableRateLimiter) {
    this.baseId = baseId;
    this.apiKey = apiKey;
    this.rateLimiter = rateLimiter ?? globalRateLimiter;

    this.client = axios.create({
      baseURL: `https://api.airtable.com/v0/${baseId}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Chunks an array into fixed size slices (default 10 for Airtable mutations)
   */
  public static chunk<T>(items: T[], size: number = 10): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Perform native Upsert on table using fieldsToMergeOn
   */
  public async batchUpsert(
    tableName: string,
    records: RecordPayload[],
    fieldsToMergeOn: string[],
    typecast: boolean = true
  ): Promise<UpsertResult> {
    const startTime = Date.now();
    const chunks = AirtableBatchEngine.chunk(records, 10);
    const createdRecords: any[] = [];
    const updatedRecords: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const payload = {
        performUpsert: {
          fieldsToMergeOn,
        },
        records: chunk,
        typecast,
      };

      const response = await this.rateLimiter.execute(async () => {
        return this.client.patch(`/${encodeURIComponent(tableName)}`, payload);
      });

      const { records: responseRecords, createdRecords: createdIds = [], updatedRecords: updatedIds = [] } =
        response.data;

      for (const rec of responseRecords) {
        if (createdIds.includes(rec.id)) {
          createdRecords.push(rec);
        } else {
          updatedRecords.push(rec);
        }
      }
    }

    return {
      createdRecords,
      updatedRecords,
      totalProcessed: records.length,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Batch Create records with automatic chunking of 10
   */
  public async batchCreate(
    tableName: string,
    records: Array<{ fields: Record<string, any> }>,
    typecast: boolean = true
  ): Promise<any[]> {
    const chunks = AirtableBatchEngine.chunk(records, 10);
    const results: any[] = [];

    for (const chunk of chunks) {
      const response = await this.rateLimiter.execute(async () => {
        return this.client.post(`/${encodeURIComponent(tableName)}`, {
          records: chunk,
          typecast,
        });
      });
      results.push(...response.data.records);
    }

    return results;
  }

  /**
   * Batch Update records with automatic chunking of 10
   */
  public async batchUpdate(
    tableName: string,
    records: Array<{ id: string; fields: Record<string, any> }>,
    typecast: boolean = true,
    destructive: boolean = false
  ): Promise<any[]> {
    const chunks = AirtableBatchEngine.chunk(records, 10);
    const results: any[] = [];
    const method = destructive ? 'put' : 'patch';

    for (const chunk of chunks) {
      const response = await this.rateLimiter.execute(async () => {
        return this.client[method](`/${encodeURIComponent(tableName)}`, {
          records: chunk,
          typecast,
        });
      });
      results.push(...response.data.records);
    }

    return results;
  }

  /**
   * Batch Delete records with automatic chunking of 10
   */
  public async batchDelete(tableName: string, recordIds: string[]): Promise<string[]> {
    const chunks = AirtableBatchEngine.chunk(recordIds, 10);
    const deletedIds: string[] = [];

    for (const chunk of chunks) {
      const query = chunk.map((id) => `records[]=${encodeURIComponent(id)}`).join('&');
      const response = await this.rateLimiter.execute(async () => {
        return this.client.delete(`/${encodeURIComponent(tableName)}?${query}`);
      });
      deletedIds.push(...response.data.records.map((r: any) => r.id));
    }

    return deletedIds;
  }
}
