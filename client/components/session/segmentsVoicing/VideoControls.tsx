import { useCallback } from "react";

import style from "@/components/producer/VideoControls.module.scss";
import playIcon from "@/public/icons/play.png";
import pauseIcon from "@/public/icons/pause.png";
import stopIcon from "@/public/icons/stop.png";
import Button from "@/components/shared/html/Button";
import { useObjectProperty } from "@/lib/state";
import { Duration } from "@/lib/time";
import { Segment } from "@/lib/models/clip";
import { useSegmentsVoicingContext } from "./context";
import { useSessionContext } from "../context";

export default function VideoControls() {
  const { connection } = useSessionContext();
  const clip = useObjectProperty(connection.state, "clip");
  const ctx = useSegmentsVoicingContext();
  const videoState = useObjectProperty(ctx.video, "state");
  const currentSegmentID = useObjectProperty(ctx, "currentSegmentID");

  const stop = useCallback(
    (segment: Segment | null) => {
      ctx.video.state = "stopped";
      ctx.video.offset = segment ? segment.begin : new Duration(0);
    },
    [ctx],
  );

  const pause = useCallback(() => {
    ctx.video.state = "paused";
  }, []);

  const play = useCallback((segment: Segment | null) => {
    if (ctx.video.state === "stopped") {
      const offset = segment ? segment.begin : new Duration(0);
      ctx.video.offset = offset;
    }
    ctx.video.state = "playing";
  }, []);

  const currentSegment = currentSegmentID
    ? clip.segments[currentSegmentID]!
    : null;
  const isPlaying = videoState === "playing";
  const isStopped = videoState === "stopped";
  return (
    <div className={style.container}>
      <Button
        icon={isPlaying ? pauseIcon.src : playIcon.src}
        onClick={isPlaying ? pause : () => play(currentSegment)}
      />
      <Button
        icon={stopIcon.src}
        onClick={() => stop(currentSegment)}
        disabled={isStopped}
      />
    </div>
  );
}
