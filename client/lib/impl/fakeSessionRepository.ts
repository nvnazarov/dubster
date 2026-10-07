import { type SessionRepository } from "@/lib/services/sessionRepository";
import { type Clip, type SoloSession, type PartySession, type Session } from "@/lib/models";
import { type DeepReadonly } from "@/lib/util/type";
import { sleep } from "@/lib/util/async";

export default class FakeSessionRepository implements SessionRepository {
  async solo(clip: Pick<DeepReadonly<Clip>, "id">): Promise<SoloSession> {
    return {
      id: "0",
      clip: {} as Clip,
      host: {
        id: "0",
        name: "",
      },
      grades: [],
      recordings: [],
      dateCreated: new Date(),
    };
  }

  party(clip: Pick<DeepReadonly<Clip>, "id">): Promise<PartySession> {
    throw new Error("Method not implemented.");
  }

  async forClip(clip: Pick<DeepReadonly<Clip>, "id">): Promise<Session[]> {
    await sleep(1000);
    return [{
      id: "0",
      clip: {} as Clip,
      host: {
        id: "0",
        name: "",
      },
      recordings: [],
      grades: [],
      dateCreated: new Date(),
    }];
  }
}