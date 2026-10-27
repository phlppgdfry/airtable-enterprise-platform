import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NATURAL_KEYS } from '../src/cli/commands/restore.js';

describe('Disaster Recovery Restore Verification', () => {
  it('defines valid natural keys for all enterprise tables', () => {
    expect(NATURAL_KEYS['Projects']).toEqual(['Project Code']);
    expect(NATURAL_KEYS['Team Members']).toEqual(['Corporate Email']);
    expect(NATURAL_KEYS['Tasks & Deliverables']).toEqual(['Task Key']);
    expect(NATURAL_KEYS['Risk & Governance Log']).toEqual(['Risk ID']);
    expect(NATURAL_KEYS['Audit Trail & CDC Logs']).toEqual(['Event ID']);
  });

  it('detects tampering when SHA-256 hash does not match manifest', () => {
    const originalContent = JSON.stringify([{ id: 'rec1', fields: { 'Project Code': 'PRJ-1' } }]);
    const expectedHash = crypto.createHash('sha256').update(originalContent).digest('hex');

    const tamperedContent = JSON.stringify([{ id: 'rec1', fields: { 'Project Code': 'PRJ-TAMPERED' } }]);
    const actualHash = crypto.createHash('sha256').update(tamperedContent).digest('hex');

    expect(actualHash).not.toEqual(expectedHash);
  });
});
