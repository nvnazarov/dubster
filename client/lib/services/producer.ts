import { Clip, Role, Segment } from "@/lib/models/clip";
import ClipsRepository, { CreateOptions } from "@/lib/services/clipsRepository";
import { DeepReadonly } from "@/lib/util/type";

export default class Producer {
  private _title: string = "";
  private _description: string = "";
  private _segments: Record<Segment["id"], DeepReadonly<Segment>> = {};
  private _roles: Record<Role["id"], DeepReadonly<Role>> = {};

  constructor(private _clips: ClipsRepository) { }

  get roles() {
    return {
      add: (role: DeepReadonly<Role>) => {
        this._roles[role.id] = role;
      },
      change: (role: DeepReadonly<Role>) => {
        this._roles[role.id] = role;
      },
      delete: (roleID: Role["id"]): DeepReadonly<Role> => {
        const role = this._roles[roleID];
        if (!role) {
          throw "role does not exist";
        }
        delete this._roles[roleID];
        return role;
      },
      get: (roleID: string): DeepReadonly<Role> => {
        const role = this._roles[roleID];
        if (!role) {
          throw "role does not exist";
        }
        return role;
      },
    };
  }

  get segments() {
    return {
      add: (segment: DeepReadonly<Segment>) => {
        this._segments[segment.id] = segment;
      },
      change: (segment: DeepReadonly<Segment>) => {
        this._segments[segment.id] = segment;
      },
      delete: (segmentID: Segment["id"]): DeepReadonly<Segment> => {
        const segment = this._segments[segmentID];
        if (!segment) {
          throw "segment does not exist";
        }
        delete this._segments[segmentID];
        return segment;
      },
      get: (segmentID: string): DeepReadonly<Segment> => {
        const segment = this._segments[segmentID];
        if (!segment) {
          throw "segment does not exist";
        }
        return segment;
      },
    };
  }

  async produce(): Promise<Clip> {
    const clip: CreateOptions = {
      id: crypto.randomUUID(),
      title: this._title,
      description: this._description,
      segments: this._segments,
      roles: this._roles,
    };
    return await this._clips.create(clip);
  }
};
