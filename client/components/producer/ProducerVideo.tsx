import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

import style from "./ProducerVideo.module.scss";
import FilePicker from "@/components/shared/html/FilePicker";
import { useCommandBus, useEventsQueue } from "./ProducerContext";

export default function ProducerVideo() {
  const cb = useCommandBus();
  const eq = useEventsQueue();

  useEffect(() => {
    eq.subscribe("video.opened", () => {});
    return () => {
      eq.unsubscribe("video.opened", () => {});
    };
  }, [eq]);

  const handleFilePick = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (!files || files.length != 1) {
        return;
      }
      cb.execute("video.open", { file: files[0]! });
    },
    [cb],
  );

  return (
    <>
      <video src={videoURL} className={style.container} />
      <FilePicker onChange={handleFilePick} />
    </>
  );
}
