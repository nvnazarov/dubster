import { SessionsRepository } from "@/lib/services/sessionsRepository";
import { Clip } from "@/lib/models/clip";
import { Session } from "@/lib/models/session";
import z from "zod/v4";

const sessionSchema = z.object({
  id: z.string(),
  hostID: z.string(),
  clipID: z.string(),
  participants: z.record(z.string(), z.object({})).transform((r) => new Set(Object.keys(r))),
  actors: z.record(z.string(), z.string()),
  grades: z.record(z.string(), z.number()),
  rendered: z.boolean(),
  finished: z.boolean(),
  dateCreated: z.date(),
  dateStarted: z.date(),
  dateFinished: z.date(),
  dateGraded: z.date(),
  dateRendered: z.date(),
});

const sessionsArraySchema = z.array(sessionSchema);

export default class HTTPSessionsRepository implements SessionsRepository {
  constructor(private baseURL: string) { }

  async create(clipID: Clip["id"]): Promise<Session> {
    const response = await fetch(`${this.baseURL}/v1/sessions?clip=${clipID}`, {
      method: "POST",
    })
    if (response.status != 201) {
      const text = await response.text()
      throw `failed to create session: ${response.status} ${text}`;
    }
    const json = await response.json();
    return sessionSchema.parse(json);
  }

  async my(): Promise<Session[]> {
    const response = await fetch(`${this.baseURL}/v1/sessions/my`, {
      method: "GET",
    })
    if (response.status != 200) {
      const text = await response.text()
      throw `failed to get my sessions: ${response.status} ${text}`;
    }
    const json = await response.json();
    return sessionsArraySchema.parse(json);
  }
}