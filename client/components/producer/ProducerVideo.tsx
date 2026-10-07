import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

import style from "./ProducerVideo.module.scss";
import FilePicker from "@/components/shared/html/FilePicker";
import HTMLVideo from "@/lib/impl/htmlVideo";
import { useEventsQueue, useProducer } from "./ProducerContext";

export default function ProducerVideo() {
  const producer = useProducer();
  const eventsQueue = useEventsQueue();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoURLRef = useRef<string>(null);
  const [videoURL, setVideoURL] = useState<string | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (videoURLRef.current) {
        URL.revokeObjectURL(videoURLRef.current);
      }
    };
  }, []);

  const handleFilePick = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!videoRef.current) {
        return;
      }
      const files = e.currentTarget.files;
      if (!files) {
        return;
      }
      if (videoURLRef.current) {
        URL.revokeObjectURL(videoURLRef.current);
      }
      const url = URL.createObjectURL(files[0]);
      videoURLRef.current = url;
      setVideoURL(url);
      producer.openVideo(new HTMLVideo(videoRef.current, eventsQueue));
    },
    [producer, eventsQueue],
  );

  return (
    <>
      <video ref={videoRef} src={videoURL} className={style.container} />
      <FilePicker onChange={handleFilePick} />
    </>
  );
}
