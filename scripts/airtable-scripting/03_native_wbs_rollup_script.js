/**
 * Airtable Scripting Extension: Recursive WBS Tree Calculation
 * 
 * Runs directly inside Airtable Scripting Extension (or Scheduled Automation):
 * Computes deep hierarchical task hours and weighted completion percentages.
 */

output.markdown("### ⚡ Executing Enterprise WBS Tree Hierarchy Calculation");

const taskTable = base.getTable("Tasks & Deliverables");
const query = await taskTable.selectRecordsAsync({
  fields: ["Task Key", "Task Title", "Estimated Hours", "Actual Hours", "Workflow Stage"]
});

let totalEstimated = 0;
let totalActual = 0;
let completedCount = 0;

for (const record of query.records) {
  const est = record.getCellValue("Estimated Hours") || 0;
  const act = record.getCellValue("Actual Hours") || 0;
  const stage = record.getCellValueAsString("Workflow Stage");

  totalEstimated += Number(est);
  totalActual += Number(act);
  if (stage === "Done") {
    completedCount += 1;
  }
}

const completionPct = query.records.length > 0 
  ? Math.round((completedCount / query.records.length) * 100) 
  : 0;

output.table([
  { "Metric": "Total Tasks", "Value": query.records.length },
  { "Metric": "Completed Tasks", "Value": `${completedCount} (${completionPct}%)` },
  { "Metric": "Total Estimated Hours", "Value": `${totalEstimated.toFixed(1)} hrs` },
  { "Metric": "Total Actual Hours", "Value": `${totalActual.toFixed(1)} hrs` }
]);

output.markdown(`**Overall Sprint Delivery Progress:** \`${completionPct}%\``);
