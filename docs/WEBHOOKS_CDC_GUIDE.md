# 📡 Airtable Enterprise Webhooks & CDC Guide

Airtable Webhooks provide near real-time Change Data Capture (CDC) events for enterprise integrations.

---

## 1. Webhook Lifecycle

```mermaid
sequenceDiagram
    participant Airtable as Airtable Base
    participant Receiver as Express Webhook Server
    participant API as Airtable REST API
    participant Dispatcher as CDC Event Dispatcher

    Note over Airtable: User or API modifies records
    Airtable->>Receiver: POST /api/webhooks/airtable (Ping + HMAC)
    Receiver-->>Airtable: 200 OK (immediate ack < 5s)
    Receiver->>API: GET /v0/bases/{baseId}/webhooks/{webhookId}/payloads?cursor={cursor}
    API-->>Receiver: JSON Transaction Payloads (cellValuesByFieldId)
    Receiver->>Dispatcher: processPayloads(payloads)
    Dispatcher->>Dispatcher: Emit RECORD_CREATED / UPDATED / DELETED
```

---

## 2. HMAC-SHA256 Signature Verification
When registering a webhook, Airtable provides a `macSecretConfirmation`.
On every incoming ping, the HTTP header `X-Airtable-Content-MAC` contains the HMAC hex digest:

```typescript
const signature = req.headers['x-airtable-content-mac'];
const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
```

---

## 3. 7-Day Expiration & Auto-Refresh Heartbeat
Airtable webhooks automatically expire after **7 days** if not renewed.
To keep webhooks alive indefinitely in production:
```bash
# Call the refresh endpoint via CLI
npm run cli -- webhook refresh -b appXXXXXXXX -w achXXXXXXXX
```
Or run a scheduled cron job every 3 days.
