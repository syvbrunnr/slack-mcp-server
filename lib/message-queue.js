/**
 * Message Queue with JSON file persistence.
 *
 * Stores queued Slack messages for batch retrieval via get-queued-messages.
 * Uses a JSON file since better-sqlite3 is not available in this project.
 * Deduplicates by Slack message `ts` (unique per channel).
 *
 * Emits "new-item" events for notification triggering — always emitted even
 * for duplicates, so each server instance notifies its own subscriber.
 */

import { EventEmitter } from "events";
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const DATA_DIR = process.env.SLACK_MCP_DATA_DIR || join(homedir(), ".slack-mcp-data");
const DB_FILE = join(DATA_DIR, "message-queue.json");

/**
 * @typedef {Object} QueuedMessage
 * @property {string} ts - Slack message timestamp (unique ID)
 * @property {string} channelId - Channel ID
 * @property {string} channelName - Channel display name
 * @property {string} userId - Sender user ID
 * @property {string} userName - Sender display name (if resolved)
 * @property {number} timestamp - Unix timestamp (ms)
 * @property {boolean} isDM - Whether this is a direct message
 * @property {string} [text] - Message body (stored for queue retrieval only)
 * @property {string} [threadTs] - Thread parent timestamp if a thread reply
 * @property {boolean} [mentionsMe] - Whether this message mentions the authed user
 * @property {boolean} fetched - Whether this has been retrieved via get-queued-messages
 */

class MessageQueue extends EventEmitter {
  constructor() {
    super();
    mkdirSync(DATA_DIR, { recursive: true });
    this._items = [];
    this._seenKeys = new Set();
    this._load();
  }

  _load() {
    try {
      if (existsSync(DB_FILE)) {
        const data = JSON.parse(readFileSync(DB_FILE, "utf-8"));
        this._items = Array.isArray(data.items) ? data.items : [];
        // Rebuild the dedup set
        for (const item of this._items) {
          this._seenKeys.add(`${item.channelId}:${item.ts}`);
        }
      }
    } catch {
      this._items = [];
    }
  }

  _save() {
    const tempPath = `${DB_FILE}.${process.pid}.tmp`;
    try {
      writeFileSync(tempPath, JSON.stringify({ items: this._items }, null, 2));
      renameSync(tempPath, DB_FILE);
    } catch (e) {
      try { unlinkSync(tempPath); } catch {}
      console.error(`[message-queue] Failed to save: ${e.message}`);
    }
  }

  /**
   * Enqueue a message. Returns true if inserted (new), false if duplicate.
   * Always emits "new-item" for notification triggering regardless.
   */
  enqueue(msg) {
    const key = `${msg.channelId}:${msg.ts}`;
    const isDuplicate = this._seenKeys.has(key);

    if (!isDuplicate) {
      this._seenKeys.add(key);
      this._items.push({
        ...msg,
        fetched: false,
      });
      this._save();
    }

    // Always emit new-item even for duplicates — multiple instances may share
    // the same JSON file, and each instance needs to notify its subscriber.
    this.emit("new-item", msg);

    return !isDuplicate;
  }

  /**
   * Get count of unfetched items, optionally grouped.
   */
  peek() {
    const unfetched = this._items.filter(i => !i.fetched);
    const channels = {};
    for (const item of unfetched) {
      if (!channels[item.channelId]) {
        channels[item.channelId] = { channelId: item.channelId, channelName: item.channelName, count: 0 };
      }
      channels[item.channelId].count++;
    }
    return {
      count: unfetched.length,
      channels: Object.values(channels),
    };
  }

  /**
   * Dequeue all unfetched messages (marks them as fetched).
   * Optionally filter by channelId.
   */
  dequeue(channelId) {
    const results = [];
    for (const item of this._items) {
      if (item.fetched) continue;
      if (channelId && item.channelId !== channelId) continue;
      item.fetched = true;
      results.push({ ...item });
    }
    if (results.length > 0) {
      this._save();
    }
    return results;
  }

  /**
   * Clean up old fetched messages (older than maxAgeMs).
   * Keeps unfetched messages regardless of age.
   */
  cleanup(maxAgeMs = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - maxAgeMs;
    const before = this._items.length;
    this._items = this._items.filter(item => {
      if (!item.fetched) return true;
      return item.timestamp > cutoff;
    });
    // Rebuild the seen set
    this._seenKeys.clear();
    for (const item of this._items) {
      this._seenKeys.add(`${item.channelId}:${item.ts}`);
    }
    const removed = before - this._items.length;
    if (removed > 0) this._save();
    return removed;
  }
}

// Singleton
let instance = null;

export function getMessageQueue() {
  if (!instance) {
    instance = new MessageQueue();
  }
  return instance;
}

export function closeMessageQueue() {
  if (instance) {
    instance.removeAllListeners();
    instance = null;
  }
}
