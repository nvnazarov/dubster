import { createContext, useContext } from "react";

import { Clip } from "@/lib/models/clip";
import SessionsRepository from "@/lib/services/sessionsRepository";
import ClipsRepository from "@/lib/services/clipsRepository";
import ClipVerifier from "@/lib/services/clipVerifier";
import UsersRepository from "@/lib/services/usersRepository";

export interface ClipContext {
  clip: Clip;
  clips: ClipsRepository;
  sessions: SessionsRepository;
  verifier: ClipVerifier;
  users: UsersRepository;
}

const context = createContext<ClipContext>({} as any);

export function useClipContext(): ClipContext {
  return useContext(context);
}

export default context;
