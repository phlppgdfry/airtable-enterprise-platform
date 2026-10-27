import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyAirtableSignature } from '../src/webhooks/server.js';

describe('verifyAirtableSignature Security Tests', () => {
  const secret = 'sec_test_secret_key_12345';
  const body = Buffer.from(JSON.stringify({ base: { id: 'app123' }, timestamp: '2026-10-27T00:00:00Z' }));
  const validHmac = crypto.createHmac('sha256', secret).update(body).digest('hex');

  it('validates authentic HMAC-SHA256 signatures', () => {
    const req = {
      rawBody: body,
      headers: { 'x-airtable-content-mac': validHmac },
    };
    expect(verifyAirtableSignature(req, secret)).toBe(true);
  });

  it('rejects tampered or incorrect HMAC signatures', () => {
    const req = {
      rawBody: body,
      headers: { 'x-airtable-content-mac': '0000000000000000000000000000000000000000000000000000000000000000' },
    };
    expect(verifyAirtableSignature(req, secret)).toBe(false);
  });

  it('does NOT throw RangeError on different length signature (DoS prevention)', () => {
    const req = {
      rawBody: body,
      headers: { 'x-airtable-content-mac': 'short' },
    };
    // Should return false cleanly, NOT throw an unhandled exception
    expect(() => verifyAirtableSignature(req, secret)).not.toThrow();
    expect(verifyAirtableSignature(req, secret)).toBe(false);
  });

  it('rejects requests with missing signature header', () => {
    const req = {
      rawBody: body,
      headers: {},
    };
    expect(verifyAirtableSignature(req, secret)).toBe(false);
  });
});
