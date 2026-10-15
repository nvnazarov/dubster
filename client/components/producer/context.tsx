import { createContext, useContext } from "react";

import Command from "@/components/producer/commands";
import Event from "@/components/producer/events";
import CommandBus from "@/lib/services/commandBus";
import EventsQueue from "@/lib/services/eventsQueue";
import ColorProvider from "@/lib/services/colorProvider";

export interface Context {
  eventsQueue?: EventsQueue<Event>;
  commandBus?: CommandBus<Command>;
  colorProvider?: ColorProvider;
}

export const context = createContext<Context>({});

export function useEventsQueue(): EventsQueue<Event> {
  const ctx = useContext(context);
  if (ctx.eventsQueue === undefined) {
    throw "closest ProducerContext does not provide EventsQueue";
  }
  return ctx.eventsQueue;
}

export function useCommandBus(): CommandBus<Command> {
  const ctx = useContext(context);
  if (ctx.commandBus === undefined) {
    throw "closest ProducerContext does not provide CommandBus";
  }
  return ctx.commandBus;
}

export function useColorProvider(): ColorProvider {
  const ctx = useContext(context);
  if (ctx.colorProvider === undefined) {
    throw "closest ProducerContext does not provide ColorProvider";
  }
  return ctx.colorProvider;
}

export default context;
