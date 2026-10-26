import { describe, it, expect, vi } from 'vitest';
import { CDCEventDispatcher } from '../src/webhooks/cdcDispatcher.js';
import { AirtableTransactionPayload } from '../src/webhooks/types.js';

describe('CDCEventDispatcher', () => {
  it('dispatches RECORD_CREATED, RECORD_UPDATED, and RECORD_DELETED events', async () => {
    const dispatcher = new CDCEventDispatcher();
    const handler = vi.fn();
    dispatcher.subscribe(handler);

    const mockPayload: AirtableTransactionPayload = {
      timestamp: '2026-10-26T18:00:00.000Z',
      baseTransactionNumber: 101,
      actionMetadata: {
        source: 'client',
        sourceMetadata: {
          user: { id: 'usr1', name: 'Philippe', email: 'philippe@enterprise.com' },
        },
      },
      payloadFormat: 'v0',
      changedTablesById: {
        tblProjects: {
          createdRecordsById: {
            recNew1: { cellValuesByFieldId: { fldName: 'New Project' } },
          },
          changedRecordsById: {
            recExisting1: {
              current: { cellValuesByFieldId: { fldStatus: 'Execution' } },
              previous: { cellValuesByFieldId: { fldStatus: 'Planning' } },
            },
          },
          destroyedRecordIds: ['recDeleted1'],
        },
      },
    };

    const emitted = await dispatcher.processPayloads('appTest123', [mockPayload]);

    expect(emitted).toHaveLength(3);
    expect(handler).toHaveBeenCalledTimes(3);

    // Check created
    const created = emitted.find((e) => e.eventType === 'RECORD_CREATED');
    expect(created?.recordId).toBe('recNew1');
    expect(created?.authorEmail).toBe('philippe@enterprise.com');

    // Check updated
    const updated = emitted.find((e) => e.eventType === 'RECORD_UPDATED');
    expect(updated?.recordId).toBe('recExisting1');
    expect(updated?.changedFields?.fldStatus.current).toBe('Execution');
    expect(updated?.changedFields?.fldStatus.previous).toBe('Planning');

    // Check deleted
    const deleted = emitted.find((e) => e.eventType === 'RECORD_DELETED');
    expect(deleted?.recordId).toBe('recDeleted1');
  });
});
