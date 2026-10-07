import { type Cursor, type Library } from "@/lib/services/library";
import { type Clip } from "@/lib/models/clip";
import { type DeepReadonly } from "@/lib/util/type";

class HTTPCursor implements Cursor {
  private _clips: Clip[] = [];
  private advanceCursor?: string;
  private revertCursor?: string;
  private unused: boolean = true;

  get clips(): DeepReadonly<Clip[]> {
    return this._clips;
  }

  private async callAPI(cursor?: string) {
    if (cursor !== undefined) {
      fetch(`/library?cursor=${cursor}`, { method: "GET" })
    } else {
      fetch(`/library/cursor?title=${""}`, { method: "POST" })
    }
  }

  canAdvance(): boolean {
    return this.advanceCursor !== undefined || this.unused;
  }

  canRevert(): boolean {
    return this.revertCursor !== undefined;
  }

  async advance(): Promise<void> {
    this.unused = true;
    await this.callAPI(this.advanceCursor);
  }

  async revert(): Promise<void> {
    this.unused = true;
    await this.callAPI(this.revertCursor);
  }
};

export default class HTTPLibrary implements Library {
  cursor(): HTTPCursor {
    return new HTTPCursor();
  }

  filterByTitle(title: string): void {
    throw new Error("Method not implemented.");
  }
}
