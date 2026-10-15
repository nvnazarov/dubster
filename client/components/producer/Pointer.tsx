import { useCallback, useEffect, useRef, useState } from "react";

import style from "@/components/producer/Pointer.module.scss";
import Event from "@/components/producer/events";
import { useEventsQueue } from "@/components/producer/context";
import Video from "@/lib/services/video";

export default function Pointer({ video }: { video: Video }) {
  const events = useEventsQueue();
  const [progress, setProgress] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = null;
  }, []);

  const handleVideoPlayed = useCallback((e: Event["video.played"]) => {
    clear();
    intervalRef.current = setInterval(() => {
      setProgress(video.offset.milliseconds / video.duration.milliseconds);
    }, 20);
  }, []);

  const handleVideoStopped = useCallback((e: Event["video.stopped"]) => {
    clear();
    setProgress(e.at.milliseconds / video.duration.milliseconds);
  }, []);

  useEffect(() => {
    events.subscribe("video.played", handleVideoPlayed);
    events.subscribe("video.stopped", handleVideoStopped);
    return () => {
      events.unsubscribe("video.played", handleVideoPlayed);
      events.unsubscribe("video.stopped", handleVideoStopped);
    };
  }, [events]);

  const left = 100 * progress + "%";
  return <div className={style.container} style={{ left }}></div>;
}
