# 📖 Enterprise Data Dictionary

> **Base ID:** `app03l5bkNRgzjWv4`  
> **Live URL:** [https://airtable.com/app03l5bkNRgzjWv4](https://airtable.com/app03l5bkNRgzjWv4)  
> **Generated:** 2026-10-27T04:18:53.653Z via `airtable-toolkit docs:generate`

This document serves as the single source of truth (SSOT) for data architects, analytics engineers, and integration developers.

## Table Summary

| Table Name | Table ID | Fields Count | Primary Field |
| :--- | :--- | :--- | :--- |
| **Projects** | `tblE5XO7pZwoZZVKk` | 12 | `Project Code` |
| **Team Members** | `tblqfE6JsZ6du0r4y` | 9 | `Full Name` |
| **Tasks & Deliverables** | `tbljpIXTX4G8m8x26` | 10 | `Task Key` |
| **Risk & Governance Log** | `tblBVxyCzaMV24Zof` | 7 | `Risk ID` |
| **Audit Trail & CDC Logs** | `tblDT4TRhSKgxkSsA` | 7 | `Event ID` |

---

## Table Specifications

### Table: `Projects`

* **Table ID:** `tblE5XO7pZwoZZVKk`
* **Description:** Enterprise Project Portfolio Management with budget, health, and milestone tracking

| Field Name | Type | Options / Choices | Field ID |
| :--- | :--- | :--- | :--- |
| **Project Code** | `singleLineText` | - | `fldUgigTOR0ZB2F8o` |
| **Project Name** | `singleLineText` | - | `fldYuYIuPlGY9YfET` |
| **Status** | `singleSelect` | `Discovery`, `Planning`, `Execution`, `Testing & QA`, `Delivered`, `On Hold` | `fldO2hdjLbR05bwXP` |
| **Priority** | `singleSelect` | `P0 - Mission Critical`, `P1 - High`, `P2 - Medium`, `P3 - Low` | `fldqPHUwIMKkwn3mA` |
| **Budget Allocated (€)** | `currency` | Symbol: € | `fldG0ye9R9tSyw2zC` |
| **Budget Spent (€)** | `currency` | Symbol: € | `fldj4yiG2H8yJGjcQ` |
| **Start Date** | `date` | - | `fldqWz5lJun9h5W9S` |
| **Target Go-Live** | `date` | - | `fldHwtlsXSHm8Wq6v` |
| **Executive Sponsor** | `singleLineText` | - | `fldK1803fe8uPfEES` |
| **Strategic Objectives** | `multilineText` | - | `flddeXN1wewddakM1` |
| **Tasks & Deliverables** | `multipleRecordLinks` | Linked Table: `tbljpIXTX4G8m8x26` | `fldeoRsLKlaNqBf0K` |
| **Risk & Governance Log** | `multipleRecordLinks` | Linked Table: `tblBVxyCzaMV24Zof` | `fldyMzd8HjG22nb9F` |

### Table: `Team Members`

* **Table ID:** `tblqfE6JsZ6du0r4y`
* **Description:** Enterprise Talent Pool, Capacity Planning & Department Allocation

| Field Name | Type | Options / Choices | Field ID |
| :--- | :--- | :--- | :--- |
| **Full Name** | `singleLineText` | - | `fldLAc1iSupok7fCO` |
| **Corporate Email** | `email` | - | `fldMVf3YL06F6KDsW` |
| **Department** | `singleSelect` | `Platform Engineering`, `Data Architecture`, `Enterprise Architecture`, `Product Management`, `Quality & DevOps` | `fldBUhFhP5xZXIVVP` |
| **Role Level** | `singleSelect` | `Principal / Lead`, `Senior Staff`, `Senior`, `Mid` | `fldKNd6KUCWO6W8a2` |
| **Weekly Capacity (Hours)** | `number` | - | `fldFcnxf0FG2FoV9e` |
| **Hourly Billing Rate (€)** | `currency` | Symbol: € | `fld1mUeNWMxiJprU9` |
| **Primary Skillset** | `multipleSelects` | `TypeScript / Node.js`, `React / Next.js`, `Airtable Extensions SDK`, `PostgreSQL / SQL`, `Event-Driven Webhooks`, `AI / LLM Integration`, `Cloud Infrastructure (AWS/GCP/Azure)`, `Enterprise Architecture` | `fldgiYMfuNhuUFrBH` |
| **Is Active** | `checkbox` | - | `fldizXkErMmY5r1DV` |
| **Tasks & Deliverables** | `multipleRecordLinks` | Linked Table: `tbljpIXTX4G8m8x26` | `fldixFvFJHJ3yEDCR` |

### Table: `Tasks & Deliverables`

* **Table ID:** `tbljpIXTX4G8m8x26`
* **Description:** Granular WBS Work Packages, Sprint items, and technical deliverables

| Field Name | Type | Options / Choices | Field ID |
| :--- | :--- | :--- | :--- |
| **Task Key** | `singleLineText` | - | `fld0GZwewC6nfrfHT` |
| **Task Title** | `singleLineText` | - | `fldQTWUwShuTktJ2t` |
| **Workflow Stage** | `singleSelect` | `Backlog`, `In Progress`, `Code Review`, `Verification`, `Done`, `Blocked` | `fldu7Nf5lZh6FGW7Y` |
| **Estimated Hours** | `number` | - | `fldsSkbEpBryfcuFi` |
| **Actual Hours** | `number` | - | `fldSyu6uVgmKOLZUs` |
| **Due Date** | `date` | - | `fldcWWm23brqZCjy2` |
| **Complexity** | `singleSelect` | `XS (1-2h)`, `S (3-5h)`, `M (1-2d)`, `L (3-5d)`, `XL (> 1w)` | `fldAyv7APJZQskKRd` |
| **Technical Notes** | `multilineText` | - | `fld6wQM2FfyBDZKex` |
| **Project** | `multipleRecordLinks` | Linked Table: `tblE5XO7pZwoZZVKk` | `fldxJfRCfFZTuCNmd` |
| **Assignee** | `multipleRecordLinks` | Linked Table: `tblqfE6JsZ6du0r4y` | `fldVcT64WOPCazcF3` |

### Table: `Risk & Governance Log`

* **Table ID:** `tblBVxyCzaMV24Zof`
* **Description:** Enterprise Risk Management (ERM), architectural blockers and mitigations

| Field Name | Type | Options / Choices | Field ID |
| :--- | :--- | :--- | :--- |
| **Risk ID** | `singleLineText` | - | `fldFB78LhaVHBV3ob` |
| **Risk Statement** | `singleLineText` | - | `fldCixxD5cY4eJt9w` |
| **Severity** | `singleSelect` | `Critical`, `Major`, `Moderate`, `Minor` | `fld2ueRtCEUMupaAF` |
| **Likelihood** | `singleSelect` | `High`, `Medium`, `Low` | `fldjEcVB8W9k1x5Wn` |
| **Mitigation Strategy** | `multilineText` | - | `fldw5GoHHx5A8pzUQ` |
| **Status** | `singleSelect` | `Identified`, `Mitigating`, `Resolved`, `Accepted` | `fldM8D2cNrWP7cidp` |
| **Related Project** | `multipleRecordLinks` | Linked Table: `tblE5XO7pZwoZZVKk` | `fldewYZ4LT8Z38H2G` |

### Table: `Audit Trail & CDC Logs`

* **Table ID:** `tblDT4TRhSKgxkSsA`
* **Description:** Immutable record of Webhook events, external sync mutations, and schema diffs

| Field Name | Type | Options / Choices | Field ID |
| :--- | :--- | :--- | :--- |
| **Event ID** | `singleLineText` | - | `fldPD1mtoXxPSouZ9` |
| **Timestamp** | `dateTime` | - | `fldogIK3NyWSRQV6F` |
| **Source** | `singleSelect` | `Webhook CDC`, `Batch Sync Engine`, `Airtable Automation`, `MCP Agent`, `CLI Migration` | `fldwaqB7WVejTnk1d` |
| **Action** | `singleSelect` | `INSERT`, `UPDATE`, `DELETE`, `SCHEMA_ALTER` | `fldf5DyNSEAtgVlAM` |
| **Target Table** | `singleLineText` | - | `fldOj0fBko0Vfq2qe` |
| **Record Reference** | `singleLineText` | - | `fldyOjqBYajJDbF9M` |
| **Payload Snapshot** | `multilineText` | - | `fldTWyj6xbKlx8ihe` |

