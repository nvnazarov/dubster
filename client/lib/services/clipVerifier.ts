import { Clip } from "@/lib/models/clip";

/**
 * `ClipVerifier` abstracts clip verification system. It
 * processes a clip after it has been uploaded, verifing
 * its correctness.
 */
export default interface ClipVerifier {
  requestVerification(clipID: Clip["id"]): Promise<void>;
};
