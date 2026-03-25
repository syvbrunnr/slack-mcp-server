/**
 * In-memory notification subscription store.
 * Controls which events trigger channel notifications (notifications/claude/channel).
 * No subscriptions = no notifications (silent by default).
 */

/**
 * @typedef {Object} Subscription
 * @property {string[]} [channels] - Channel IDs to watch
 * @property {boolean} [dms] - Watch all DMs
 * @property {boolean} [all] - Watch everything
 * @property {boolean} [mentionsOnly] - Only notify on @mentions
 * @property {string[]} [silentChannels] - Channel IDs that queue but skip push notifications
 */

/** @type {Subscription|null} */
let subscription = null;

/** Set the active subscription. Pass null to unsubscribe. */
export function setSubscription(sub) {
  subscription = sub;
}

/** Get the current subscription (null if none). */
export function getSubscription() {
  return subscription;
}

/** Check if an event matches the active subscription. */
export function matchesSubscription(event) {
  if (!subscription) return false;
  if (subscription.all) return true;
  if (subscription.dms && event.isDM) return true;
  if (subscription.channels?.length && subscription.channels.includes(event.channelId)) return true;
  if (subscription.mentionsOnly && event.mentionsMe) return true;
  return false;
}

/** Check if a channel is in the silent list (queue only, no channel notification). */
export function isSilentChannel(channelId) {
  if (!subscription?.silentChannels?.length) return false;
  return subscription.silentChannels.includes(channelId);
}
