import z from "zod/v4";
import ClipsRepository, { CreateOptions } from "@/lib/services/clipsRepository";
import { Clip } from "@/lib/models/clip";
import { Duration } from "@/lib/util/time";

export const clipSchema = z.object({
  id: z.string(),
  authorID: z.string(),
  title: z.string(),
  rating: z.number().optional(),
  description: z.string().optional(),
  segments: z.record(z.string(), z.object({
    id: z.string(),
    begin: z.number().transform((ns) => new Duration(ns / 1000)),
    end: z.number().transform((ns) => new Duration(ns / 1000)),
    line: z.string(),
    roleID: z.string(),
  })),
  roles: z.record(z.string(), z.object({
    id: z.string(),
    name: z.string(),
    sex: z.literal(["male", "female"]).optional(),
  })),
  verified: z.boolean(),
  dateCreated: z.date(),
  dateVerified: z.date(),
});

export default class HTTPClipsRepostory implements ClipsRepository {
  constructor(private baseURL: string) { }

  async create(clip: CreateOptions): Promise<Clip> {
    const response = await fetch(`${this.baseURL}/v1/clips`, {
      method: "POST",
      body: JSON.stringify(clip),
    })
    if (response.status != 201) {
      const text = await response.text()
      throw `failed to create clip: ${response.status} ${text}`;
    }
    const json = await response.json();
    return clipSchema.parse(json);
  }

  async find(clipID: Clip["id"]): Promise<Clip | null> {
    const response = await fetch(`${this.baseURL}/v1/clips/${clipID}`, {
      method: "GET",
    })
    if (response.status == 404) {
      return null;
    }
    if (response.status != 200) {
      const text = await response.text();
      throw `failed to find clip: ${response.status} ${text}`;
    }
    const json = await response.json();
    return clipSchema.parse(json);
  }

  async delete(clipID: Clip["id"]): Promise<void> {
    const response = await fetch(`${this.baseURL}/v1/clips/${clipID}`, {
      method: "DELETE"
    })
    if (response.status != 204) {
      const text = await response.text()
      throw `failed to delete clip: ${response.status} ${text}`;
    }
  }
};
