import { User } from "@/lib/models/user";
import { Clip, Role } from "@/lib/models/clip";
import { Entities, StateObject } from "@/lib/state";

export interface SessionState {
  state: "connecting" | "connected" | "disconnected";
  phase: "lobby" | "rolePicking" | "segmentsVoicing" | "finalizing";
  grades: Record<string, number>;
  participants: Entities<{
    userID: string;
    name: string;
  }>,
  actors: Entities<{
    roleID: string;
    userID: string;
  }>,
  done: Entities<{
    userID: string;
  }>;
  clip: Clip;
};

export default interface SessionConnection {
  state: StateObject<SessionState>;
  switchToRolePicking(): Promise<void>;
  switchToSegmentsVoicing(): Promise<void>;
  done(): Promise<void>;
  kick(userID: User["id"]): Promise<void>;
  takeRole(roleID: Role["id"]): Promise<void>;
  releaseRole(roleID: Role["id"]): Promise<void>;
  disconnect(): void;
};
