/**
 * Rate Limiter for Google API Calls
 * 
 * Implements a token bucket algorithm to control the rate of API requests.
 * Google Sheets API allows 100 requests per 100 seconds (~1 req/sec).
 * 
 * This limiter ensures we stay well within limits by:
 * - Allowing a burst of up to 20 requests
 * - Refilling tokens at 1 token per second
 * - Queuing requests when tokens are exhausted
 */

// Configuration
const MAX_TOKENS = 20;           // Maximum burst capacity
const REFILL_RATE = 1;           // Tokens added per second
const REFILL_INTERVAL = 1000;    // Refill every 1 second

// Global state (persists across requests in the same serverless instance)
let tokens = MAX_TOKENS;
let lastRefill = Date.now();
let queue: Array<{
    resolve: (value: void) => void;
    reject: (reason: Error) => void;
    timestamp: number;
}> = [];
let processing = false;

/**
 * Refill tokens based on elapsed time
 */
function refillTokens(): void {
    const now = Date.now();
    const elapsed = now - lastRefill;
    const tokensToAdd = Math.floor(elapsed / REFILL_INTERVAL) * REFILL_RATE;

    if (tokensToAdd > 0) {
        tokens = Math.min(MAX_TOKENS, tokens + tokensToAdd);
        lastRefill = now;
    }
}

/**
 * Process queued requests
 */
async function processQueue(): Promise<void> {
    if (processing) return;
    processing = true;

    while (queue.length > 0) {
        refillTokens();

        if (tokens > 0) {
            const request = queue.shift();
            if (request) {
                tokens--;
                request.resolve();
            }
        } else {
            // Wait for next token refill
            await new Promise(resolve => setTimeout(resolve, REFILL_INTERVAL));
        }
    }

    processing = false;
}

/**
 * Acquire a token before making a Google API call.
 * Returns a promise that resolves when it's safe to proceed.
 * 
 * @param timeout Maximum time to wait in ms (default: 30 seconds)
 * @throws Error if timeout is exceeded
 */
export async function acquireToken(timeout: number = 30000): Promise<void> {
    refillTokens();

    // If we have tokens available, proceed immediately
    if (tokens > 0) {
        tokens--;
        return;
    }

    // Otherwise, queue the request
    return new Promise((resolve, reject) => {
        const queueEntry = {
            resolve,
            reject,
            timestamp: Date.now(),
        };

        queue.push(queueEntry);

        // Set timeout
        const timeoutId = setTimeout(() => {
            const index = queue.indexOf(queueEntry);
            if (index > -1) {
                queue.splice(index, 1);
                reject(new Error('Rate limit timeout: Too many registrations. Please try again in a few seconds.'));
            }
        }, timeout);

        // Clear timeout when resolved
        const originalResolve = queueEntry.resolve;
        queueEntry.resolve = () => {
            clearTimeout(timeoutId);
            originalResolve();
        };

        // Start processing queue
        processQueue();
    });
}

/**
 * Get current queue status for user feedback
 */
export function getQueueStatus(): {
    availableTokens: number;
    queueLength: number;
    estimatedWaitSeconds: number;
} {
    refillTokens();

    const estimatedWait = tokens > 0
        ? 0
        : Math.ceil((queue.length + 1 - tokens) / REFILL_RATE);

    return {
        availableTokens: tokens,
        queueLength: queue.length,
        estimatedWaitSeconds: estimatedWait,
    };
}

/**
 * Wrapper for Google API calls with automatic retry on quota errors
 * 
 * @param fn The function to execute
 * @param maxRetries Maximum number of retries (default: 3)
 */
export async function withRateLimit<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Wait for rate limit token
            await acquireToken();

            // Execute the function
            return await fn();
        } catch (error) {
            lastError = error as Error;
            const errorMessage = lastError.message || '';

            // Check if it's a quota error
            if (errorMessage.includes('Quota exceeded') ||
                errorMessage.includes('Rate Limit') ||
                errorMessage.includes('RATE_LIMIT_EXCEEDED')) {

                // Wait before retrying (exponential backoff)
                const waitTime = Math.pow(2, attempt) * 1000;
                console.warn(`Rate limit hit, retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                // Not a rate limit error, don't retry
                throw error;
            }
        }
    }

    throw lastError || new Error('Rate limit exceeded after maximum retries');
}

/**
 * Reset the rate limiter (useful for testing)
 */
export function resetRateLimiter(): void {
    tokens = MAX_TOKENS;
    lastRefill = Date.now();
    queue = [];
    processing = false;
}
