import z from "zod/v4";

import SessionConnection, { SessionState } from "@/lib/services/session";
import { Role } from "@/lib/models/clip";
import { User } from "@/lib/models/user";
import { Entities, makeState, StateObject } from "@/lib/state";
import { clipSchema } from "./httpClipsRepository";

const MessageSchema = z.object({
  event: z.string(),
  data: z.any().optional(),
});

const RoleTakenOrReleasedDataSchema = z.object({
  roleID: z.string(),
  userID: z.string(),
});

const UserDataSchema = z.object({
  userID: z.string(),
});

const GradesData = z.object({
  grades: z.record(z.string(), z.number()),
});

const SessionStateData = z.object({
  clip: clipSchema,
  participants: z.record(z.string(), z.object({})),
  done: z.record(z.string(), z.object({})),
  actors: z.record(z.string(), z.string()),
  grades: z.record(z.string(), z.number()),
  phase: z.literal(["lobby", "rolePicking", "segmentsVoicing", "finalizing"]),
});

export default class WebSocketHub {
  constructor(private baseURL: string) { }

  connect(sessionID: string): SessionConnection {
    const ws = new WebSocket(`${this.baseURL}/v1/sessions/${sessionID}/connect`);
    const connection = new WebSocketConnection(ws);
    return connection;
  }
};

export class WebSocketConnection implements SessionConnection {
  state: StateObject<SessionState> = makeState({
    state: "connecting",
    phase: "lobby",
    grades: {},
    actors: new Entities((actor) => actor.roleID),
    participants: new Entities((participant) => participant.userID),
    done: new Entities((user) => user.userID),
    clip: {} as any,
  });

  constructor(private ws: WebSocket) {
    this.registerListeners();
  }

  private registerListeners() {
    const handleOpen = (e: Event) => { }

    const handleMessage = (e: MessageEvent<any>) => {
      try {
        const json = JSON.parse(e.data)
        const message = MessageSchema.parse(json);
        switch (message.event) {
          case "currentState": {
            const data = SessionStateData.parse(message.data);
            this.state.state = "connected";
            this.state.actors.fromEntries(Object.entries(data.actors).map(([roleID, userID]) => [roleID, { userID, roleID }]));
            this.state.clip = data.clip;
            this.state.done.fromEntries(Object.entries(data.done).map(([userID]) => [userID, { userID }]));
            this.state.phase = data.phase;
            this.state.grades = data.grades;
            this.state.participants.fromEntries(Object.entries(data.participants).map(([userID]) => [userID, { userID, name: "" }]));
            break;
          }
          case "roleTaken": {
            const data = RoleTakenOrReleasedDataSchema.parse(message.data);
            this.state.actors.replace({ userID: data.userID, roleID: data.roleID });
            break;
          }
          case "roleReleased": {
            const data = RoleTakenOrReleasedDataSchema.parse(message.data);
            this.state.actors.delete(data.roleID);
            break;
          }
          case "userConnected": {
            const data = UserDataSchema.parse(message.data);
            this.state.participants.replace({ userID: data.userID, name: "" });
            break;
          }
          case "userDisconnected": {
            const data = UserDataSchema.parse(message.data);
            this.state.participants.delete(data.userID);
            break;
          }
          case "userKicked": {
            const data = UserDataSchema.parse(message.data);
            this.state.participants.delete(data.userID);
            break;
          }
          case "userDone": {
            const data = UserDataSchema.parse(message.data);
            this.state.done.replace({ userID: data.userID });
            break;
          }
          case "graded": {
            const data = GradesData.parse(message.data);
            this.state.grades = data.grades;
            break;
          }
          case "switchedToRolePicking": {
            this.state.phase = "rolePicking";
            break;
          }
          case "switchedToSegmentsVoicing": {
            this.state.phase = "segmentsVoicing";
            break;
          }
          case "rendered": {
            // TODO
            break;
          }
          default:
            throw `unknown message type: ${message.event}`;
        }
      } catch (e) {
        console.error(e);
        this.disconnect();
      }
    }

    const handleError = (e: Event) => {
      console.error(e);
      removeListeners();
      this.disconnect();
    }

    const handleClose = (e: CloseEvent) => {
      console.info(`ws closed with code ${e.code}`);
      removeListeners();
      this.disconnect();
    }

    const removeListeners = () => {
      this.ws.removeEventListener("open", handleOpen);
      this.ws.removeEventListener("message", handleMessage);
      this.ws.removeEventListener("error", handleError);
      this.ws.removeEventListener("close", handleClose);
    };

    this.ws.addEventListener("open", handleOpen);
    this.ws.addEventListener("message", handleMessage);
    this.ws.addEventListener("error", handleError);
    this.ws.addEventListener("close", handleClose);
  }

  async switchToRolePicking(): Promise<void> {
    this.ws.send(JSON.stringify({
      cmd: "switchToRolePicking",
      args: {},
    }));
  }

  async switchToSegmentsVoicing(): Promise<void> {
    this.ws.send(JSON.stringify({
      cmd: "switchToSegmentsVoicing",
      args: {},
    }));
  }

  async done(): Promise<void> {
    this.ws.send(JSON.stringify({
      cmd: "done",
      args: {},
    }));
  }

  async kick(userID: User["id"]): Promise<void> {
    this.ws.send(JSON.stringify({
      cmd: "kick",
      args: {
        userID: userID,
      },
    }));
  }

  async takeRole(roleID: Role["id"]): Promise<void> {
    this.ws.send(JSON.stringify({
      cmd: "takeRole",
      args: {
        roleID: roleID,
      },
    }));
  }

  async releaseRole(roleID: Role["id"]): Promise<void> {
    this.ws.send(JSON.stringify({
      cmd: "releaseRole",
      args: {
        roleID: roleID,
      },
    }));
  }

  disconnect(): void {
    this.ws.close();
  }
};