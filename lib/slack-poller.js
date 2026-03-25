/**
 * Slack Polling Loop
 *
 * Polls conversations.history for subscribed channels at a configurable interval.
 * Tracks the latest `ts` per channel to only fetch new messages.
 * New messages are enqueued into the message queue.
 */

import { slackAPI, resolveUser } from "./slack-client.js";
import { getMessageQueue } from "./message-queue.js";
import { getSubscription } from "./notification-subscriptions.js";
import { increment } from "./pipeline-metrics.js";

const POLL_INTERVAL = parseInt(process.env.SLACK_MCP_POLL_INTERVAL_MS || "5000", 10);

// Track the latest ts per channel so we only fetch new messages
const latestTs = new Map();

// Polling state
let pollTimer = null;
let isPolling = false;

// Cache of channel metadata (refreshed periodically)
let channelCache = new Map();
let channelCacheAge = 0;
const CHANNEL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache of authenticated user ID (for mentions detection)
let authUserId = null;

/**
 * Build the list of channel IDs to poll based on active subscription.
 */
async function getSubscribedChannelIds() {
  const sub = getSubscription();
  if (!sub) return [];

  // If subscribing to specific channels, use those
  if (sub.channels?.length && !sub.all && !sub.dms) {
    return sub.channels;
  }

  // For all/dms subscriptions, we need to discover channels
  await refreshChannelCache();

  const ids = [];
  for (const [id, info] of channelCache) {
    if (sub.all) {
      ids.push(id);
    } else if (sub.dms && info.isDM) {
      ids.push(id);
    } else if (sub.channels?.includes(id)) {
      ids.push(id);
    }
  }

  // Also include silent channels — they need polling for queuing
  if (sub.silentChannels?.length) {
    for (const id of sub.silentChannels) {
      if (!ids.includes(id)) ids.push(id);
    }
  }

  return ids;
}

/**
 * Refresh the channel cache (conversations.list).
 */
async function refreshChannelCache() {
  if (Date.now() - channelCacheAge < CHANNEL_CACHE_TTL && channelCache.size > 0) {
    return;
  }

  try {
    const result = await slackAPI("conversations.list", {
      types: "im,mpim,public_channel,private_channel",
      limit: 200,
      exclude_archived: true,
    });

    const newCache = new Map();
    for (const c of result.channels || []) {
      newCache.set(c.id, {
        name: c.name || c.id,
        isDM: !!c.is_im,
        isGroupDM: !!c.is_mpim,
        userId: c.user || null, // DM partner user ID
      });
    }
    channelCache = newCache;
    channelCacheAge = Date.now();
  } catch (err) {
    console.error(`[poller] Failed to refresh channel cache: ${err.message}`);
  }
}

/**
 * Get the authenticated user ID (for @mention detection).
 */
async function getAuthUserId() {
  if (authUserId) return authUserId;
  try {
    const result = await slackAPI("auth.test", {});
    authUserId = result.user_id;
    return authUserId;
  } catch {
    return null;
  }
}

/**
 * Poll a single channel for new messages.
 */
async function pollChannel(channelId) {
  const oldest = latestTs.get(channelId);
  const params = {
    channel: channelId,
    limit: 20,
    ...(oldest ? { oldest, inclusive: false } : { limit: 5 }),
  };

  try {
    const result = await slackAPI("conversations.history", params);
    const messages = result.messages || [];
    if (messages.length === 0) return;

    // Messages come newest-first, process oldest-first
    messages.reverse();

    const myUserId = await getAuthUserId();
    const queue = getMessageQueue();
    const info = channelCache.get(channelId) || { name: channelId, isDM: false };

    // Resolve DM partner name if needed
    let channelName = info.name;
    if (info.isDM && info.userId) {
      channelName = await resolveUser(info.userId);
    }

    for (const msg of messages) {
      // Skip bot messages from ourselves and message subtypes that aren't real messages
      if (msg.user === myUserId) continue;
      if (msg.subtype && msg.subtype !== "thread_broadcast") continue;

      increment("eventsReceived");

      // Check if this message mentions the authed user
      const mentionsMe = myUserId
        ? (msg.text || "").includes(`<@${myUserId}>`)
        : false;

      const userName = await resolveUser(msg.user);

      const isNew = queue.enqueue({
        ts: msg.ts,
        channelId,
        channelName,
        userId: msg.user || "",
        userName,
        timestamp: Math.floor(parseFloat(msg.ts) * 1000),
        isDM: !!info.isDM,
        text: msg.text || "",
        threadTs: msg.thread_ts || null,
        mentionsMe,
      });

      if (isNew) {
        increment("messagesEnqueued");
      } else {
        increment("messagesDeduplicated");
      }
    }

    // Update the latest ts to the newest message
    const newestTs = messages[messages.length - 1].ts;
    const currentLatest = latestTs.get(channelId);
    if (!currentLatest || parseFloat(newestTs) > parseFloat(currentLatest)) {
      latestTs.set(channelId, newestTs);
    }
  } catch (err) {
    // Don't crash on individual channel failures (e.g., channel_not_found, not_in_channel)
    if (err.message !== "channel_not_found" && err.message !== "not_in_channel") {
      console.error(`[poller] Error polling ${channelId}: ${err.message}`);
    }
  }
}

/**
 * Single poll cycle: poll all subscribed channels.
 */
async function pollCycle() {
  if (isPolling) return; // Skip if previous cycle still running
  isPolling = true;

  try {
    const channelIds = await getSubscribedChannelIds();
    if (channelIds.length === 0) return;

    // Poll channels sequentially to avoid rate limiting
    for (const id of channelIds) {
      await pollChannel(id);
    }

    // Periodic cleanup of old fetched messages (every ~100 cycles)
    if (Math.random() < 0.01) {
      getMessageQueue().cleanup();
    }
  } catch (err) {
    console.error(`[poller] Poll cycle error: ${err.message}`);
  } finally {
    isPolling = false;
  }
}

/**
 * Start the polling loop.
 */
export function startPolling() {
  if (pollTimer) return; // Already polling

  console.error(`[poller] Starting Slack polling (interval: ${POLL_INTERVAL}ms)`);

  // Initial poll immediately
  pollCycle().catch(err => console.error(`[poller] Initial poll failed: ${err.message}`));

  // Then poll on interval
  pollTimer = setInterval(() => {
    pollCycle().catch(err => console.error(`[poller] Poll failed: ${err.message}`));
  }, POLL_INTERVAL);
  pollTimer.unref(); // Don't prevent process exit
}

/**
 * Stop the polling loop.
 */
export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    console.error("[poller] Stopped Slack polling");
  }
}

/**
 * Check if polling is currently active.
 */
export function isPollingActive() {
  return pollTimer !== null;
}
