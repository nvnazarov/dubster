import { Clip } from "@/lib/models/clip";

export default interface ClipVerifier {
  requestVerification(clipID: Clip["id"]): Promise<void>;
};
