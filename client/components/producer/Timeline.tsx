import { MouseEvent, useCallback, useEffect, useState } from "react";

import style from "@/components/producer/Timeline.module.scss";
import SegmentView from "@/components/producer/Segment";
import Pointer from "@/components/producer/Pointer";
import { Duration } from "@/lib/time";
import Video from "@/lib/services/video";
import { useProducerContext } from "./context";
import { use } from "@/lib/state";

function Segments({ video }: { video: Video }) {
  const { producer } = useProducerContext();
  const segments = use(producer.clip.segments);

  return (
    <>
      {segments.map((segment) => (
        <SegmentView key={segment.id} segment={segment} video={video} />
      ))}
    </>
  );
}

export default function Timeline() {
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
