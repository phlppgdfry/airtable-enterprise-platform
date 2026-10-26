/**
 * CLI Command: webhook:manage
 * 
 * Manages Airtable Enterprise Webhooks:
 * - List active webhooks on base
 * - Register new webhook with CDC filter specifications
 * - Trigger webhook expiration refresh (extends 7-day TTL)
 */

import { logger } from '../utils/logger.js';
import { AirtableMetadataClient } from '../../client/metadataClient.js';

export async function runWebhookManageCommand(action: 'list' | 'create' | 'refresh', options: { baseId?: string; url?: string; webhookId?: string }) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = options.baseId || process.env.AIRTABLE_BASE_ID || 'appEnterpriseShowcase01';

  logger.section('Airtable Enterprise Webhook Manager');
  logger.keyVal('Action', action.toUpperCase());
  logger.keyVal('Target Base', baseId);

  if (!apiKey || apiKey.startsWith('pat_your')) {
    logger.warn('AIRTABLE_API_KEY is not configured. Displaying simulated webhook lifecycle.');
    if (action === 'list') {
      console.log('\n--- Active Webhooks (Simulated) ---');
      console.log('ID: achSampleWebhook01 | URL: https://api.enterprise.com/webhooks | Expires: 7 days');
    } else if (action === 'create') {
      logger.info('Simulated Webhook registration with filters: [tableData, tableFields, tableMetadata]');
      logger.success('Webhook achSampleWebhook01 created with MAC Secret: sec_mock_hmac_secret');
    }
    return;
  }

  const client = new AirtableMetadataClient(apiKey);

  try {
    if (action === 'list') {
      const hooks = await client.listWebhooks(baseId);
      logger.info(`Found ${hooks.length} webhooks on base ${baseId}`);
      console.log(JSON.stringify(hooks, null, 2));
    } else if (action === 'create') {
      const url = options.url || process.env.WEBHOOK_NOTIFICATION_URL || 'https://example.com/api/webhooks/airtable';
      logger.info(`Registering webhook with URL: ${url}`);
      const result = await client.createWebhook(baseId, url, {
        options: {
          filters: {
            dataTypes: ['tableData', 'tableFields', 'tableMetadata'],
          },
        },
      });
      logger.success(`Webhook registered: ${result.id}`);
      logger.info(`Expiration Time: ${result.expirationTime}`);
      logger.info(`MAC Secret (save this in .env WEBHOOK_SECRET): ${result.macSecretConfirmation}`);
    } else if (action === 'refresh') {
      if (!options.webhookId) {
        logger.error('Missing --webhook-id parameter for refresh action.');
        return;
      }
      const res = await client.refreshWebhook(baseId, options.webhookId);
      logger.success(`Webhook ${options.webhookId} refreshed. New expiration: ${res.expirationTime}`);
    }
  } catch (err: any) {
    logger.error('Webhook operation failed:', err?.response?.data || err?.message || err);
  }
}
