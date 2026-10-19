import Library, { Filter, Cursor } from "@/lib/services/library";
import { Clip } from "@/lib/models/clip";
import { DeepReadonly } from "@/lib/type";
import { Duration, sleep } from "@/lib/time";

class FakeCursor implements Cursor {
  private count = 0;
  private title: string;
  private pageSize: number;
  private totalClips: number;
  private _clips: Clip[] = [];
  private queue: Promise<void> = Promise.resolve();

  constructor(filter: DeepReadonly<Filter> = { sortByRating: false }, {
    pageSize = 20,
    totalClips = 45
  }: {
    pageSize?: number,
    totalClips?: number
  } = {}) {
    this.title = filter.title || "";
    this.pageSize = pageSize;
    this.totalClips = totalClips;
  }

  get clips(): DeepReadonly<Clip[]> {
    return this._clips;
  }

  get canAdvance(): boolean {
    return this.count < this.totalClips;
  }

  get canRevert(): boolean {
    return this.count > this.pageSize;
  }

  private updateClips() {
    const count = Math.min(this.pageSize, this.totalClips - this.count)
    this._clips = [];
    for (var i = 0; i < count; i++) {
      const id = this.count + i;
      this._clips.push({
        id: id.toString(),
        authorID: "fake-author",
        title: this.title === "" ? "Clip Title" : `${this.title}...`,
        description: "Clip description.",
        segments: {},
        roles: {},
        verified: true,
        dateCreated: new Date(),
        dateVerified: new Date(),
        rating: ((id ** 5 + 37) % 500 + 1) / 100,
      });
    }
    this.count += count;
  }

  async advance(): Promise<DeepReadonly<Clip[]>> {
    this.queue = this.queue.then(async () => {
      if (!this.canAdvance) {
        return;
      }
      await sleep(new Duration(1500));
      this.updateClips();
    });
    await this.queue;
    return this._clips;
  }

  async revert(): Promise<DeepReadonly<Clip[]>> {
    this.queue = this.queue.then(async () => {
      if (!this.canRevert) {
        return;
      }
      await sleep(new Duration(1500));
      this.count = Math.max(0, this.count - this._clips.length - this.pageSize);
      this.updateClips();
    });
    await this.queue;
    return this._clips;
  }

  abort() {
    // Nothing to abort.
  }

  dispose(): void {
    this.abort();
    this.count = 0;
    this.title = "";
    this._clips = [];
  }
}

export default class FakeLibrary implements Library {
  async cursor(filter: DeepReadonly<Filter>): Promise<FakeCursor> {
    return new FakeCursor({ ...filter });
  }
};
