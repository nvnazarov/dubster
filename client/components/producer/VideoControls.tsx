import { useCallback } from "react";

import style from "@/components/producer/VideoControls.module.scss";
import playIcon from "@/public/icons/play.png";
import pauseIcon from "@/public/icons/pause.png";
import stopIcon from "@/public/icons/stop.png";
import Button from "@/components/shared/html/Button";
import { useProducerContext } from "@/components/producer/context";
import { useObjectProperty } from "@/lib/state";
import { Duration } from "@/lib/time";
import { Segment } from "@/lib/models/clip";

export default function VideoControls() {
  const { video, producer, clip } = useProducerContext();
  const file = useObjectProperty(video, "file");
  const videoState = useObjectProperty(video, "state");
  const selectedSegmentID = useObjectProperty(producer, "selectedSegmentID");

  const stop = useCallback((segment: Segment | null) => {
    video.state = "stopped";
    video.offset = segment ? segment.begin : new Duration(0);
  }, []);

  const pause = useCallback(() => {
    video.state = "paused";
  }, []);

  const play = useCallback((segment: Segment | null) => {
    if (video.state === "stopped") {
      const offset = segment ? segment.begin : new Duration(0);
      video.offset = offset;
    }
    video.state = "playing";
  }, []);

  const selectedSegment = selectedSegmentID
    ? clip.segments.get(selectedSegmentID)
    : null;
  const isPlaying = videoState === "playing";
  const isStopped = videoState === "stopped";
  const isVideoOpen = file !== null;
  return (
    <div className={style.container}>
      <Button
        icon={isPlaying ? pauseIcon.src : playIcon.src}
        onClick={isPlaying ? pause : () => play(selectedSegment)}
        disabled={!isVideoOpen}
      />
      <Button
        icon={stopIcon.src}
        onClick={() => stop(selectedSegment)}
        disabled={!isVideoOpen || isStopped}
      />
    </div>
  );
}
