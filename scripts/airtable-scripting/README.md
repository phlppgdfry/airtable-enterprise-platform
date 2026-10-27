# 📜 Airtable Native Scripting & Automation Action Pack

This directory contains standalone, battle-tested JavaScript scripts specifically written for **Airtable Automations ("Run a script" action)** and **Airtable Scripting Extension**.

---

## 📂 Script Catalog

### 1. [`01_auto_sequential_id_generator.js`](01_auto_sequential_id_generator.js)
- **Use Case:** Automatically assign sequential `TSK-001`, `TSK-002` numbers on new task records.
- **Trigger:** *When record created* in `Tasks & Deliverables`.
- **Input Variables:** `recordId` -> `Airtable record ID`.

### 2. [`02_critical_risk_alert_dispatcher.js`](02_critical_risk_alert_dispatcher.js)
- **Use Case:** Instantly dispatch Slack / Teams / Webhook alert when a `Critical` severity risk is logged.
- **Trigger:** *When record matches conditions* in `Risk & Governance Log` (`Severity` = `Critical`).
- **Input Variables:** `riskId`, `statement`, `project`, `mitigation`, `webhookUrl`.

### 3. [`03_native_wbs_rollup_script.js`](03_native_wbs_rollup_script.js)
- **Use Case:** Interactive sprint delivery calculation inside the Airtable Scripting Extension.
- **Trigger:** Manual button click or scheduled cron.

### 4. [`04_budget_variance_guard.js`](04_budget_variance_guard.js)
- **Use Case:** Flags projects when `Budget Spent (€)` exceeds 85% or 100% of allocated budget.
- **Trigger:** *When record updated* (`Budget Spent (€)`) on `Projects`.
- **Input Variables:** `recordId`, `budget`, `spent`, `projectName`.
