import z from "zod/v4";

import ClipsStore from "@/lib/services/clipsStore";
import { Clip } from "@/lib/models/clip";
import Cache from "@/lib/services/cache";

const ResponseSchema = z.object({
  url: z.url(),
});

export default class HTTPClipsStore implements ClipsStore {
  constructor(private baseURL: string, private options?: { cache?: Cache<Blob> }) { }

  async upload(clipID: Clip["id"], video: Blob, options: { onProgress?: (progress: number) => void }): Promise<void> {
    this.options?.cache?.save(clipID, video).catch(console.error);
    const response = await fetch(`${this.baseURL}/v1/clips/${clipID}/upload-url`, { method: "GET" });
    if (response.status !== 200) {
      const text = await response.text();
      throw `failed to get upload url: ${response.status} ${text}`;
    }
    const json = await response.json();
    const { url } = ResponseSchema.parse(json);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader(
        "Content-Type",
        video.type || "application/octet-stream"
      );
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round(event.loaded / event.total);
          options?.onProgress?.(progress);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(`upload failed: ${xhr.status}`);
        }
      };
      xhr.onerror = () => reject("network error");
      xhr.onabort = () => reject("aborted");
      xhr.send(video);
    });
  }

  async download(clipID: Clip["id"], options?: { onProgress?: (progress: number) => void }): Promise<Blob> {
    if (this.options?.cache) {
      try {
        const video = await this.options.cache.find(clipID);
        if (video) {
          return video;
        }
      } catch (e) {
        console.error(e);
      }
    }
    const response = await fetch(`${this.baseURL}/v1/clips/${clipID}/download-url`, { method: "GET" });
    if (response.status !== 200) {
      const text = await response.text();
      throw `failed to get download url: ${response.status} ${text}`;
    }
    const json = await response.json();
    const { url } = ResponseSchema.parse(json);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url);
      xhr.responseType = "blob";
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round(event.loaded / event.total);
          options?.onProgress?.(progress);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(`download failed: ${xhr.status}`);
        }
      };
      xhr.onerror = () => reject("network error");
      xhr.onabort = () => reject("aborted");
      xhr.send();
    });
  }
}