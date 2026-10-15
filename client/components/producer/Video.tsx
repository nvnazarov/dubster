import { useCallback, useEffect, useRef } from "react";

import style from "@/components/producer/Video.module.scss";
import Command from "@/components/producer/commands";
import { useCommandBus, useEventsQueue } from "@/components/producer/context";
import { Duration } from "@/lib/util/time";
import HTMLVideo from "@/lib/impl/htmlVideo";

export default function ProducerVideo() {
  const commands = useCommandBus();
  const events = useEventsQueue();
  const htmlVideoRef = useRef<HTMLVideoElement>(null);

  const executeVideoOpen = useCallback(
    async (cmd: Command["video.open"]) => {
      const htmlVideo = htmlVideoRef.current;
      if (!htmlVideo) return;
      const url = URL.createObjectURL(cmd.file);
      try {
        await new Promise<void>((resolve, reject) => {
          const onloadedmetadata = () => {
            cleanup();
            resolve();
          };
          const onerror = (e: ErrorEvent) => {
            cleanup();
            reject(e);
          };
          const cleanup = () => {
            htmlVideo.removeEventListener("loadedmetadata", onloadedmetadata);
            htmlVideo.removeEventListener("error", onerror);
          };
          htmlVideo.addEventListener("loadedmetadata", onloadedmetadata);
          htmlVideo.addEventListener("error", onerror);
          htmlVideo.src = url;
          htmlVideo.load();
        });
        events.publish("video.opened", {
          video: new HTMLVideo(htmlVideo),
        });
      } catch (_) {
        URL.revokeObjectURL(url);
      }
    },
    [events],
  );

  const executeVideoPlay = useCallback(
    async (cmd: Command["video.play"]) => {
      const htmlVideo = htmlVideoRef.current;
      if (!htmlVideo) return;
      const from = cmd.from?.seconds || 0;
      const to = cmd.to?.seconds || htmlVideo.duration;
      await htmlVideo.play();
      events.publish("video.played", {
        from: new Duration(from * 1000),
        to: new Duration(to * 1000),
      });
    },
    [events],
  );

  const executeVideoStop = useCallback(() => {
    const htmlVideo = htmlVideoRef.current;
    if (!htmlVideo) return;
    htmlVideo.pause();
    events.publish("video.stopped", {
      at: new Duration(htmlVideo.currentTime * 1000),
    });
  }, [events]);

  const executeVideoSeek = useCallback(
    (cmd: Command["video.seek"]) => {
      const htmlVideo = htmlVideoRef.current;
      if (!htmlVideo) return;
      htmlVideo.pause();
      htmlVideo.currentTime = cmd.at.seconds;
      events.publish("video.stopped", {
        at: new Duration(htmlVideo.currentTime * 1000),
      });
    },
    [events],
  );

  useEffect(() => {
    const htmlVideo = htmlVideoRef.current;
    if (!htmlVideo) return;
    const onended = () => {
      events.publish("video.stopped", {
        at: new Duration(htmlVideo.currentTime * 1000),
      });
    };
    htmlVideo.addEventListener("ended", onended);
    return () => {
      htmlVideo.removeEventListener("ended", onended);
    };
  }, [htmlVideoRef.current]);

  useEffect(() => {
    commands.handle("video.open", executeVideoOpen);
    commands.handle("video.play", executeVideoPlay);
    commands.handle("video.stop", executeVideoStop);
    commands.handle("video.seek", executeVideoSeek);
    return () => {
      commands.unhandle("video.open", executeVideoOpen);
      commands.unhandle("video.play", executeVideoPlay);
      commands.unhandle("video.stop", executeVideoStop);
      commands.unhandle("video.seek", executeVideoSeek);
    };
  }, [
    commands,
    executeVideoOpen,
    executeVideoPlay,
    executeVideoStop,
    executeVideoSeek,
  ]);

  return <video ref={htmlVideoRef} className={style.container} />;
}
