import { Clip } from "@/lib/models/clip";
import ClipVerifier from "@/lib/services/clipVerifier";

export default class HTTPClipVerifier implements ClipVerifier {
  constructor(private baseURL: string) { }

  async requestVerification(clipID: Clip["id"]): Promise<void> {
    const response = await fetch(`${this.baseURL}/v1/clips/${clipID}/verify`, {
      method: "POST",
    })
    if (response.status != 202) {
      const text = await response.text();
      throw `verification request failed: ${response.status} ${text}`;
    }
  }
};
