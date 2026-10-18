import z from "zod/v4";

import ClipsStore from "@/lib/services/clipsStore";
import { Clip } from "@/lib/models/clip";

const ResponseSchema = z.object({
  url: z.url(),
});

export default class HTTPClipsStore implements ClipsStore {
  constructor(private baseURL: string) { }

  async upload(clipID: Clip["id"], video: Blob, options: { onProgress?: (progress: number) => void }): Promise<void> {
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

  async download(clipID: Clip["id"], options: { onProgress?: (progress: number) => void }): Promise<Blob> {
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