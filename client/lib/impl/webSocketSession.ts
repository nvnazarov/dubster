import { Session } from "@/lib/services/session";
import { Session as SessionType } from "@/lib/models/session";
import { Role } from "@/lib/models/clip";
import { User } from "@/lib/models/user";

export default class WebSocketSession implements Session {
  private _ws?: WebSocket;

  constructor(private _baseURL: string, readonly sessionID: SessionType["id"]) { }

  async connect(): Promise<void> {
    this._ws = new WebSocket(`${this._baseURL}/v1/sessions/${this.sessionID}/connect`);
  }

  async switchToRolePicking(): Promise<void> {
    this._ws?.send(JSON.stringify({
      cmd: "switchToRolePicking",
      args: {},
    }));
  }

  async switchToSegmentsVoicing(): Promise<void> {
    this._ws?.send(JSON.stringify({
      cmd: "switchToSegmentsVoicing",
      args: {},
    }));
  }

  async done(): Promise<void> {
    this._ws?.send(JSON.stringify({
      cmd: "done",
      args: {},
    }));
  }

  async kick(userID: User["id"]): Promise<void> {
    this._ws?.send(JSON.stringify({
      cmd: "kick",
      args: {
        userID: userID,
      },
    }));
  }

  async takeRole(roleID: Role["id"]): Promise<void> {
    this._ws?.send(JSON.stringify({
      cmd: "takeRole",
      args: {
        roleID: roleID,
      },
    }));
  }

  async releaseRole(roleID: Role["id"]): Promise<void> {
    this._ws?.send(JSON.stringify({
      cmd: "releaseRole",
      args: {
        roleID: roleID,
      },
    }));
  }
};