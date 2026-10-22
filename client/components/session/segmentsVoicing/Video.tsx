import { useEffect, useRef } from "react";

import style from "@/components/session/segmentsVoicing/Video.module.scss";
import { useSessionContext } from "@/components/session/context";
import { useSegmentsVoicingContext } from "@/components/session/segmentsVoicing/context";
import { Duration } from "@/lib/time";
import { useObjectProperty } from "@/lib/state";

export default function Video() {
  const { connection } = useSessionContext();
  const ctx = useSegmentsVoicingContext();
  const clip = useObjectProperty(connection.state, "clip");
  const videoURLRef = useRef<string | null>(null);
  const htmlVideoRef = useRef<HTMLVideoElement>(null);
  const videoState = useObjectProperty(ctx.video, "state");
  const currentSegmentID = useObjectProperty(ctx, "currentSegmentID");
  const currentSegment = clip.segments[currentSegmentID]!;

  useEffect(() => {
    return () => {
      if (videoURLRef.current) {
        URL.revokeObjectURL(videoURLRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoState === "stopped") return;
    const htmlVideo = htmlVideoRef.current;
    if (!htmlVideo) return;
    const handleTimeUpdate = () => {
      let offset = htmlVideo.currentTime * 1000;
      if (offset > currentSegment.end.milliseconds) {
        ctx.video.state = "stopped";
        offset = currentSegment.end.milliseconds;
      }
      ctx.video.offset = new Duration(offset);
    };
    htmlVideo.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      htmlVideo.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [ctx, htmlVideoRef, currentSegment, videoState]);

  useEffect(() => {
    const htmlVideo = htmlVideoRef.current;
    if (!htmlVideo) return;
    const handleVideoEnded = () => {
      ctx.video.state = "stopped";
    };
    const handleVideoMetadataLoaded = () => {
      ctx.video.duration = new Duration(htmlVideo.duration * 1000);
    };
    htmlVideo.addEventListener("ended", handleVideoEnded);
    htmlVideo.addEventListener("loadedmetadata", handleVideoMetadataLoaded);
    return () => {
      htmlVideo.removeEventListener("ended", handleVideoEnded);
      htmlVideo.removeEventListener(
        "loadedmetadata",
        handleVideoMetadataLoaded,
      );
    };
  }, [ctx, htmlVideoRef]);

  useEffect(() => {
    const htmlVideo = htmlVideoRef.current;
    if (!htmlVideo) return;
    const videoURL = URL.createObjectURL(ctx.video.file);
    videoURLRef.current = videoURL;
    htmlVideo.src = videoURL;
  }, [ctx, htmlVideoRef]);

  useEffect(() => {
    const stateSub = ctx.video.subscribe("state", (state) => {
      const htmlVideo = htmlVideoRef.current;
      if (!htmlVideo) return;
      switch (state) {
        case "paused":
        case "stopped":
          try {
            htmlVideo.pause();
          } finally {
          }
          break;
        case "playing":
          htmlVideo.play();
          break;
      }
    });
    return () => {
      stateSub.cancel();
    };
  }, [ctx, htmlVideoRef]);

  useEffect(() => {
    const offsetSub = ctx.video.subscribe("offset", (offset) => {
      const htmlVideo = htmlVideoRef.current;
      if (!htmlVideo) return;
      if (ctx.video.state !== "playing") {
        htmlVideo.currentTime = offset.seconds;
      }
    });
    return () => {
      offsetSub.cancel();
    };
  }, [ctx, htmlVideoRef]);

  return <video ref={htmlVideoRef} className={style.container} />;
}
