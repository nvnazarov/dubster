import z from "zod/v4";

import Library, { Filter, Cursor } from "@/lib/services/library";
import { Clip } from "@/lib/models/clip";
import { DeepReadonly } from "@/lib/type";
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

  dispose() {
    this._clips = [];
  }
};

export default class HTTPLibrary implements Library {
  constructor(private baseURL: string) { };

  async cursor(filter: DeepReadonly<Filter>): Promise<HTTPCursor> {
    const url = new URL(`${this.baseURL}/v1/library/cursor`);
    if (filter.authorID) {
      url.searchParams.append("author", filter.authorID);
    }
    if (filter.numberOfRoles) {
      url.searchParams.append("roles", filter.numberOfRoles.toString());
    }
    if (filter.title) {
      url.searchParams.append("title", filter.title);
    }
    if (filter.sortByRating) {
      url.searchParams.append("sort", filter.sortByRating);
    }
    const response = await fetch(url, { method: "GET" });
    if (response.status != 200) {
      const text = await response.text();
      throw `failed to create cursor: ${response.status} ${text}`;
    }
    const json = await response.json();
    const parsed = cursorResponseSchema.parse(json);
    return new HTTPCursor(this.baseURL, parsed.cursor);
  }
}
