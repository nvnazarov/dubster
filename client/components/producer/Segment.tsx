import { useCallback } from "react";

import style from "@/components/producer/Segment.module.scss";
import { useProducerContext } from "@/components/producer/context";
import { type Segment } from "@/lib/models/clip";
import { use, useField } from "@/lib/state";

export default function Segment({ segmentID }: { segmentID: string }) {
  const { colorProvider, producer } = useProducerContext();
  const video = useField(producer, "video");
  const selectedSegmentID = useField(producer, "selectedSegmentID");
  const segment = use(producer.clip.segments.get(segmentID));

  if (!video) {
    throw "video not open";
  }

  const selectThisSegment = useCallback(() => {
    producer.selectedSegmentID = segmentID;
  }, [segmentID]);

  const hasRole = Boolean(segment.roleID);
  const isSegmentInvalid = segment.line === "" || segment.roleID;
  const isSelected = segmentID === selectedSegmentID;

  const segmentDuration = segment.end.milliseconds - segment.begin.milliseconds;
  const roleColor = hasRole ? colorProvider.color(segment.roleID) : "grey";
  const width = (segmentDuration / video.duration.milliseconds) * 100 + "%";
  const left = (segment.begin.seconds / video.duration.seconds) * 100 + "%";
  const borderColor = isSegmentInvalid ? "red" : "transparent";

  return (
    <div
      className={style.container}
      onClick={selectThisSegment}
      style={{
        left,
        width,
        backgroundColor: roleColor,
        borderColor: borderColor,
        opacity: isSelected ? 0.9 : 0.2,
        pointerEvents: isSelected ? "none" : "all",
      }}
    ></div>
  );
}
