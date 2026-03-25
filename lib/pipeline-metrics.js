/**
 * Pipeline metrics for Slack channel notifications.
 * Simple counters tracking the notification pipeline health.
 */

const counters = {
  eventsReceived: 0,
  messagesEnqueued: 0,
  messagesDeduplicated: 0,
  notificationsSent: 0,
  notificationsFailed: 0,
};

/** Increment a named counter. */
export function increment(name) {
  if (name in counters) {
    counters[name]++;
  }
}

/** Get a snapshot of all counters. */
export function getMetrics() {
  return { ...counters };
}

/** Reset all counters to zero. */
export function resetMetrics() {
  for (const key of Object.keys(counters)) {
    counters[key] = 0;
  }
}
