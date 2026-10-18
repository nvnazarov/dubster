import { User } from "@/lib/models/user";
import { Duration } from "@/lib/time";

export const MaxTitleLength = 128;
export const MaxDescriptionLength = 2048;
export const MaxSegmentsCount = 100;
export const MaxRolesCount = 10;

export type Sex = "male" | "female";

export interface Role {
  id: string;
  name: string;
  sex?: Sex;
};

export interface Segment {
  id: string;
  begin: Duration;
  end: Duration;
  line: string;
  roleID: Role["id"];
};

export interface Clip {
  id: string;
  authorID: User["id"];
  title: string;
  rating?: number;
  description?: string;
  segments: Record<Segment["id"], Segment>;
  roles: Record<Role["id"], Role>;
  verified: boolean;
  dateCreated: Date;
  dateVerified: Date;
};
