/**
 * CLI Command: ai:ask
 * 
 * Transparently labeled Dual-Mode AI Copilot for Airtable Enterprise Platform:
 * - Deterministic Rules & Entity Extractor (Default): Fast, zero hallucination, pure fact projection from records.
 * - LLM-Powered Agent (Optional with --llm and OPENAI_API_KEY): Real natural language interpretation with tool grounding.
 */

import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { EnterpriseCopilotEngine } from '../../ai/copilotEngine.js';

export async function runAICopilotCommand(question?: string, options: { llm?: boolean } = {}) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    logger.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env');
    return;
  }

  const prompt = question || 'Geef een overzicht van de portfolio gezondheid en risico\'s';
  const engine = new EnterpriseCopilotEngine(baseId, apiKey);

  logger.section('🤖 Airtable Enterprise Copilot');
  logger.keyVal('Query', prompt);
  logger.keyVal('Target Base ID', baseId);
  logger.keyVal('Engine Architecture', options.llm ? 'LLM Agent (OpenAI Tool Calling)' : 'Deterministic Rules & Entity Router');

  const result = options.llm
    ? await engine.executeLLM(prompt)
    : await engine.executeDeterministic(prompt);

  console.log('\n' + chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.white.bold(`💡 COPILOT RESPONSE [Engine: ${result.modelOrMethod}]`));
  console.log(chalk.gray(`   Hallucination Risk: ${result.hallucinationRisk}`));
  if (result.sourceRecordCitations.length > 0) {
    console.log(chalk.gray(`   Verified Record Citations: ${result.sourceRecordCitations.slice(0, 5).join(', ')}${result.sourceRecordCitations.length > 5 ? ' ...' : ''}`));
  }
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(result.answer);
  console.log('\n' + chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  logger.success('Response grounded in live Airtable base telemetry.');
}
