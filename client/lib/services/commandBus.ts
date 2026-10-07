export interface CommandBus<Command> {
  execute<T extends keyof Command>(key: T, data: Command[T]): Promise<void>;
  handle<T extends keyof Command>(key: T, handler: (data: Command[T]) => void): void;
}
