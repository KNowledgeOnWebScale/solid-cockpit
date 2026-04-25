type ChannelMessageHandler = (message: unknown, name?: string) => void;

class BrowserChannel {
  readonly name: string;
  #subscribers: Set<ChannelMessageHandler>;

  constructor(name: string) {
    this.name = name;
    this.#subscribers = new Set();
  }

  get hasSubscribers(): boolean {
    return this.#subscribers.size > 0;
  }

  publish(message: unknown): void {
    for (const handler of this.#subscribers) {
      try {
        handler(message, this.name);
      } catch {
        // Keep diagnostics hooks non-blocking in browser builds.
      }
    }
  }

  subscribe(handler: ChannelMessageHandler): void {
    this.#subscribers.add(handler);
  }

  unsubscribe(handler: ChannelMessageHandler): boolean {
    return this.#subscribers.delete(handler);
  }
}

const channelRegistry = new Map<string, BrowserChannel>();

function getOrCreateChannel(name: string): BrowserChannel {
  const existing = channelRegistry.get(name);
  if (existing) return existing;
  const created = new BrowserChannel(name);
  channelRegistry.set(name, created);
  return created;
}

type TracingChannelSet = {
  start: BrowserChannel;
  end: BrowserChannel;
  asyncStart: BrowserChannel;
  asyncEnd: BrowserChannel;
  error: BrowserChannel;
  hasSubscribers: boolean;
  traceSync<T>(fn: () => T, context?: unknown): T;
  tracePromise<T>(fn: () => Promise<T> | T, context?: unknown): Promise<T>;
};

function createTracingChannels(name: string): TracingChannelSet {
  const start = getOrCreateChannel(`${name}:start`);
  const end = getOrCreateChannel(`${name}:end`);
  const asyncStart = getOrCreateChannel(`${name}:asyncStart`);
  const asyncEnd = getOrCreateChannel(`${name}:asyncEnd`);
  const error = getOrCreateChannel(`${name}:error`);

  return {
    start,
    end,
    asyncStart,
    asyncEnd,
    error,
    get hasSubscribers() {
      return (
        start.hasSubscribers ||
        end.hasSubscribers ||
        asyncStart.hasSubscribers ||
        asyncEnd.hasSubscribers ||
        error.hasSubscribers
      );
    },
    traceSync<T>(fn: () => T, context?: unknown): T {
      start.publish(context);
      try {
        const result = fn();
        end.publish(context);
        return result;
      } catch (err) {
        error.publish(err);
        throw err;
      }
    },
    tracePromise<T>(fn: () => Promise<T> | T, context?: unknown): Promise<T> {
      asyncStart.publish(context);
      try {
        return Promise.resolve(fn())
          .then((result) => {
            asyncEnd.publish(context);
            return result;
          })
          .catch((err) => {
            error.publish(err);
            throw err;
          });
      } catch (err) {
        error.publish(err);
        return Promise.reject(err);
      }
    },
  };
}

export function channel(name: string): BrowserChannel {
  return getOrCreateChannel(name);
}

export function hasSubscribers(name: string): boolean {
  return getOrCreateChannel(name).hasSubscribers;
}

export function subscribe(name: string, handler: ChannelMessageHandler): void {
  getOrCreateChannel(name).subscribe(handler);
}

export function unsubscribe(
  name: string,
  handler: ChannelMessageHandler,
): boolean {
  return getOrCreateChannel(name).unsubscribe(handler);
}

export function tracingChannel(name: string | { start?: string }): TracingChannelSet {
  const baseName = typeof name === "string" ? name : name.start || "trace";
  return createTracingChannels(baseName);
}

export default {
  channel,
  hasSubscribers,
  subscribe,
  unsubscribe,
  tracingChannel,
};
