import { User } from "@/lib/models/user";
import { Role } from "@/lib/models/clip";

export interface Session {
  switchToRolePicking(): Promise<void>;
  switchToSegmentsVoicing(): Promise<void>;
  done(): Promise<void>;
  kick(userID: User["id"]): Promise<void>;
  takeRole(roleID: Role["id"]): Promise<void>;
  releaseRole(roleID: Role["id"]): Promise<void>;
};
