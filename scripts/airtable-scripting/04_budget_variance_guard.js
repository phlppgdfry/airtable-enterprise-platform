/**
 * Airtable Automation Action: Budget Variance & Burn Guard
 * 
 * Trigger: When "Budget Spent (€)" is updated on "Projects"
 * Action: Run a script
 * 
 * Calculates spend vs allocation ratio and flags initiatives
 * exceeding 85% or 100% threshold.
 */

const inputConfig = input.config();
const recordId = inputConfig.recordId;
const budget = Number(inputConfig.budget) || 0;
const spent = Number(inputConfig.spent) || 0;
const projectName = inputConfig.projectName || "Unknown Project";

if (!recordId) {
  throw new Error("Missing recordId input variable");
}

if (budget <= 0) {
  console.log("No budget defined for this project; skipping variance check.");
} else {
  const burnPct = (spent / budget) * 100;
  console.log(`[Budget Guard] Project "${projectName}": €${spent} / €${budget} (${burnPct.toFixed(1)}%)`);

  let statusFlag = "HEALTHY";
  if (burnPct > 100) {
    statusFlag = "OVERRUN";
    console.warn(`⚠️ BUDGET OVERRUN DETECTED: ${projectName} exceeded budget by €${spent - budget}`);
  } else if (burnPct >= 85) {
    statusFlag = "WARNING";
    console.warn(`🟡 BUDGET WARNING: ${projectName} reached ${burnPct.toFixed(1)}% of total allocated budget.`);
  }

  output.set("burnPercentage", Math.round(burnPct));
  output.set("statusFlag", statusFlag);
}
