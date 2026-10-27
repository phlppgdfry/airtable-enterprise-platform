/**
 * Airtable Automation Action: Sequential Task ID Generator
 * 
 * Trigger: When a record is created in "Tasks & Deliverables"
 * Action: Run a script
 * 
 * Automatically assigns a padded sequential identifier (e.g. TSK-001, TSK-002)
 * if the primary key field "Task Key" is empty.
 */

const inputConfig = input.config();
const recordId = inputConfig.recordId;

if (!recordId) {
  throw new Error("Missing required input variable: recordId");
}

const table = base.getTable("Tasks & Deliverables");
const query = await table.selectRecordsAsync({ fields: ["Task Key"] });

// Find highest existing numerical suffix
let maxId = 0;
for (const record of query.records) {
  const key = record.getCellValueAsString("Task Key");
  if (key && key.startsWith("TSK-")) {
    const num = parseInt(key.replace("TSK-", ""), 10);
    if (!isNaN(num) && num > maxId) {
      maxId = num;
    }
  }
}

const nextId = maxId + 1;
const paddedKey = "TSK-" + String(nextId).padStart(3, "0");

await table.updateRecordAsync(recordId, {
  "Task Key": paddedKey
});

console.log(`Successfully assigned identifier ${paddedKey} to record ${recordId}`);
output.set("assignedKey", paddedKey);
