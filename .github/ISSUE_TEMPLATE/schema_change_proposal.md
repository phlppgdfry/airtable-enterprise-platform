---
name: Schema Change Proposal
about: Propose additive or breaking DDL changes to the enterprise Airtable schema
title: "[SCHEMA]: "
labels: ["schema", "ddl"]
assignees: ''
---

### Problem Statement
What business or engineering requirement demands this schema change?

### Proposed Table / Field Changes
- Table: `[e.g. Projects]`
- Field Name: `[e.g. Executive Sponsor Email]`
- Field Type: `[e.g. email, singleSelect, multipleRecordLinks]`
- Default Options: `[choices, precision, symbol]`

### Backward Compatibility & Migration Impact
- Is this change `SAFE_ADDITIVE` or `BREAKING`?
- Does it require backfilling existing records via `AirtableBatchEngine`?
