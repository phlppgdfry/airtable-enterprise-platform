/**
 * Airtable Enterprise Webhooks & Change Data Capture (CDC) Type Definitions
 */

export interface AirtableWebhookPing {
  base: {
    id: string;
  };
  webhook: {
    id: string;
  };
  timestamp: string;
}

export interface AirtableCellDiff {
  current?: any;
  previous?: any;
}

export interface AirtableRecordDiff {
  created?: Record<string, any>;
  current?: {
    cellValuesByFieldId: Record<string, any>;
  };
  previous?: {
    cellValuesByFieldId: Record<string, any>;
  };
  unchanged?: {
    cellValuesByFieldId: Record<string, any>;
  };
}

export interface AirtableTableDiff {
  createdRecordsById?: Record<string, { cellValuesByFieldId: Record<string, any> }>;
  changedRecordsById?: Record<string, AirtableRecordDiff>;
  destroyedRecordIds?: string[];
  changedMetadata?: Record<string, any>;
}

export interface AirtableTransactionPayload {
  timestamp: string;
  baseTransactionNumber: number;
  actionMetadata: {
    source: 'client' | 'publicApi' | 'formSubmission' | 'automation' | 'sync' | 'system';
    sourceMetadata?: {
      user?: {
        id: string;
        name: string;
        email: string;
      };
    };
  };
  payloadFormat: string;
  createdTablesById?: Record<string, any>;
  changedTablesById?: Record<string, AirtableTableDiff>;
  destroyedTableIds?: string[];
}

export interface CDCRecordEvent {
  eventType: 'RECORD_CREATED' | 'RECORD_UPDATED' | 'RECORD_DELETED';
  baseId: string;
  tableId: string;
  recordId: string;
  timestamp: string;
  source: string;
  authorEmail?: string;
  fields?: Record<string, any>;
  changedFields?: Record<string, { current: any; previous: any }>;
}
