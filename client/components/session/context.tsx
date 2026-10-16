import Session from "@/lib/services/session";
import { createContext, useContext } from "react";

export interface SessionContext {
  session?: Session;
}

export const SessionContext = createContext<SessionContext>({});

export function useSession(): Session {
  const context = useContext(SessionContext);
  if (context.session === undefined) {
    throw "context has no session";
  }
  return context.session;
}
