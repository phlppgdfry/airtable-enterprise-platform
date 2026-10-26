/**
 * Enterprise Airtable Formula Masterclass Library
 * 
 * Production-tested Airtable formulas for senior database architects:
 * - Dynamic ASCII progress bars
 * - Fiscal quarter and fiscal year calculators
 * - Automated project health traffic light systems
 * - Business days (net working days) difference
 * - Clean currency delta indicators with conditional formatting
 */

export interface FormulaSnippet {
  name: string;
  category: 'Visualization' | 'Date & Time' | 'Finance' | 'Governance' | 'Text Manipulation';
  description: string;
  formula: string;
  expectedOutputExample: string;
}

export const ENTERPRISE_FORMULAS: FormulaSnippet[] = [
  {
    name: 'Dynamic ASCII Progress Bar',
    category: 'Visualization',
    description: 'Generates a 10-block visual progress bar alongside formatted percentage',
    formula: `REPT("█", ROUND({Progress %} * 10, 0)) & REPT("░", 10 - ROUND({Progress %} * 10, 0)) & " " & ROUND({Progress %} * 100, 0) & "%"`,
    expectedOutputExample: '████████░░ 80%',
  },
  {
    name: 'Project Health Traffic Light',
    category: 'Governance',
    description: 'Automated 4-state indicator evaluating completion, overdue days, and imminent deadlines',
    formula: `IF({Status} = "Delivered", "🟢 Complete",
  IF(AND(IS_BEFORE({Target Go-Live}, TODAY()), {Status} != "Delivered"),
    "🔴 Overdue (" & DATETIME_DIFF(TODAY(), {Target Go-Live}, "days") & "d)",
    IF(DATETIME_DIFF({Target Go-Live}, TODAY(), "days") <= 7,
      "🟡 Due Soon (" & DATETIME_DIFF({Target Go-Live}, TODAY(), "days") & "d remaining)",
      "🔵 On Track"
    )
  )
)`,
    expectedOutputExample: '🔴 Overdue (4d)',
  },
  {
    name: 'Fiscal Quarter & Year Calculator',
    category: 'Date & Time',
    description: 'Calculates corporate fiscal quarter and year from any milestone date',
    formula: `"FY" & DATETIME_FORMAT({Target Go-Live}, "YY") & "-Q" & DATETIME_FORMAT({Target Go-Live}, "Q")`,
    expectedOutputExample: 'FY26-Q4',
  },
  {
    name: 'Net Business Working Days',
    category: 'Date & Time',
    description: 'Calculates business days between Start Date and Target Go-Live excluding weekends',
    formula: `IF(AND({Start Date}, {Target Go-Live}), WORKDAY_DIFF({Start Date}, {Target Go-Live}) & " working days", "Pending Dates")`,
    expectedOutputExample: '42 working days',
  },
  {
    name: 'Budget Variance & Burn Indicator',
    category: 'Finance',
    description: 'Displays colored delta icon and absolute financial variance',
    formula: `IF(OR({Budget Allocated (€)} = 0, IS_EMPTY({Budget Allocated (€)})), "No Budget Set",
  IF({Budget Spent (€)} > {Budget Allocated (€)},
    "⚠️ Over budget by €" & ({Budget Spent (€)} - {Budget Allocated (€)}),
    "✅ Surplus €" & ({Budget Allocated (€)} - {Budget Spent (€)}) & " (" & ROUND(({Budget Spent (€)} / {Budget Allocated (€)}) * 100, 1) & "% spent)"
  )
)`,
    expectedOutputExample: '✅ Surplus €265,000 (41.1% spent)',
  },
  {
    name: 'Clean Domain Extractor from Email',
    category: 'Text Manipulation',
    description: 'Extracts domain name from corporate email for instant company grouping',
    formula: `IF({Corporate Email}, MID({Corporate Email}, FIND("@", {Corporate Email}) + 1, LEN({Corporate Email})), "")`,
    expectedOutputExample: 'enterprise-hub.com',
  },
];
