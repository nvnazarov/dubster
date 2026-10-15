import { MouseEvent, useCallback, useEffect, useState } from "react";

import style from "@/components/producer/Segment.module.scss";
import {
  useColorProvider,
  useCommandBus,
  useEventsQueue,
} from "@/components/producer/context";
import Event from "@/components/producer/events";
import { type Segment } from "@/lib/models/clip";
import { DeepReadonly } from "@/lib/util/type";
import Video from "@/lib/services/video";

export default function Segment({
  segment,
  video,
}: {
  segment: DeepReadonly<Segment>;
  video: Video;
}) {
  const commands = useCommandBus();
  const events = useEventsQueue();
  const colorProvider = useColorProvider();
  const [selected, setSelected] = useState(false);

  const handleSegmentSelected = useCallback(
    (e: Event["segment.selected"]) => {
      setSelected(e.segment.id === segment.id);
    },
    [segment.id],
  );

  useEffect(() => {
    events.subscribe("segment.selected", handleSegmentSelected);
    return () => {
      events.unsubscribe("segment.selected", handleSegmentSelected);
    };
  }, [events]);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      commands.execute("segment.select", { segmentID: segment.id });
      commands.execute("video.seek", { at: segment.begin });
    },
    [commands, segment.id],
  );

  const duration = segment.end.milliseconds - segment.begin.milliseconds;
  const width = (duration / video.duration.milliseconds) * 100 + "%";
  const left =
    (segment.begin.milliseconds / video.duration.milliseconds) * 100 + "%";
  console.log(segment.roleID);
  const roleColor = segment.roleID
    ? colorProvider.color(segment.roleID)
    : "grey";
  const borderColor =
    segment.line === "" || segment.roleID === "" ? "red" : "transparent";
  return (
    <div
      className={style.container}
      onClick={handleClick}
      style={{
        left,
        width,
        backgroundColor: roleColor,
        borderColor: borderColor,
        opacity: selected ? 0.9 : 0.2,
        pointerEvents: selected ? "none" : "all",
      }}
    ></div>
  );
}
