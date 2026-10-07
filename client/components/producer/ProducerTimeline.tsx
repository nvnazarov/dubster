import style from "./ProducerTimeline.module.scss";
import { MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { useEventsQueue, useProducer } from "./ProducerContext";
import { Event } from "@/lib/services/eventsQueue";
import { Duration } from "@/lib/util/time";
import { type ProducerSegment, Video } from "@/lib/services/producer";
import { DeepReadonly } from "@/lib/util/type";

function Pointer() {
  const eq = useEventsQueue();
  const [progress, setProgress] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = null;
  }, []);

  const handleVideoPlay = useCallback((e: Event["producer.video.play"]) => {
    clear();
    const video = e.video;
    intervalRef.current = setInterval(() => {
      setProgress(
        e.video.offset.milliseconds() / e.video.duration.milliseconds(),
      );
    }, 20);
  }, []);

  const handleVideoStop = useCallback((e: Event["producer.video.stop"]) => {
    clear();
    setProgress(
      e.video.offset.milliseconds() / e.video.duration.milliseconds(),
    );
  }, []);

  const handleVideoSeek = useCallback((e: Event["producer.video.seek"]) => {
    clear();
    setProgress(
      e.video.offset.milliseconds() / e.video.duration.milliseconds(),
    );
  }, []);

  useEffect(() => {
    eq.subscribe("producer.video.play", handleVideoPlay);
    eq.subscribe("producer.video.stop", handleVideoStop);
    eq.subscribe("producer.video.seek", handleVideoSeek);
    return () => {
      eq.unsubscribe("producer.video.play", handleVideoPlay);
      eq.unsubscribe("producer.video.stop", handleVideoStop);
      eq.unsubscribe("producer.video.seek", handleVideoSeek);
    };
  }, [eq]);

  const left = 100 * progress + "%";
  return <div className={style.pointer} style={{ left }}></div>;
}

function Segments() {
  const eq = useEventsQueue();
  const [segments, setSegments] = useState<DeepReadonly<ProducerSegment>[]>([]);
  const [video, setVideo] = useState<Video | null>(null);

  const handleVideoOpen = useCallback((e: Event["producer.video.open"]) => {
    setVideo(e.video);
  }, []);

  const handleSegmentAdd = useCallback((e: Event["producer.segment.add"]) => {
    setSegments((segments) => [
      ...segments,
      e.producer.clip.segments[e.segment.id],
    ]);
  }, []);

  const handleSegmentRemove = useCallback(
    (e: Event["producer.segment.remove"]) => {
      setSegments((segments) =>
        segments.filter((segment) => segment.id !== e.segment.id),
      );
    },
    [],
  );

  useEffect(() => {
    eq.subscribe("producer.video.open", handleVideoOpen);
    eq.subscribe("producer.segment.add", handleSegmentAdd);
    eq.subscribe("producer.segment.remove", handleSegmentRemove);
    return () => {
      eq.unsubscribe("producer.segment.add", handleSegmentAdd);
      eq.unsubscribe("producer.segment.remove", handleSegmentRemove);
    };
  }, [eq]);

  return (
    video && (
      <>
        {segments.map((segment) => (
          <ProducerSegment key={segment.id} segment={segment} video={video} />
        ))}
      </>
    )
  );
}

export function ProducerTimeline() {
  const producer = useProducer();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const video = producer.video;
      if (video) {
        const offset =
          (video.duration.milliseconds() *
            (e.clientX - e.currentTarget.offsetLeft)) /
          e.currentTarget.clientWidth;
        video.seek(new Duration(offset));
      }
    },
    [producer],
  );

  const handleDoubleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const video = producer.video;
      if (video) {
        const offset =
          (video.duration.milliseconds() *
            (e.clientX - e.currentTarget.offsetLeft)) /
          e.currentTarget.clientWidth;
        producer.addSegment({
          begin: new Duration(offset),
          end: new Duration(
            Math.min(offset + 1000, video.duration.milliseconds()),
          ),
        });
      }
    },
    [producer],
  );

  return (
    <div
      className={style.container}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <Pointer />
      <Segments />
    </div>
  );
}
