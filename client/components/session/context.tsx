import { createContext, useContext } from "react";

import SessionConnection from "@/lib/services/session";

export interface SessionContext {
  connection: SessionConnection;
}

export const context = createContext<SessionContext>({} as any);

export function useSessionContext() {
  return useContext(context);
}

export default context;
