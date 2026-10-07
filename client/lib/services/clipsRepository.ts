import { Clip } from "@/lib/models/clip";

export interface ClipsRepository {
  create(clip: Clip): Promise<void>;
  update(clip: Clip): Promise<void>;
  find(clipID: Clip["id"]): Promise<Clip | null>;
  delete(clipID: Clip["id"]): Promise<void>;
};
