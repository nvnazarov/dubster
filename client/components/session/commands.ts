import { User } from "@/lib/models/user";
import { Role } from "@/lib/models/clip";

export default interface Command {
  "role.take": {
    userID: User["id"];
    roleID: Role["id"];
  },
  "role.release": {
    userID: User["id"];
    roleID: Role["id"];
  },
  "user.done": {
    userID: User["id"];
  },
  "user.kicked": {
    userID: User["id"];
  },
  "user.connected": {
    userID: User["id"];
  },
  "user.disconnected": {
    userID: User["id"];
  },
  "session.rendered": void,
  "session.graded": {
    grades: Record<User["id"], number>;
  },
};
