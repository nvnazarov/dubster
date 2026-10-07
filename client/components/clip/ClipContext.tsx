import { type Clip } from "@/lib/models";
import { type EventsQueue } from "@/lib/services/eventsQueue";
import { type SessionRepository } from "@/lib/services/sessionRepository";
import { createContext, useContext } from "react";

export interface ClipContext {
  clip?: Clip;
  sessions?: SessionRepository;
  eventsQueue?: EventsQueue;
}

const ClipContext = createContext<ClipContext>({});

export function useSessionRepository(): SessionRepository {
  const context = useContext(ClipContext);
  if (!context.sessions) {
    throw "closest ClipContext does not provide SessionRepository";
  }
  return context.sessions;
}

export function useClip(): Clip {
  const context = useContext(ClipContext);
  if (!context.clip) {
    throw "closest ClipContext does not provide Clip";
  }
  return context.clip;
}

export function useEventsQueue(): EventsQueue {
  const context = useContext(ClipContext);
  if (!context.eventsQueue) {
    throw "closest ClipContext does not provide EventsQueue";
  }
  return context.eventsQueue;
}

export default ClipContext;
