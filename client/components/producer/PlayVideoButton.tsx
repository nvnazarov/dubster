import { useCallback, useEffect, useRef, useState } from "react";

import playIcon from "@/public/icons/play.png";
import pauseIcon from "@/public/icons/pause.png";
import Button from "@/components/shared/html/Button";
import Event from "@/components/producer/events";
import { useCommandBus, useEventsQueue } from "@/components/producer/context";
import { DeepReadonly } from "@/lib/util/type";
import { Segment } from "@/lib/models/clip";

export default function PlayVideoButton() {
  const events = useEventsQueue();
  const commands = useCommandBus();
  const [playing, setPlaying] = useState(false);
  const segmentRef = useRef<DeepReadonly<Segment>>(null);

  const handleVideoPlayed = useCallback(() => {
    setPlaying(true);
  }, []);

  const handleVideoStopped = useCallback(() => {
    setPlaying(false);
  }, []);

  const handleSegmentSelected = useCallback((e: Event["segment.selected"]) => {
    segmentRef.current = e.segment;
  }, []);

  const handleSegmentChanged = useCallback((e: Event["segment.changed"]) => {
    if (e.segment.id === segmentRef.current?.id) {
      segmentRef.current = e.segment;
    }
  }, []);

  useEffect(() => {
    events.subscribe("video.played", handleVideoPlayed);
    events.subscribe("video.stopped", handleVideoStopped);
    events.subscribe("segment.selected", handleSegmentSelected);
    events.subscribe("segment.changed", handleSegmentChanged);
    return () => {
      events.unsubscribe("video.played", handleVideoPlayed);
      events.unsubscribe("video.stopped", handleVideoStopped);
      events.unsubscribe("segment.selected", handleSegmentSelected);
      events.unsubscribe("segment.changed", handleSegmentChanged);
    };
  }, [events]);

  const handleClick = useCallback(async () => {
    if (playing) {
      await commands.execute("video.stop", undefined);
    } else {
      await commands.execute(
        "video.play",
        segmentRef.current
          ? {
              from: segmentRef.current.begin,
              to: segmentRef.current.end,
            }
          : {},
      );
    }
  }, [playing, commands]);

  return (
    <Button
      text={playing ? "Pause" : "Play"}
      icon={playing ? pauseIcon.src : playIcon.src}
      onClick={handleClick}
    />
  );
}
