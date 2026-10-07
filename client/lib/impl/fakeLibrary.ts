import { Filter, type Cursor, type Library } from "@/lib/services/library";
import { type Clip } from "@/lib/models";
import { type EventsQueue } from "@/lib/services/eventsQueue";
import { type DeepReadonly } from "@/lib/util/type";
import { deepcopy } from "@/lib/util/copy";
import { sleep } from "@/lib/util/async";

class FakeCursor implements Cursor {
  private count = 0;
  private title: string;
  private pageSize: number;
  private totalClips: number;
  private _clips: Clip[] = [];
  private queue: Promise<void> = Promise.resolve();

  constructor(filter: DeepReadonly<Filter> = {}, {
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
        author: {
          id: "0",
          name: "fakeuser",
        },
        title: this.title === "" ? "Clip Title" : `${this.title}...`,
        description: "Clip description.",
        segments: {},
        verified: true,
        dateCreated: new Date(),
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
      await sleep(1000);
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
      await sleep(1000);
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
  private _filter: Filter = {};

  constructor(private eventsQueue: EventsQueue) { };

  get filter(): DeepReadonly<Filter> {
    return this._filter;
  }

  set filter(f: DeepReadonly<Filter>) {
    this._filter = { ...f };
    this.eventsQueue.publish("library.filter", { library: this });
  }

  cursor(): FakeCursor {
    const filter = deepcopy(this._filter);
    return new FakeCursor(filter);
  }
};
