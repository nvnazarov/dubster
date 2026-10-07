import { CommandBus } from "@/lib/services/commandBus";

export default class SCommandBus<Command> implements CommandBus<Command> {
  private handlers = new Map<keyof Command, Set<(e: any) => Promise<void> | void>>();

  async execute<T extends keyof Command>(key: T, data: Command[T]): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const handler of this.handlers.get(key) ?? []) {
      promises.push(handler(data));
    }
    await Promise.all(promises);
    return;
  }

  handle<T extends keyof Command>(key: T, handler: (e: Command[T]) => Promise<void>): void {
    const handlers = this.handlers.get(key);
    if (handlers) {
      handlers.add(handler);
    } else {
      this.handlers.set(key, new Set([handler]));
    }
  }
}