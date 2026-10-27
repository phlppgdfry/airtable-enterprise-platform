# ⚠️ Remaining Risks & Technical Debt Register

> **Date:** 2026-10-27  
> **Status:** Documented for Transparency  

---

## 1. Residual Risk Register

| Risk ID | Title | Probability | Impact | Mitigation Strategy | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RISK-01** | **Trial Workspace Expiration (14 Days)** | High | Medium | All enterprise DDL and test data are backed up in version-controlled JSON, CSV (`data/csv/`), and local snapshots. The platform degrades gracefully to free plan quotas (1,000 records). | Solutions Architect |
| **RISK-02** | **Airtable API 5 req/s Per-Base Ceiling** | Medium | High | Centralized `AirtableRateLimiter` enforces client-side token bucket pacing with full randomized jitter. | Engineering Lead |
| **RISK-03** | **Webhook 7-Day Silent Expiration** | Medium | High | `npm run webhook:heartbeat` checks TTL and calls `/refresh` for any webhook with <72 hours remaining. Automated cron recommended for production. | DevOps Lead |
| **RISK-04** | **Formula Creation Unsupported via API** | Certain | Low | Airtable Metadata API does not support programmatic creation of calculated fields (`formula`, `rollup`, `lookup`). Complete formula formulas are cataloged in `docs/FORMULAS_MASTERCLASS.md` and accessible via `npm run formula`. | Solutions Architect |
| **RISK-05** | **Interface Creation Unsupported via API** | Certain | Low | Interface Designer portals cannot be instantiated via API. Detailed layout specifications and component hierarchies are maintained in `docs/INTERFACES_SPEC.md`. | Product Architect |

---

## 2. Technical Debt Items Tracked for Future Sprints

1. **Persistent Redis Cursor Store:** Webhook cursor state currently uses local file persistence; production distributed deployments should use Redis or DynamoDB.
2. **End-to-End Cypress / Playwright Extension Testing:** Adding browser automated test runners for the custom React extension running inside the Airtable simulator iframe.
