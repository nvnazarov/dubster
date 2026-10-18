import { Clip } from "@/lib/models/clip";

export default interface ClipsStore {
  upload(clipID: Clip["id"], video: Blob, options?: { onProgress?: (progress: number) => void }): Promise<void>;
  download(clipID: Clip["id"], options?: { onProgress?: (progress: number) => void }): Promise<Blob>;
}
