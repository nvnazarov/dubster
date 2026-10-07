import { type EventsQueue } from "@/lib/services/eventsQueue";

export default class SyncEventsQueue<Event> implements EventsQueue<Event> {
  private callbacks = new Map<keyof Event, Set<(e: any) => void>>();

  publish<T extends keyof Event>(key: T, e: Event[T]) {
    for (const callback of this.callbacks.get(key) ?? []) {
      callback(e);
    }
  }

  subscribe<T extends keyof Event>(key: T, callback: (e: Event[T]) => void) {
    const callbacks = this.callbacks.get(key);
    if (callbacks) {
      callbacks.add(callback);
    } else {
      this.callbacks.set(key, new Set([callback]));
    }
  }

  unsubscribe<T extends keyof Event>(key: T, callback: (e: Event[T]) => void) {
    const callbacks = this.callbacks.get(key);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
};
