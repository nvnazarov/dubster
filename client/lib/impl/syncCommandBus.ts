import CommandBus from "@/lib/services/commandBus";

export default class SyncCommandBus<Command> implements CommandBus<Command> {
  private handlers = new Map<keyof Command, (e: any) => any>();

  async execute<T extends keyof Command>(key: T, params: Command[T]): Promise<void> {
    const handler = this.handlers.get(key);
    if (!handler) {
      throw `no handler for command ${key.toString()}`;
    }
    return await handler(params);
  }

  handle<T extends keyof Command>(key: T, handler: (params: Command[T]) => void | Promise<void>): void {
    this.handlers.set(key, handler);
  }

  unhandle<T extends keyof Command>(key: T, handler: (params: Command[T]) => void | Promise<void>): void {
    if (this.handlers.get(key) == handler) {
      this.handlers.delete(key)
    }
  }
}