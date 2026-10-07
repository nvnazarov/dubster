export interface EventsQueue<Event> {
  publish<T extends keyof Event>(key: T, e: Event[T]): void;
  subscribe<T extends keyof Event>(key: T, callback: (e: Event[T]) => void): void;
  unsubscribe<T extends keyof Event>(key: T, callback: (e: Event[T]) => void): void;
};
