import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import playIcon from "@/public/icons/play.png";
import Button from "@/components/shared/html/Button";
import { useClipContext } from "@/components/clip/context";

export default function PlayButton() {
  const router = useRouter();
  const { clip, sessions } = useClipContext();
  const [processing, setProcessing] = useState<boolean>(false);

  const play = useCallback(async () => {
    setProcessing(true);
    const session = await sessions
      .create(clip.id)
      .finally(() => setProcessing(false));
    router.push(`/sessions/${session.id}`);
  }, [router, clip, sessions]);

  return (
    <Button
      text="Play"
      icon={playIcon.src}
      progress={processing ? 0 : undefined}
      disabled={processing}
      onClick={play}
      primary
    />
  );
}
