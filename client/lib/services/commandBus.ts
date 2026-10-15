export default interface CommandBus<Command> {
  execute<T extends keyof Command>(key: T, command: Command[T]): Promise<void>;
  handle<T extends keyof Command>(key: T, handler: (command: Command[T]) => void): void;
  unhandle<T extends keyof Command>(key: T, handler: (command: Command[T]) => void): void;
}
