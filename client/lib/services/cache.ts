export default interface Cache<T> {
  find(id: string): Promise<T | null>;
  save(id: string, value: T): Promise<void>;
  delete(id: string): Promise<void>;
};
