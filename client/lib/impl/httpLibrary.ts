import z from "zod/v4";
import { Filter, LibraryEvent, Cursor, Library } from "@/lib/services/library";
import { Clip } from "@/lib/models/clip";
import { DeepReadonly } from "@/lib/util/type";
import EventsQueue from "@/lib/services/eventsQueue";
import { clipSchema } from "@/lib/impl/httpClipsRepository";

const cursorResponseSchema = z.object({
  cursor: z.string(),
});

const searchResponseSchema = z.object({
  advanceCursor: z.string().optional(),
  revertCursor: z.string().optional(),
  clips: z.array(clipSchema),
})

class HTTPCursor implements Cursor {
  private _clips: Clip[] = [];
  private _revertCursor?: string;

  constructor(private _baseURL: string, private _advanceCursor?: string) { }

  get clips(): DeepReadonly<Clip[]> {
    return this._clips;
  }

  private async call(cursor: string): Promise<DeepReadonly<Clip[]>> {
    const cursorEncoded = encodeURIComponent(cursor);
    const response = await fetch(`${this._baseURL}/v1/library/search?cursor=${cursorEncoded}`, {
      method: "GET",
    });
    if (response.status != 200) {
      const text = await response.text();
      throw `failed to get batch at cursor ${cursor}: ${response.status} ${text}`;
    }
    const json = await response.json();
    const parsed = searchResponseSchema.parse(json);
    this._clips = parsed.clips;
    this._advanceCursor = parsed.advanceCursor;
    this._revertCursor = parsed.revertCursor;
    return parsed.clips;
  }

  get canAdvance(): boolean {
    return this._advanceCursor !== undefined;
  }

  get canRevert(): boolean {
    return this._revertCursor !== undefined;
  }

  async advance(): Promise<DeepReadonly<Clip[]>> {
    if (!this._advanceCursor) {
      throw "cannot advance";
    }
    return await this.call(this._advanceCursor);
  }

  async revert(): Promise<DeepReadonly<Clip[]>> {
    if (!this._revertCursor) {
      throw "cannot revert";
    }
    return await this.call(this._revertCursor);
  }

  abort() { }
  dispose() { }
};

export default class HTTPLibrary implements Library {
  private _filter: Filter = {};

  constructor(private baseURL: string, private eventsQueue: EventsQueue<LibraryEvent>) { };

  get filter(): DeepReadonly<Filter> {
    return this._filter;
  }

  set filter(filter: DeepReadonly<Filter>) {
    this._filter = { ...filter };
    this.eventsQueue.publish("filtered", { library: this });
  }

  async cursor(): Promise<HTTPCursor> {
    const response = await fetch(`${this.baseURL}/v1/library/cursor`, {
      method: "GET",
    });
    if (response.status != 200) {
      const text = await response.text();
      throw `failed to create cursor: ${response.status} ${text}`;
    }
    const json = await response.json();
    const parsed = cursorResponseSchema.parse(json);
    return new HTTPCursor(this.baseURL, parsed.cursor);
  }
}
