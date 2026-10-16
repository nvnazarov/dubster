import { createContext, useContext } from "react";

import { Entities, State } from "@/lib/state";
import ColorProvider from "@/lib/services/colorProvider";
import ClipsRepository from "@/lib/services/clipsRepository";
import { Role, Segment } from "@/lib/models/clip";
import ClipVerifier from "@/lib/services/clipVerifier";
import Video from "@/lib/services/video";

export interface ProducerContext {
  producer: State<{
    video: Video | null;
    selectedSegmentID: string | null;
    clip: State<{
      title: string;
      description: string;
      roles: Entities<Role>;
      segments: Entities<State<Segment>>;
    }>;
  }>;
  colorProvider: ColorProvider;
  clips: ClipsRepository;
  verifier: ClipVerifier;
}

export const context = createContext<ProducerContext>({} as any);

export function useProducerContext() {
  return useContext(context);
}

export default context;
