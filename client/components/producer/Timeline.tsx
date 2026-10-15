import { MouseEvent, useCallback, useEffect, useState } from "react";

import style from "@/components/producer/Timeline.module.scss";
import Event from "@/components/producer/events";
import SegmentView from "@/components/producer/Segment";
import Pointer from "@/components/producer/Pointer";
import { useCommandBus, useEventsQueue } from "@/components/producer/context";
import { Duration } from "@/lib/util/time";
import { DeepReadonly } from "@/lib/util/type";
import { Segment } from "@/lib/models/clip";
import Video from "@/lib/services/video";

function Segments({ video }: { video: Video }) {
  const events = useEventsQueue();
  const [segments, setSegments] = useState<DeepReadonly<Segment>[]>([]);

  const handleSegmentAdded = useCallback((e: Event["segment.added"]) => {
    setSegments((segments) => [...segments, e.segment]);
  }, []);

  const handleSegmentChanged = useCallback((e: Event["segment.changed"]) => {
    setSegments((segments) =>
      segments.map((segment) =>
        segment.id == e.segment.id ? e.segment : segment,
      ),
    );
  }, []);

  const handleSegmentDeleted = useCallback((e: Event["segment.deleted"]) => {
    setSegments((segments) =>
      segments.filter((segment) => segment.id !== e.segment.id),
    );
  }, []);

  useEffect(() => {
    events.subscribe("segment.added", handleSegmentAdded);
    events.subscribe("segment.changed", handleSegmentChanged);
    events.subscribe("segment.deleted", handleSegmentDeleted);
    return () => {
      events.unsubscribe("segment.added", handleSegmentAdded);
      events.unsubscribe("segment.changed", handleSegmentChanged);
      events.unsubscribe("segment.deleted", handleSegmentDeleted);
    };
  }, [events]);

  return (
    <>
      {segments.map((segment) => (
        <SegmentView key={segment.id} segment={segment} video={video} />
      ))}
    </>
  );
}

export default function Timeline() {
  const commands = useCommandBus();
  const events = useEventsQueue();
  const [video, setVideo] = useState<Video | null>(null);

  const handleVideoOpened = useCallback((e: Event["video.opened"]) => {
    setVideo(e.video);
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!video) return;
      const offset =
        (video.duration.milliseconds *
          (e.clientX - e.currentTarget.offsetLeft)) /
        e.currentTarget.clientWidth;
      commands.execute("video.seek", { at: new Duration(offset) });
    },
    [commands, video],
  );

  const handleDoubleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!video) return;
      const offset =
        (video.duration.milliseconds *
          (e.clientX - e.currentTarget.offsetLeft)) /
        e.currentTarget.clientWidth;
      commands.execute("segment.add", {
        segment: {
          id: crypto.randomUUID(),
          begin: new Duration(offset),
          end: new Duration(
            Math.min(offset + 1000, video.duration.milliseconds),
          ),
          line: "",
          roleID: "",
        },
      });
    },
    [commands, video],
  );

  useEffect(() => {
    events.subscribe("video.opened", handleVideoOpened);
    return () => {
      events.unsubscribe("video.opened", handleVideoOpened);
    };
  }, [events, handleVideoOpened]);

  const step = 200 / (video?.duration.seconds || 1);
  return (
    <div className={style.container}>
      {video && <Pointer video={video} />}
      <div
        className={style.scroll}
        style={{
          backgroundImage: "linear-gradient(90deg, transparent 50%, black 50%)",
          backgroundSize: `${step}% 1px`,
        }}
        onClick={handleClick}
      ></div>
      <div className={style.segments} onDoubleClick={handleDoubleClick}>
        {video && (
          <>
            <Segments video={video} />
          </>
        )}
      </div>
    </div>
  );
}
