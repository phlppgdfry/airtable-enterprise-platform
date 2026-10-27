/**
 * Airtable Automation Action: Critical Risk Escalation Notifier
 * 
 * Trigger: When record enters view or matches conditions:
 *          "Severity = 'Critical' AND Status != 'Resolved'"
 * Action: Run a script
 * 
 * Dispatches a formatted notification payload to Slack / Teams / Webhook
 * and logs an event in the Audit Trail.
 */

const inputConfig = input.config();
const riskId = inputConfig.riskId || "RSK-UNKNOWN";
const statement = inputConfig.statement || "Unspecified risk";
const project = inputConfig.project || "Enterprise Portfolio";
const mitigation = inputConfig.mitigation || "None provided";
const webhookUrl = inputConfig.webhookUrl; // Optional Slack/Teams Webhook URL

console.log(`[ALERT] Escalating Critical Risk: ${riskId} - ${statement}`);

const alertPayload = {
  text: `🚨 *CRITICAL ENTERPRISE RISK DETECTED*`,
  attachments: [
    {
      color: "#ff0000",
      fields: [
        { title: "Risk ID", value: riskId, short: true },
        { title: "Impacted Initiative", value: project, short: true },
        { title: "Risk Statement", value: statement, short: false },
        { title: "Mitigation Strategy", value: mitigation, short: false }
      ]
    }
  ]
};

if (webhookUrl) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alertPayload)
  });
  console.log(`Webhook responded with status ${response.status}`);
} else {
  console.log("No webhookUrl configured; logging alert to console output.");
}

output.set("escalated", true);
output.set("riskId", riskId);
