import { Clip, Role, Segment } from "@/lib/models/clip";
import { User } from "@/lib/models/user";

export interface Recording {
  id: string;
  segment: Segment;
  actor: User;
  session: Session;
  dateCreated: Date;
}

export interface Grade {
  id: string;
  grade: number;
  subject: User;
  session: Session;
  dateCreated: Date;
};

export interface Session {
  id: string;
  clip: Clip;
  host: User;
  recordings: Recording[];
  grades: Grade[];
  dateCreated: Date;
};

export interface SoloSession extends Session { };

export interface Participant {
  id: string;
  session: Session;
  user: User;
  roles: Role[];
};

export interface PartySession extends Session {
  participants: Participant;
};
