# 📁 Ready-to-Import Enterprise Datasets

This directory contains pre-structured CSV files for instantaneous 1-click import into Airtable without requiring API tokens.

## 📄 File Inventory

1. [`01_Projects.csv`](01_Projects.csv): High-level portfolio initiatives, budgets, milestones, and strategic objectives.
2. [`02_Team_Members.csv`](02_Team_Members.csv): Talent pool, hourly rates, capacities, and primary engineering skillsets.
3. [`03_Tasks_Deliverables.csv`](03_Tasks_Deliverables.csv): Granular work packages, complexities, hours, and technical notes.
4. [`04_Risk_Governance_Log.csv`](04_Risk_Governance_Log.csv): Enterprise risk log with severities, likelihoods, and mitigation strategies.
5. [`05_Audit_Trail_CDC_Logs.csv`](05_Audit_Trail_CDC_Logs.csv): Immutable event stream logs simulating Change Data Capture (CDC).

## 🚀 How to Import into Airtable in 60 Seconds

1. Open your workspace: [https://airtable.com/workspaces/wsp3p16CPCotJVZdX](https://airtable.com/workspaces/wsp3p16CPCotJVZdX)
2. Click **Create base** -> **Import data** -> **CSV file**.
3. Upload `01_Projects.csv` and name the table `Projects`.
4. Click the `+` icon next to the table tab to add a new table -> **Import data** -> **CSV file** for each remaining file:
   - `02_Team_Members.csv` -> `Team Members`
   - `03_Tasks_Deliverables.csv` -> `Tasks & Deliverables`
   - `04_Risk_Governance_Log.csv` -> `Risk & Governance Log`
   - `05_Audit_Trail_CDC_Logs.csv` -> `Audit Trail & CDC Logs`
5. All your tables, fields, and records are instantly live and visible in your workspace!
