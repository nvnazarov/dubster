import { type SoloSession } from "@/lib/services/soloSession";
import { createContext, useContext } from "react";

export interface SessionContext {
  session?: SoloSession;
}

export const SessionContext = createContext<SessionContext>({});

export function useSession(): SoloSession {
  const context = useContext(SessionContext);
  if (context.session === undefined) {
    throw "context has no session";
  }
  return context.session;
}
