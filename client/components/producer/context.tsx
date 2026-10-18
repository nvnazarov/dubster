import { createContext, useContext } from "react";

import { Entities, StateObject } from "@/lib/state";
import ColorProvider from "@/lib/services/colorProvider";
import ClipsRepository from "@/lib/services/clipsRepository";
import { Role, Segment } from "@/lib/models/clip";
import ClipVerifier from "@/lib/services/clipVerifier";
import { Duration } from "@/lib/time";
import ClipsStore from "@/lib/services/clipsStore";

export interface ProducerContext {
  video: StateObject<{
    state: "stopped" | "paused" | "playing";
    offset: Duration;
    duration: Duration;
    file: Blob | null;
  }>;
  producer: StateObject<{
    selectedSegmentID: string | null;
  }>;
  clip: StateObject<{
    title: string;
    description: string;
    roles: Entities<StateObject<Role>>;
    segments: Entities<StateObject<Segment>>;
  }>;
  colorProvider: ColorProvider;
  clips: ClipsRepository;
  verifier: ClipVerifier;
  store: ClipsStore;
}

export const context = createContext<ProducerContext>({} as any);

export function useProducerContext() {
  return useContext(context);
}

export default context;
