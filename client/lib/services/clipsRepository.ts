import { Clip } from "@/lib/models/clip";

export type CreateOptions = Pick<Clip, "title" | "description" | "segments" | "roles">;

export default interface ClipsRepository {
  create(options: CreateOptions): Promise<Clip>;
  find(clipID: Clip["id"]): Promise<Clip | null>;
  delete(clipID: Clip["id"]): Promise<void>;
};
