/**
 * Airtable Enterprise Webhook Ingestion Server
 * 
 * Express microservice handling:
 * - Airtable webhook ping reception
 * - HMAC-SHA256 signature verification (X-Airtable-Content-MAC)
 * - Cursor-based polling of transaction payloads (/payloads)
 * - Integration with CDCEventDispatcher
 * - Automatic webhook lease heartbeating
 */

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { AirtableMetadataClient } from '../client/metadataClient.js';
import { CDCEventDispatcher } from './cdcDispatcher.js';
import { logger } from '../cli/utils/logger.js';
import { AirtableWebhookPing } from './types.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const webhookSecret = process.env.WEBHOOK_SECRET || '';
const apiKey = process.env.AIRTABLE_API_KEY || '';

const metadataClient = new AirtableMetadataClient(apiKey);
export const cdcDispatcher = new CDCEventDispatcher();

// In-memory cursor store (in production, use Redis or Postgres)
const cursorStore = new Map<string, number>();

// Middleware to capture raw body for HMAC verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

/**
 * Verify Airtable HMAC-SHA256 header (X-Airtable-Content-MAC)
 */
function verifyAirtableSignature(req: any): boolean {
  if (!webhookSecret) return true; // Bypass in local development if no secret set
  const signature = req.headers['x-airtable-content-mac'];
  if (!signature || !req.rawBody) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Main Webhook Receiver Endpoint
 */
app.post('/api/webhooks/airtable', async (req: Request, res: Response) => {
  if (!verifyAirtableSignature(req)) {
    logger.warn('Received webhook ping with invalid HMAC signature.');
    res.status(401).json({ error: 'Invalid HMAC signature' });
    return;
  }

  // Acknowledge immediately with 200 OK so Airtable does not timeout (must respond within 5s)
  res.status(200).json({ status: 'accepted' });

  const ping = req.body as AirtableWebhookPing;
  const baseId = ping.base?.id;
  const webhookId = ping.webhook?.id;

  if (!baseId || !webhookId) {
    logger.warn('Malformed webhook ping received.');
    return;
  }

  logger.info(`Received Webhook Ping from Base: ${baseId}, Webhook: ${webhookId}`);

  // Background payload extraction
  try {
    const currentCursor = cursorStore.get(webhookId) ?? 1;
    let nextCursor = currentCursor;
    let mightHaveMore = true;

    while (mightHaveMore) {
      const response = await metadataClient.getWebhookPayloads(baseId, webhookId, nextCursor, 50);
      nextCursor = response.cursor;
      mightHaveMore = response.mightHaveMore;

      if (response.payloads && response.payloads.length > 0) {
        logger.info(`Processing ${response.payloads.length} transactions from cursor ${currentCursor}`);
        await cdcDispatcher.processPayloads(baseId, response.payloads);
      } else {
        break;
      }
    }

    cursorStore.set(webhookId, nextCursor);
  } catch (error: any) {
    logger.error(`Failed to process webhook payloads:`, error?.message);
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    trackedWebhooks: Array.from(cursorStore.keys()),
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.success(`Airtable Webhook Listener active on port ${port}`);
    logger.info(`Endpoint: http://localhost:${port}/api/webhooks/airtable`);
  });
}

export default app;
