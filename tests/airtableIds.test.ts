import { describe, it, expect, vi } from 'vitest';
import { assertAirtableId, idSegment, isAirtableId } from '../src/client/airtableIds.js';
import { AirtableMetadataClient } from '../src/client/metadataClient.js';

describe('Airtable ID validation (path injection guard)', () => {
  it('accepts real and demo IDs', () => {
    expect(isAirtableId('base', 'appAbCdEf12345678')).toBe(true);
    expect(isAirtableId('base', 'appEnterpriseShowcase01')).toBe(true);
    expect(isAirtableId('webhook', 'ach01TestWebhook')).toBe(true);
    expect(isAirtableId('table', 'tblProjects')).toBe(true);
  });

  it.each([
    ['../../meta/whoami'],
    ['app1/../../meta/whoami'],
    ['app1?x=1'],
    ['app1#frag'],
    ['app1%2F..'],
    ['app 1'],
    ['tbl123'], // wrong prefix for a base
    [''],
    [undefined],
    [42],
  ])('rejects %j as a base id', (value) => {
    expect(isAirtableId('base', value)).toBe(false);
    expect(() => assertAirtableId('base', value)).toThrow(/Invalid Airtable base id/);
  });

  it('url-encodes validated ids', () => {
    expect(idSegment('webhook', 'achX1')).toBe('achX1');
  });
});

describe('AirtableMetadataClient never sends a request with an injected id', () => {
  const passthrough = { execute: (fn: () => Promise<unknown>) => fn() } as any;

  it('throws before calling the API for a traversal webhook id', async () => {
    const client = new AirtableMetadataClient('key', passthrough);
    const get = vi.fn();
    (client as any).client = { get };
    await expect(client.getWebhookPayloads('appBase1', '../../meta/whoami')).rejects.toThrow(/webhook id/);
    expect(get).not.toHaveBeenCalled();
  });

  it('passes cursor and limit as validated query params', async () => {
    const client = new AirtableMetadataClient('key', passthrough);
    const get = vi.fn().mockResolvedValue({ data: { cursor: 2, mightHaveMore: false, payloads: [] } });
    (client as any).client = { get };
    await client.getWebhookPayloads('appBase1', 'achHook1', 3, 50);
    expect(get).toHaveBeenCalledWith('/bases/appBase1/webhooks/achHook1/payloads', { params: { cursor: 3, limit: 50 } });
    await expect(client.getWebhookPayloads('appBase1', 'achHook1', Number.NaN, 50)).rejects.toThrow(/cursor/);
  });
});
