import { Clip } from "@/lib/models/clip";

export type CreateOptions = Pick<Clip, "id" | "title" | "description" | "segments" | "roles">;

export default interface ClipsRepository {
  create(clip: CreateOptions): Promise<Clip>;
  find(clipID: Clip["id"]): Promise<Clip | null>;
  delete(clipID: Clip["id"]): Promise<void>;
};
