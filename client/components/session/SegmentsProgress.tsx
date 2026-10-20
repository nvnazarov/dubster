import { useCallback, useMemo } from "react";

import style from "@/components/session/SegmentsProgress.module.scss";
import { useSessionContext } from "@/components/session/lobby/context";
import { Segment } from "@/lib/models/clip";
import { useObjectProperty, useSnapshot } from "@/lib/state";

export default function SegmentsProgress() {
  const { session, userID } = useSessionContext();
  const actors = useSnapshot(session.actors);
  const recordings = useSnapshot(session.recordings);
  const currentSegmentID = useObjectProperty(session, "currentSegmentID");

  const mySegments = useMemo(() => {
    const myRoles = actors
      .filter(({ actorID }) => actorID === userID)
      .map(({ roleID }) => roleID);
    const isMySegment = ({ roleID }: Segment) => myRoles.includes(roleID);
    const mySegments = Object.values(session.clip.segments).filter(isMySegment);
    return mySegments;
  }, [actors, session, userID]);

  const mySegmentsWithStates = mySegments.map((s) => {
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
      session.currentSegmentID = id;
    },
    [session],
  );

  return (
    <div>
      {mySegmentsWithStates.map(({ segment, isRecorded, isCurrent }) => {
        const klass = isCurrent
          ? "current"
          : isRecorded
            ? "recorded"
            : "default";
        return (
          <div
            className={style[klass]}
            onClick={() => switchCurrentSegmentTo(segment.id)}
          />
        );
      })}
    </div>
  );
}
