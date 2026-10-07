import { Clip } from "@/lib/models/clip";
import { DeepReadonly } from "@/lib/util/type";

/**
 * `Cursor` abstracts the way the library is accessed.
 * It provides access to clips in a sequential manner.
 */
export interface Cursor {
  get clips(): Clip[];
  get canAdvance(): boolean;
  get canRevert(): boolean;
  /**
   * `advance` moves the cursor to the next clips batch.
   * Concurrent calls are queued together with calls to `revert`.
   */
  advance(): Promise<Clip[]>;
  /**
   * `revert` moves the cursor back to the previous clips batch.
   * Concurrent calls are queued together with calls to `advance`.
   */
  revert(): Promise<Clip[]>;
  abort(): void;
  dispose(): void;
};

export interface Filter {
  title?: string;
  authorID?: string;
  numberOfRoles?: number;
  sortByRating?: "asc" | "desc";
};

/**
 * `Library` abstracts the clips library.
 */
export interface Library {
  filter: DeepReadonly<Filter>;
  cursor(): Cursor;
};

export interface LibraryEvent {
  "filtered": {
    library: Library;
  },
}
