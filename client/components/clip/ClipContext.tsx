import { type Clip } from "@/lib/models/clip";
import { type EventsQueue } from "@/lib/services/eventsQueue";
import { type SessionsRepository } from "@/lib/services/sessionsRepository";
import { createContext, useContext } from "react";

export interface ClipContext {
  clip?: Clip;
  sessions?: SessionsRepository;
  eventsQueue?: EventsQueue<any>;
}

const ClipContext = createContext<ClipContext>({});

export function useSessionsRepository(): SessionsRepository {
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

export function useEventsQueue(): EventsQueue<any> {
  const context = useContext(ClipContext);
  if (!context.eventsQueue) {
    throw "closest ClipContext does not provide EventsQueue";
  }
  return context.eventsQueue;
}

export default ClipContext;
