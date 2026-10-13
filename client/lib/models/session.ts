import { Clip, Role } from "@/lib/models/clip";
import { User } from "@/lib/models/user";

export interface Session {
  id: string;
  hostID: User["id"];
  clipID: Clip["id"];
  participants: Set<string>;
  actors: Record<Role["id"], User["id"]>;
  grades: Record<User["id"], number>;
  rendered: boolean;
  finished: boolean;
  dateCreated: Date;
  dateStarted: Date;
  dateFinished: Date;
  dateGraded: Date;
  dateRendered: Date;
};
