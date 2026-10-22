import { createContext, useContext } from "react";

import { Entities, StateObject } from "@/lib/state";
import { Segment } from "@/lib/models/clip";
import { Duration } from "@/lib/time";

export type SegmentsVoicingContext = StateObject<{
  segments: Segment[];
  recordings: Entities<{
    segmentID: string;
    audio: Blob;
  }>;
  currentSegmentID: string;
  video: StateObject<{
    state: "stopped" | "paused" | "playing";
    offset: Duration;
    duration: Duration;
    file: Blob;
  }>;
}>;

export const context = createContext<SegmentsVoicingContext>({} as any);

export function useSegmentsVoicingContext() {
  return useContext(context);
}

export default context;
