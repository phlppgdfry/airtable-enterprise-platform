import { describe, it, expect } from 'vitest';
import { EnterpriseTypedClient } from '../src/client/typedClient.js';

describe('EnterpriseTypedClient', () => {
  it('instantiates repositories for all enterprise tables', () => {
    const client = new EnterpriseTypedClient('appMock123', 'patMock123');
    expect(client.projects).toBeDefined();
    expect(client.team).toBeDefined();
    expect(client.tasks).toBeDefined();
    expect(client.risks).toBeDefined();
    expect(client.audit).toBeDefined();
  });
});
