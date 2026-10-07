import ColorProvider from "@/lib/services/colorProvider";
import { CommandBus } from "@/lib/services/commandBus";
import { EventsQueue } from "@/lib/services/eventsQueue";
import {
  Producer,
  ProducerCommand,
  ProducerEvent,
} from "@/lib/services/producer";
import { createContext, useContext } from "react";

export interface ProducerContext {
  colorProvider?: ColorProvider;
  producer?: Producer;
  eventsQueue?: EventsQueue<ProducerEvent>;
  commandBus?: CommandBus<ProducerCommand>;
}

export const ProducerContext = createContext<ProducerContext>({});

export function useProducer(): Producer {
  const context = useContext(ProducerContext);
  if (context.producer === undefined) {
    throw "closest ProducerContext does not provide Producer";
  }
  return context.producer;
}

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
