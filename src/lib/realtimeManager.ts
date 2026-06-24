import { getSupabaseClient } from "./supabase";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface RealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  schema: string;
  table: string;
  old: Record<string, any>;
  new: Record<string, any>;
}

interface ChannelSubscription {
  table: string;
  event: RealtimeEvent;
  schema: string;
  filter?: string;
  callback: (payload: RealtimePayload) => void;
  statusCallback?: (status: string) => void;
}

interface ChannelState {
  channel: any;
  subscriptions: Map<string, ChannelSubscription>;
}

class RealtimeManager {
  private channels: Map<string, ChannelState> = new Map();
  private cleanupFns: Map<string, () => void> = new Map();

  subscribe(
    key: string,
    config: {
      table: string;
      event?: RealtimeEvent;
      schema?: string;
      filter?: string;
      callback: (payload: RealtimePayload) => void;
      onStatus?: (status: string) => void;
    }
  ): () => void {
    const event = config.event || "*";
    const schema = config.schema || "public";
    const channelName = `rt:${schema}:${config.table}:${event}${config.filter ? `:${config.filter}` : ""}`;

    if (!this.channels.has(channelName)) {
      this.createChannel(channelName);
    }

    const state = this.channels.get(channelName)!;
    const subKey = `${key}:${Date.now()}`;
    state.subscriptions.set(subKey, {
      table: config.table,
      event,
      schema,
      filter: config.filter,
      callback: config.callback,
      statusCallback: config.onStatus,
    });

    this.rebuildChannel(channelName);

    const cleanup = () => {
      const s = this.channels.get(channelName);
      if (s) {
        s.subscriptions.delete(subKey);
        if (s.subscriptions.size === 0) {
          this.destroyChannel(channelName);
        }
      }
    };
    this.cleanupFns.set(key, cleanup);
    return cleanup;
  }

  unsubscribe(key: string) {
    const fn = this.cleanupFns.get(key);
    if (fn) {
      fn();
      this.cleanupFns.delete(key);
    }
  }

  removeAll() {
    const sb = getSupabaseClient();
    if (sb) {
      for (const [name] of this.channels) {
        const ch = this.channels.get(name)?.channel;
        if (ch) {
          try { sb.removeChannel(ch); } catch {}
        }
      }
    }
    this.channels.clear();
    this.cleanupFns.clear();
  }

  private createChannel(channelName: string) {
    this.channels.set(channelName, {
      channel: null,
      subscriptions: new Map(),
    });
  }

  private destroyChannel(channelName: string) {
    const state = this.channels.get(channelName);
    if (state?.channel) {
      const sb = getSupabaseClient();
      if (sb) {
        try { sb.removeChannel(state.channel); } catch {}
      }
    }
    this.channels.delete(channelName);
  }

  private rebuildChannel(channelName: string) {
    const sb = getSupabaseClient();
    if (!sb) return;

    const state = this.channels.get(channelName);
    if (!state) return;

    // Remove old channel if exists
    if (state.channel) {
      try { sb.removeChannel(state.channel); } catch {}
    }

    // Create new channel with all subscriptions
    const channel = sb.channel(channelName);
    state.channel = channel;

    for (const [, sub] of state.subscriptions) {
      channel.on(
        "postgres_changes",
        {
          event: sub.event,
          schema: sub.schema,
          table: sub.table,
          ...(sub.filter ? { filter: sub.filter } : {}),
        },
        sub.callback
      );
    }

    channel.subscribe((status: string) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn(`[Realtime] Channel ${channelName} error: ${status}`);
      }
      for (const [, sub] of state.subscriptions) {
        sub.statusCallback?.(status);
      }
    });
  }
}

export const realtimeManager = new RealtimeManager();
