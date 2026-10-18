import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import playIcon from "@/public/icons/play.png";
import Button from "@/components/shared/html/Button";
import { useClipContext } from "@/components/clip/context";

export default function PlayButton() {
  const router = useRouter();
  const { clip, sessions, store } = useClipContext();
  const [progress, setProgress] = useState<number | null>(null);

  const play = useCallback(async () => {
    setProgress(0);
    try {
      await store.download(clip.id, { onProgress: setProgress });
      const session = await sessions.create(clip.id);
      router.push(`/sessions/${session.id}`);
    } finally {
      setProgress(null);
    }
  }, [router, clip, sessions]);

  return (
    <Button
      text="Play"
      icon={playIcon.src}
      progress={progress || undefined}
      disabled={progress !== null}
      onClick={play}
      primary
    />
  );
}
