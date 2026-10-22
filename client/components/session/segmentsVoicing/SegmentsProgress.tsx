import { useCallback, useMemo } from "react";

import style from "@/components/session/segmentsVoicing/SegmentsProgress.module.scss";
import { useSegmentsVoicingContext } from "@/components/session/segmentsVoicing/context";
import { useObjectProperty, useSnapshot } from "@/lib/state";
import { useSessionContext } from "../context";

export default function SegmentsProgress() {
  const { connection } = useSessionContext();
  const clip = useObjectProperty(connection.state, "clip");
  const ctx = useSegmentsVoicingContext();
  const segments = useObjectProperty(ctx, "segments");
  const recordings = useSnapshot(ctx.recordings);
  const currentSegmentID = useObjectProperty(ctx, "currentSegmentID");
  const currentSegment = clip.segments[currentSegmentID]!;

  const mySegmentsWithStates = segments.map((s) => {
    const isRecorded = recordings.some((r) => r.segmentID === s.id);
    const isCurrent = currentSegmentID === s.id;
    return {
      segment: s,
      isRecorded,
      isCurrent,
    };
  });

  const switchCurrentSegmentTo = useCallback(
    (id: string) => {
      ctx.currentSegmentID = id;
      ctx.video.offset = currentSegment.begin;
    },
    [ctx, currentSegment],
  );

  return (
    <div className={style.container}>
      {mySegmentsWithStates.map(({ segment, isRecorded, isCurrent }) => {
        const klass = isCurrent
          ? "current"
          : isRecorded
            ? "recorded"
            : "default";
        return (
          <div
            key={segment.id}
            className={style[klass]}
            onClick={() => switchCurrentSegmentTo(segment.id)}
          />
        );
      })}
    </div>
  );
}
