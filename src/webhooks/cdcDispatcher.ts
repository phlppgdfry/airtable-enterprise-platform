/**
 * Airtable Change Data Capture (CDC) Event Dispatcher
 * 
 * Transforms raw Airtable transaction payloads into granular domain events:
 * - Emits RECORD_CREATED, RECORD_UPDATED, and RECORD_DELETED events
 * - Reconstructs field diffs (previous vs current values)
 * - Identifies mutating actor (user email or API source)
 * - Supports pluggable event subscribers (Slack, ERP, Snowflake, Audit Log)
 */

import { AirtableTransactionPayload, CDCRecordEvent } from './types.js';
import { logger } from '../cli/utils/logger.js';

export type CDCHandler = (event: CDCRecordEvent) => Promise<void> | void;

export class CDCEventDispatcher {
  private handlers: CDCHandler[] = [];

  /**
   * Register a subscriber for CDC events
   */
  public subscribe(handler: CDCHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Process an array of Airtable transaction payloads from webhook /payloads endpoint
   */
  public async processPayloads(baseId: string, payloads: AirtableTransactionPayload[]): Promise<CDCRecordEvent[]> {
    const emittedEvents: CDCRecordEvent[] = [];

    for (const transaction of payloads) {
      const { timestamp, actionMetadata, changedTablesById = {} } = transaction;
      const source = actionMetadata.source;
      const authorEmail = actionMetadata.sourceMetadata?.user?.email;

      for (const [tableId, tableDiff] of Object.entries(changedTablesById)) {
        // 1. Created Records
        if (tableDiff.createdRecordsById) {
          for (const [recordId, recordData] of Object.entries(tableDiff.createdRecordsById)) {
            const event: CDCRecordEvent = {
              eventType: 'RECORD_CREATED',
              baseId,
              tableId,
              recordId,
              timestamp,
              source,
              authorEmail,
              fields: recordData.cellValuesByFieldId || {},
            };
            emittedEvents.push(event);
            await this.dispatch(event);
          }
        }

        // 2. Updated Records with Cell-level Diffs
        if (tableDiff.changedRecordsById) {
          for (const [recordId, recordDiff] of Object.entries(tableDiff.changedRecordsById)) {
            const changedFields: Record<string, { current: any; previous: any }> = {};
            const currentCells = recordDiff.current?.cellValuesByFieldId || {};
            const prevCells = recordDiff.previous?.cellValuesByFieldId || {};

            const allFieldKeys = new Set([...Object.keys(currentCells), ...Object.keys(prevCells)]);
            for (const fieldKey of allFieldKeys) {
              changedFields[fieldKey] = {
                current: currentCells[fieldKey],
                previous: prevCells[fieldKey],
              };
            }

            const event: CDCRecordEvent = {
              eventType: 'RECORD_UPDATED',
              baseId,
              tableId,
              recordId,
              timestamp,
              source,
              authorEmail,
              changedFields,
            };
            emittedEvents.push(event);
            await this.dispatch(event);
          }
        }

        // 3. Destroyed / Deleted Records
        if (tableDiff.destroyedRecordIds) {
          for (const recordId of tableDiff.destroyedRecordIds) {
            const event: CDCRecordEvent = {
              eventType: 'RECORD_DELETED',
              baseId,
              tableId,
              recordId,
              timestamp,
              source,
              authorEmail,
            };
            emittedEvents.push(event);
            await this.dispatch(event);
          }
        }
      }
    }

    return emittedEvents;
  }

  private async dispatch(event: CDCRecordEvent): Promise<void> {
    logger.info(
      `[CDC] ${event.eventType} on Table: ${event.tableId} Record: ${event.recordId} by ${event.authorEmail || event.source}`
    );

    for (const handler of this.handlers) {
      try {
        await handler(event);
      } catch (err) {
        logger.error(`Error in CDC subscriber handler:`, err);
      }
    }
  }
}
