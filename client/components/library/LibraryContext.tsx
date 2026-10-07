import { type EventsQueue } from "@/lib/services/eventsQueue";
import { type Library } from "@/lib/services/library";
import { createContext, useContext } from "react";

export interface LibraryContext {
  library?: Library;
  eventsQueue?: EventsQueue;
}

const LibraryContext = createContext<LibraryContext>({});

export function useLibrary(): Library {
  const context = useContext(LibraryContext);
  if (!context.library) {
    throw "closest LibraryContext context does not provide library";
  }
  return context.library;
}

export function useEventsQueue(): EventsQueue {
  const context = useContext(LibraryContext);
  if (!context.eventsQueue) {
    throw "closest LibraryContext context does not provide eventsQueue";
  }
  return context.eventsQueue;
}

export default LibraryContext;
