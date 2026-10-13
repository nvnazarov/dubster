import { createContext, useContext } from "react";
import { CommandBus } from "@/lib/services/commandBus";
import { EventsQueue } from "@/lib/services/eventsQueue";
import { ProducerCommand, ProducerEvent } from "@/lib/services/producer";
import ColorProvider from "@/lib/services/colorProvider";

export interface ProducerContext {
  eventsQueue?: EventsQueue<ProducerEvent>;
  commandBus?: CommandBus<ProducerCommand>;
  colorProvider?: ColorProvider;
}

export const ProducerContext = createContext<ProducerContext>({});

export function useEventsQueue(): EventsQueue<ProducerEvent> {
  const context = useContext(ProducerContext);
  if (context.eventsQueue === undefined) {
    throw "closest ProducerContext does not provide EventsQueue";
  }
  return context.eventsQueue;
}

export function useCommandBus(): CommandBus<ProducerCommand> {
  const context = useContext(ProducerContext);
  if (context.commandBus === undefined) {
    throw "closest ProducerContext does not provide CommandBus";
  }
  return context.commandBus;
}

export function useColorProvider(): ColorProvider {
  const context = useContext(ProducerContext);
  if (context.colorProvider === undefined) {
    throw "closest ProducerContext does not provide ColorProvider";
  }
  return context.colorProvider;
}
