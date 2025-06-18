interface LoginAttempt {
  timestamp: number;
  count: number;
  lockedUntil?: number;
}

export class AuthRateLimiter {
  private attempts: Map<string, LoginAttempt> = new Map();
  private readonly maxAttempts = 5;
  private readonly baseDelay = 1000; // 1 second
  private readonly maxDelay = 300000; // 5 minutes
  private readonly cleanupInterval = 900000; // 15 minutes
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Check if login attempt is allowed for the given identifier
   * Implements exponential backoff: 1s, 2s, 4s, 8s... up to 5 minutes
   * @param identifier - Email, username, or IP address
   * @returns Object with allowed status and wait time if locked
   */
  checkAttempt(identifier: string): { allowed: boolean; waitTime?: number; message?: string } {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt) {
      return { allowed: true };
    }

    // Check if currently locked
    if (attempt.lockedUntil && attempt.lockedUntil > now) {
      const waitTime = Math.ceil((attempt.lockedUntil - now) / 1000);
      return {
        allowed: false,
        waitTime,
        message: `Too many login attempts. Please try again in ${this.formatWaitTime(waitTime)}.`
      };
    }

    // Check if attempts exceeded
    if (attempt.count >= this.maxAttempts) {
      // Calculate exponential backoff
      const backoffTime = this.calculateBackoff(attempt.count - this.maxAttempts + 1);
      const lockedUntil = now + backoffTime;
      
      // Update lock time
      this.attempts.set(identifier, {
        ...attempt,
        lockedUntil
      });

      const waitTime = Math.ceil(backoffTime / 1000);
      return {
        allowed: false,
        waitTime,
        message: `Too many login attempts. Please try again in ${this.formatWaitTime(waitTime)}.`
      };
    }

    return { allowed: true };
  }

  /**
   * Record a failed login attempt
   * @param identifier - Email, username, or IP address
   */
  recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt) {
      this.attempts.set(identifier, {
        timestamp: now,
        count: 1
      });
    } else {
      this.attempts.set(identifier, {
        ...attempt,
        timestamp: now,
        count: attempt.count + 1
      });
    }
  }

  /**
   * Reset attempts for successful login
   * @param identifier - Email, username, or IP address
   */
  resetAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Calculate exponential backoff time
   * @param attemptNumber - Number of attempts beyond the limit
   * @returns Backoff time in milliseconds
   */
  private calculateBackoff(attemptNumber: number): number {
    // Exponential backoff: baseDelay * 2^(attemptNumber - 1)
    const delay = this.baseDelay * Math.pow(2, attemptNumber - 1);
    return Math.min(delay, this.maxDelay);
  }

  /**
   * Format wait time for user-friendly display
   * @param seconds - Wait time in seconds
   * @returns Formatted string
   */
  private formatWaitTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }

  /**
   * Start periodic cleanup of old attempts
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldAttempts();
    }, this.cleanupInterval);
  }

  /**
   * Remove attempts older than 15 minutes
   */
  private cleanupOldAttempts(): void {
    const now = Date.now();
    const cutoff = now - this.cleanupInterval;

    for (const [identifier, attempt] of this.attempts.entries()) {
      // Remove if old and not currently locked
      if (attempt.timestamp < cutoff && (!attempt.lockedUntil || attempt.lockedUntil < now)) {
        this.attempts.delete(identifier);
      }
    }
  }

  /**
   * Get current state for an identifier (for debugging)
   * @param identifier - Email, username, or IP address
   */
  getAttemptInfo(identifier: string): LoginAttempt | undefined {
    return this.attempts.get(identifier);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.attempts.clear();
  }
}

// Singleton instance
let rateLimiterInstance: AuthRateLimiter | null = null;

export function getAuthRateLimiter(): AuthRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new AuthRateLimiter();
  }
  return rateLimiterInstance;
}