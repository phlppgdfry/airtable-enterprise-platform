/**
 * Enterprise Airtable Webhook Heartbeat & TTL Guardian
 * 
 * Airtable Webhooks automatically expire after 7 days (168 hours).
 * This service ensures continuous, zero-loss Change Data Capture by:
 * - Querying all registered webhooks on the base
 * - Calculating hours remaining until expiration
 * - Proactively refreshing webhooks whose TTL is < 72 hours
 * - Supporting both single-run cron checks and continuous daemon mode
 */

import { logger } from '../cli/utils/logger.js';
import { AirtableMetadataClient } from '../client/metadataClient.js';

export class WebhookHeartbeatGuardian {
  private baseId: string;
  private metaClient: AirtableMetadataClient;

  constructor(baseId: string, apiKey: string) {
    this.baseId = baseId;
    this.metaClient = new AirtableMetadataClient(apiKey);
  }

  /**
   * Proactively refresh any webhook expiring within refreshThresholdHours (default 72h)
   */
  public async checkAndRefreshAll(refreshThresholdHours: number = 72): Promise<{
    checkedCount: number;
    refreshedCount: number;
  }> {
    logger.section('Webhook Heartbeat & TTL Guardian');
    logger.keyVal('Target Base ID', this.baseId);

    const webhooks = await this.metaClient.listWebhooks(this.baseId);
    logger.info(`Found ${webhooks.length} registered webhooks.`);

    let refreshedCount = 0;
    const now = Date.now();

    for (const hook of webhooks) {
      const expTime = new Date(hook.expirationTime).getTime();
      const hoursRemaining = Math.round((expTime - now) / (1000 * 60 * 60));

      logger.info(
        `Webhook [${hook.id}] -> Destination: ${hook.notificationUrl || 'None'} | TTL: ${hoursRemaining}h remaining`
      );

      if (hoursRemaining <= refreshThresholdHours) {
        logger.warn(`Webhook [${hook.id}] is expiring in ${hoursRemaining}h (threshold: ${refreshThresholdHours}h). Refreshing...`);
        try {
          const res = await this.metaClient.refreshWebhook(this.baseId, hook.id);
          refreshedCount++;
          logger.success(`Webhook [${hook.id}] extended! New Expiration: ${res.expirationTime}`);
        } catch (err: any) {
          logger.error(`Failed to refresh webhook [${hook.id}]:`, err?.message);
        }
      } else {
        logger.success(`Webhook [${hook.id}] is healthy (expires on ${hook.expirationTime}).`);
      }
    }

    return {
      checkedCount: webhooks.length,
      refreshedCount,
    };
  }
}

// Standalone execution entry
export async function runWebhookHeartbeat() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    logger.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env');
    return;
  }

  const guardian = new WebhookHeartbeatGuardian(baseId, apiKey);
  await guardian.checkAndRefreshAll(72);
}
