/**
 * Enterprise Airtable Token Bucket & Leaky Queue Rate Limiter
 * 
 * Airtable API enforces a strict rate limit of 5 requests per second per base.
 * Exceeding this rate returns HTTP 429 and triggers a 30-second throttle penalty.
 * This module guarantees compliance via:
 *  - Token bucket with 5 req/s capacity and smooth replenishment
 *  - Exponential backoff with full jitter on transient errors (429, 500, 502, 503)
 *  - Concurrent batch execution queue
 */

export interface RateLimiterOptions {
  maxRequestsPerSecond?: number;
  maxRetries?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
}

export class AirtableRateLimiter {
  private maxRps: number;
  private maxRetries: number;
  private initialBackoffMs: number;
  private maxBackoffMs: number;
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private tokens: number;
  private lastRefill: number;

  constructor(options: RateLimiterOptions = {}) {
    this.maxRps = options.maxRequestsPerSecond ?? 5;
    this.maxRetries = options.maxRetries ?? 5;
    this.initialBackoffMs = options.initialBackoffMs ?? 1000;
    this.maxBackoffMs = options.maxBackoffMs ?? 32000;
    this.tokens = this.maxRps;
    this.lastRefill = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsedMs = now - this.lastRefill;
    const tokensToAdd = (elapsedMs / 1000) * this.maxRps;
    this.tokens = Math.min(this.maxRps, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  private async waitForToken(): Promise<void> {
    while (true) {
      this.refillTokens();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const waitTime = Math.ceil(((1 - this.tokens) / this.maxRps) * 1000);
      await new Promise((resolve) => setTimeout(resolve, Math.max(20, waitTime)));
    }
  }

  /**
   * Schedule an async Airtable operation through the throttled queue
   * with automatic retry on 429 and 5xx errors.
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        let attempt = 0;
        while (attempt <= this.maxRetries) {
          try {
            await this.waitForToken();
            const result = await fn();
            resolve(result);
            return;
          } catch (error: any) {
            attempt++;
            const statusCode = error?.statusCode ?? error?.response?.status;
            const isRetryable = statusCode === 429 || (statusCode >= 500 && statusCode < 600);

            if (!isRetryable || attempt > this.maxRetries) {
              reject(error);
              return;
            }

            // Exponential backoff with full jitter
            const baseDelay = Math.min(
              this.maxBackoffMs,
              this.initialBackoffMs * Math.pow(2, attempt - 1)
            );
            const jitterDelay = Math.floor(Math.random() * baseDelay);
            const retryAfterSec = error?.response?.headers?.['retry-after'];
            const sleepMs = retryAfterSec ? parseInt(retryAfterSec, 10) * 1000 : jitterDelay;

            console.warn(
              `[RateLimiter] Received HTTP ${statusCode}. Retrying attempt ${attempt}/${this.maxRetries} after ${sleepMs}ms...`
            );
            await new Promise((res) => setTimeout(res, sleepMs));
          }
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    }

    this.isProcessing = false;
  }
}

export const globalRateLimiter = new AirtableRateLimiter();
