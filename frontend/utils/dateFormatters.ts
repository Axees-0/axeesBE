/**
 * Shared date and time formatting utilities
 */

/**
 * Format a date as relative time (e.g., "5m ago", "Yesterday")
 * @param date - The date to format
 * @param options - Optional configuration for formatting
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
  date: Date,
  options: {
    showDaysUpTo?: number;
    yesterdayText?: string;
  } = {}
): string {
  const {
    showDaysUpTo = 7,
    yesterdayText = 'Yesterday'
  } = options;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return yesterdayText;
  } else if (diffDays < showDaysUpTo) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Format a date for display in messages (compatible with messages.tsx)
 * Shows relative time up to yesterday, then month/day
 */
export function formatMessageTime(date: Date): string {
  return formatRelativeTime(date, { showDaysUpTo: 2 });
}

/**
 * Format a date for display in notifications (compatible with notifications.tsx)
 * Shows relative time up to 7 days, then month/day
 */
export function formatNotificationTime(date: Date): string {
  return formatRelativeTime(date, { showDaysUpTo: 7 });
}