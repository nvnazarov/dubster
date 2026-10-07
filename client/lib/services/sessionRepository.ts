import { Clip } from "@/lib/models/clip";
import { DeepReadonly } from "@/lib/util/type";

export interface SessionRepository {
  createSoloSession(clipID: Clip["id"]): Promise<void>;
  solo(clip: Pick<DeepReadonly<Clip>, "id">): Promise<SoloSession>;
  party(clip: Pick<DeepReadonly<Clip>, "id">): Promise<PartySession>;
  forClip(clip: Pick<DeepReadonly<Clip>, "id">): Promise<Session[]>;
}
