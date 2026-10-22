import { useCallback } from "react";

import Button from "@/components/shared/html/Button";
import { useSegmentsVoicingContext } from "@/components/session/segmentsVoicing/context";
import { useObjectProperty, useSnapshot } from "@/lib/state";

export default function NextSegmentButton() {
  const ctx = useSegmentsVoicingContext();
  const currentSegmentID = useObjectProperty(ctx, "currentSegmentID");
  const recordings = useSnapshot(ctx.recordings);
  const segments = useObjectProperty(ctx, "segments");

  const currentSegmentIndex = segments.findIndex(
    (s) => s.id === currentSegmentID,
  );
  const nextSegmentID =
    currentSegmentIndex + 1 < segments.length
      ? segments[currentSegmentIndex + 1]!.id
      : null;

  const next = useCallback(() => {
    if (!nextSegmentID) return;
    ctx.currentSegmentID = nextSegmentID;
  }, [segments, nextSegmentID]);

  const isCurrentSegmentRecorded =
    recordings.find((r) => r.segmentID === currentSegmentID) !== undefined;
  const hasNextSegment = nextSegmentID !== null;

  return (
    <Button
      text="Next"
      onClick={next}
      primary={hasNextSegment && isCurrentSegmentRecorded}
      disabled={!hasNextSegment}
    />
  );
}
