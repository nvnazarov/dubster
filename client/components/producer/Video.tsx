import { useEffect, useRef, useState } from "react";

import style from "@/components/producer/Video.module.scss";
import { useProducerContext } from "./context";
import { Duration } from "@/lib/time";
import { useObjectProperty } from "@/lib/state";
import { Segment } from "@/lib/models/clip";

export default function Video() {
  const { video, producer, clip } = useProducerContext();
  const videoURLRef = useRef<string | null>(null);
  const htmlVideoRef = useRef<HTMLVideoElement>(null);
  const videoState = useObjectProperty(video, "state");
  const selectedSegmentID = useObjectProperty(producer, "selectedSegmentID");
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);

  useEffect(() => {
    if (!selectedSegmentID) {
      setSelectedSegment(null);
      return;
    }
    const segment = clip.segments.get(selectedSegmentID);
    setSelectedSegment(segment.snapshot());
    const sub = segment.subscribe(setSelectedSegment);
    return () => {
      sub.cancel();
    };
  }, [selectedSegmentID, clip]);

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
      if (!selectedSegment) {
        video.offset = new Duration(offset);
        return;
      }
      if (offset > selectedSegment.end.milliseconds) {
        video.state = "stopped";
        offset = selectedSegment.end.milliseconds;
      }
      video.offset = new Duration(offset);
    };
    htmlVideo.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      htmlVideo.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [htmlVideoRef, selectedSegment, videoState]);

  useEffect(() => {
    const htmlVideo = htmlVideoRef.current;
    if (!htmlVideo) return;
    const handleVideoEnded = () => {
      video.state = "stopped";
    };
    const handleVideoMetadataLoaded = () => {
      video.duration = new Duration(htmlVideo.duration * 1000);
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
  }, [htmlVideoRef]);

  useEffect(() => {
    const fileSub = video.subscribe("file", (file) => {
      const htmlVideo = htmlVideoRef.current;
      if (!file || !htmlVideo) return;
      const videoURL = URL.createObjectURL(file);
      if (videoURLRef.current) {
        URL.revokeObjectURL(videoURLRef.current);
      }
      videoURLRef.current = videoURL;
      htmlVideo.src = videoURL;
    });
    return () => {
      fileSub.cancel();
    };
  }, [htmlVideoRef]);

  useEffect(() => {
    const stateSub = video.subscribe("state", (state) => {
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
  }, [htmlVideoRef]);

  useEffect(() => {
    const offsetSub = video.subscribe("offset", (offset) => {
      const htmlVideo = htmlVideoRef.current;
      if (!htmlVideo) return;
      if (video.state !== "playing") {
        htmlVideo.currentTime = offset.seconds;
      }
    });
    return () => {
      offsetSub.cancel();
    };
  }, [htmlVideoRef]);

  return <video ref={htmlVideoRef} className={style.container} />;
}
