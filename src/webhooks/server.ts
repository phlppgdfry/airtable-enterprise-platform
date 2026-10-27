/**
 * Airtable Enterprise Webhook Ingestion Server
 * 
 * Express microservice handling:
 * - Airtable webhook ping reception
 * - Constant-time HMAC-SHA256 signature verification (X-Airtable-Content-MAC)
 * - Persistent cursor-based polling of transaction payloads (/payloads)
 * - Integration with CDCEventDispatcher
 * - Hardened against timing attacks, RangeError DoS, and unauthenticated forging
 */

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
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

// Persistent Cursor Store (backed by JSON file for restart resilience)
const cursorFilePath = path.resolve(process.cwd(), '.webhook_cursors.json');
const cursorStore = new Map<string, number>();

// Load persisted cursors on startup
if (fs.existsSync(cursorFilePath)) {
  try {
    const raw = fs.readFileSync(cursorFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    for (const [k, v] of Object.entries(parsed)) {
      cursorStore.set(k, Number(v));
    }
    logger.info(`Loaded ${cursorStore.size} persisted webhook cursor(s).`);
  } catch (err: any) {
    logger.warn(`Could not read cursor file: ${err.message}`);
  }
}

function persistCursor(webhookId: string, cursor: number) {
  cursorStore.set(webhookId, cursor);
  try {
    const obj: Record<string, number> = {};
    for (const [k, v] of cursorStore.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(cursorFilePath, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err: any) {
    logger.warn(`Could not persist webhook cursor: ${err.message}`);
  }
}

// Middleware to capture raw body for HMAC verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

/**
 * Constant-time verification of Airtable HMAC-SHA256 header (X-Airtable-Content-MAC)
 * Hardened against RangeError DoS and timing attacks
 */
export function verifyAirtableSignature(req: any, secretOverride?: string): boolean {
  const secret = secretOverride ?? webhookSecret;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: WEBHOOK_SECRET is not configured in production environment. Rejecting ping.');
      return false;
    }
    logger.warn('WEBHOOK_SECRET is unset. Local development bypass active.');
    return true;
  }

  const signature = req.headers?.['x-airtable-content-mac'];
  if (!signature || !req.rawBody) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');

  // Both buffers must be validated for identical length before invoking timingSafeEqual
  // to prevent Node.js RangeError unhandled exceptions (DoS vulnerability)
  const sigBuf = Buffer.from(signature, 'utf-8');
  const expectedBuf = Buffer.from(expectedSignature, 'utf-8');

  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuf, expectedBuf);
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

    persistCursor(webhookId, nextCursor);
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
