/**
 * Channel Notification Tool Handlers
 *
 * Handlers for subscribe/unsubscribe, queued message retrieval,
 * and pipeline metrics tools.
 */

import { setSubscription, getSubscription } from "./notification-subscriptions.js";
import { getMessageQueue } from "./message-queue.js";
import { startPolling, stopPolling, isPollingActive } from "./slack-poller.js";
import { getMetrics } from "./pipeline-metrics.js";

function parseBool(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    return ['true', '1', 'yes', 'on'].includes(val.toLowerCase());
  }
  return false;
}

function asMcpJson(payload, isError = false) {
  return {
    content: [{
      type: "text",
      text: JSON.stringify(payload, null, 2)
    }],
    ...(isError ? { isError: true } : {})
  };
}

/**
 * Subscribe to Slack notifications handler
 */
export async function handleSubscribeNotifications(args) {
  const sub = {
    channels: args.channels || undefined,
    dms: parseBool(args.dms) || undefined,
    all: parseBool(args.all) || undefined,
    mentionsOnly: parseBool(args.mentions_only) || undefined,
    silentChannels: args.silent_channels || undefined,
  };

  // Clean up undefined values
  Object.keys(sub).forEach(k => sub[k] === undefined && delete sub[k]);

  setSubscription(sub);

  // Start polling if not already running
  if (!isPollingActive()) {
    startPolling();
  }

  const current = getSubscription();
  const parts = [];
  if (current?.all) parts.push("all messages");
  if (current?.dms) parts.push("all DMs");
  if (current?.mentionsOnly) parts.push("@mentions only");
  if (current?.channels?.length) parts.push(`channels: ${current.channels.join(", ")}`);
  if (current?.silentChannels?.length) parts.push(`silent channels (queue only): ${current.silentChannels.join(", ")}`);

  // Check for already-queued messages
  const pending = getMessageQueue().peek();
  const pendingNote = pending.count > 0
    ? ` Note: ${pending.count} message(s) already queued — use slack_get_queued_messages to retrieve them.`
    : "";

  return asMcpJson({
    status: "subscribed",
    polling: true,
    polling_interval_ms: parseInt(process.env.SLACK_MCP_POLL_INTERVAL_MS || "5000", 10),
    subscriptions: parts.length ? parts : ["none — no filters specified"],
    message: parts.length
      ? `Subscribed to notifications for: ${parts.join("; ")}.${pendingNote}`
      : "Subscription set but no filters specified — no notifications will fire. Use all, dms, channels, or mentions_only.",
  });
}

/**
 * Unsubscribe from notifications handler
 */
export async function handleUnsubscribeNotifications() {
  setSubscription(null);
  stopPolling();

  return asMcpJson({
    status: "unsubscribed",
    polling: false,
    message: "Unsubscribed from all notifications. Polling stopped.",
  });
}

/**
 * Get queued messages handler
 */
export async function handleGetQueuedMessages(args) {
  const queue = getMessageQueue();
  const messages = queue.dequeue(args.channel_id || undefined);

  return asMcpJson({
    count: messages.length,
    messages: messages.map(m => ({
      ts: m.ts,
      channel_id: m.channelId,
      channel_name: m.channelName,
      user_id: m.userId,
      user_name: m.userName,
      text: m.text,
      is_dm: m.isDM,
      thread_ts: m.threadTs || null,
      datetime: new Date(m.timestamp).toISOString(),
    })),
  });
}

/**
 * Get pipeline metrics handler
 */
export async function handleGetPipelineMetrics() {
  const metrics = getMetrics();
  const queue = getMessageQueue().peek();

  return asMcpJson({
    pipeline: metrics,
    queue: {
      unfetched: queue.count,
      channels: queue.channels,
    },
    polling: isPollingActive(),
    subscription_active: getSubscription() !== null,
  });
}
