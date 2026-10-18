"use client";
import { StateObject } from "@/lib/state";
import { createContext, useContext } from "react";

export type AuthContext = StateObject<{
  userID: string | null;
}>;

const context = createContext<AuthContext>({} as any);

export function useAuthContext() {
  return useContext(context);
}

export default context;
