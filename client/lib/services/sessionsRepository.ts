import { Clip } from "@/lib/models/clip";
import { Session } from "@/lib/models/session";

export interface SessionsRepository {
  create(clipID: Clip["id"]): Promise<Session>;
  my(): Promise<Session[]>;
}
