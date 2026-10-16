import { useCallback, useState } from "react";

import Button from "@/components/shared/html/Button";
import { useClipContext } from "@/components/clip/context";

export default function VerifyButton() {
  const { clip, verifier } = useClipContext();
  const [requesting, setRequesting] = useState(false);

  const requestVerification = useCallback(async () => {
    setRequesting(true);
    await verifier
      .requestVerification(clip.id)
      .finally(() => setRequesting(false));
  }, [clip.id, verifier]);

  return (
    <Button
      text="Request verification"
      onClick={requestVerification}
      progress={requesting ? 0 : undefined}
      disabled={requesting}
      primary
    />
  );
}
