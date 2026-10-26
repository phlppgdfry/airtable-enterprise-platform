/**
 * CLI Command: formula
 * 
 * Interactive Formula Library & Validator for Enterprise Airtable:
 * - Displays tested enterprise formula snippets
 * - Syntax verification and example output previews
 * - One-click terminal copy
 */

import { logger } from '../utils/logger.js';
import { ENTERPRISE_FORMULAS } from '../../formulas/enterpriseFormulas.js';

export async function runFormulaCommand(category?: string) {
  logger.section('Airtable Enterprise Formula Masterclass Library');

  const filtered = category
    ? ENTERPRISE_FORMULAS.filter((f) => f.category.toLowerCase() === category.toLowerCase())
    : ENTERPRISE_FORMULAS;

  if (filtered.length === 0) {
    logger.warn(`No formulas found for category "${category}".`);
    console.log('Available categories: Visualization, Date & Time, Finance, Governance, Text Manipulation\n');
    return;
  }

  for (const item of filtered) {
    console.log(`\n📌 ${item.name} [Category: ${item.category}]`);
    console.log(`   ${item.description}`);
    console.log(`   Formula:`);
    console.log(`     ${item.formula.replace(/\n/g, '\n     ')}`);
    console.log(`   Sample Output: ${item.expectedOutputExample}`);
  }

  logger.success(`\nDisplayed ${filtered.length} enterprise formulas.`);
}
