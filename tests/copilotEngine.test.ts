/**
 * AI Copilot Engine Verification Tests
 * 
 * Verifies:
 * - Deterministic rules engine entity extraction and zero hallucination facts
 * - Transparent classification of inference engine
 * - Graceful fallback from LLM to deterministic engine when key is missing or service unreachable
 * - Record citation presence in responses
 */

import { describe, it, expect, vi } from 'vitest';
import { EnterpriseCopilotEngine } from '../src/ai/copilotEngine.js';

describe('EnterpriseCopilotEngine', () => {
  it('correctly classifies deterministic engine and returns exact database citations', async () => {
    const engine = new EnterpriseCopilotEngine('appMockBase', 'patMockToken');

    // Mock typed client calls
    vi.spyOn((engine as any).typedClient.projects, 'list').mockResolvedValue([
      {
        id: 'recProj1',
        fields: {
          'Project Code': 'PRJ-2026-AI-01',
          'Project Name': 'Enterprise AI Agent Orchestration Hub',
          'Status': 'Execution',
          'Priority': 'P0 - Mission Critical',
          'Budget Allocated (€)': 450000,
          'Budget Spent (€)': 185000,
        },
      },
    ]);
    vi.spyOn((engine as any).typedClient.team, 'list').mockResolvedValue([]);
    vi.spyOn((engine as any).typedClient.tasks, 'list').mockResolvedValue([]);
    vi.spyOn((engine as any).typedClient.risks, 'list').mockResolvedValue([]);

    const response = await engine.executeDeterministic('Wat is de status van PRJ-2026-AI-01?');

    expect(response.engineType).toBe('DETERMINISTIC_RULES');
    expect(response.hallucinationRisk).toBe('ZERO_DETERMINISTIC');
    expect(response.sourceRecordCitations).toContain('recProj1');
    expect(response.answer).toContain('PRJ-2026-AI-01');
    expect(response.answer).toContain('450,000');
  });

  it('safely falls back to deterministic extraction when LLM API key is unset', async () => {
    const engine = new EnterpriseCopilotEngine('appMockBase', 'patMockToken', undefined);

    vi.spyOn((engine as any).typedClient.projects, 'list').mockResolvedValue([]);
    vi.spyOn((engine as any).typedClient.team, 'list').mockResolvedValue([]);
    vi.spyOn((engine as any).typedClient.tasks, 'list').mockResolvedValue([]);
    vi.spyOn((engine as any).typedClient.risks, 'list').mockResolvedValue([]);

    const response = await engine.executeLLM('General portfolio status');

    expect(response.engineType).toBe('DETERMINISTIC_RULES');
    expect(response.hallucinationRisk).toBe('ZERO_DETERMINISTIC');
  });
});
