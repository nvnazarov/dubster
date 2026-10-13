import playIcon from "@/public/icons/play.png";
import Button from "@/components/shared/html/Button";
import {
  useClip,
  useSessionsRepository,
  useEventsQueue,
} from "@/components/clip/ClipContext";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export default function PlaySoloButton() {
  const clip = useClip();
  const sessions = useSessionsRepository();
  const eventsQueue = useEventsQueue();
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const router = useRouter();

  const handleClick = useCallback(async () => {
    try {
      setProgress(0);
      const session = await sessions.create(clip.id);
      router.push(`/sessions/${session.id}`);
    } catch (e) {
      eventsQueue.publish("session.start.error", { error: e });
    } finally {
      setProgress(undefined);
    }
  }, [clip, sessions, eventsQueue]);

  return (
    <Button
      text="Play"
      icon={playIcon.src}
      progress={progress}
      onClick={progress === undefined ? handleClick : undefined}
      primary
    />
  );
}
