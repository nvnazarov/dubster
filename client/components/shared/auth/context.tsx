"use client";
import { State, state } from "@/lib/state";
import { createContext, useContext } from "react";

export type AuthContext = State<{
  userID: string | null;
}>;

const context = createContext<AuthContext>(
  state({
    userID: null,
  }),
);

export function useAuthContext() {
  return useContext(context);
}

export default context;
