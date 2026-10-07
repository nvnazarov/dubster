import { Clip, Role, Segment } from "@/lib/models/clip";
import { EventsQueue } from "@/lib/services/eventsQueue";
import { Duration } from "@/lib/util/time";
import { DeepReadonly } from "@/lib/util/type";

export interface ProducerCommand {
  "video.play": {
    from?: Duration;
    to?: Duration;
  };
  "video.stop": void;
  "video.continue": void;
}

export interface ProducerEvent {
  "video.played": {
    video: Video;
    from?: Duration;
    to?: Duration;
  },
  "video.stopped": {
    video: Video;
    at: Duration;
  },
  "video.seeked": {
    video: Video;
    at: Duration;
  },
  "clip.title.changed": {
    producer: Producer;
    title: string;
  },
  "clip.description.changed": {
    producer: Producer;
    description: string | undefined;
  },
  "clip.segments.added": {
    producer: Producer;
    segment: DeepReadonly<Segment>;
  },
  "clip.segments.removed": {
    producer: Producer;
    segment: DeepReadonly<Segment>;
  },
  "clip.segments.changed": {
    producer: Producer;
    segment: DeepReadonly<Segment>;
  },
  "clip.roles.added": {
    producer: Producer;
    role: DeepReadonly<Role>;
  },
  "clip.roles.removed": {
    producer: Producer;
    role: DeepReadonly<Role>;
  },
  "clip.roles.changed": {
    producer: Producer;
    role: DeepReadonly<Role>;
  },
  "clip.segments.selected": {
    producer: Producer;
    segment: DeepReadonly<Segment>;
  },
};

/**
 * `Producer` manages clip creation process.
 */
export class Producer {
  constructor(private _eq: EventsQueue<ProducerEvent>) {
    this._clip = {
      id: crypto.randomUUID(),
      authorID: "",
      title: "",
      segments: {},
      roles: {},
      verified: false,
      dateCreated: new Date(),
    };
  }

  video: Video;
  private _clip: Clip;
  private _segment: Segment | null = null;

  get clip(): DeepReadonly<Clip> {
    return this._clip;
  }

  get activeSegment(): DeepReadonly<Segment> | null {
    return this._segment;
  }

  set title(title: string) {
    this._clip.title = title;
    this._eq.publish("clip.title.changed", { producer: this, title });
  }

  set description(description: string | undefined) {
    this._clip.description = description;
    this._eq.publish("clip.description.changed", { producer: this, description });
  }

  addSegment(segment: Partial<Omit<ProducerSegment, "id">>): DeepReadonly<Segment> {
    const addedSegment: ProducerSegment = {
      id: crypto.randomUUID(),
      begin: new Duration(0),
      end: new Duration(1000),
      line: "",
      ...segment,
    };
    this._clip.segments[addedSegment.id] = addedSegment;
    this._eventsQueue.publish("producer.segment.add", { producer: this, segment: addedSegment });
    this.selectSegment(addedSegment);
    return addedSegment;
  }

  removeSegment(segment: Pick<DeepReadonly<Segment>, "id">): DeepReadonly<ProducerSegment> {
    const removedSegment = this._clip.segments[segment.id];
    delete this._clip.segments[segment.id];
    this._eventsQueue.publish("producer.segment.remove", { producer: this, segment: removedSegment });
    return removedSegment;
  }

  changeSegment(segment: Partial<Omit<ProducerSegment, "id">> & Pick<ProducerSegment, "id">): DeepReadonly<ProducerSegment> {
    const oldSegment = this._clip.segments[segment.id];
    const newSegment = { ...oldSegment, ...segment };
    this._clip.segments[segment.id] = newSegment;
    this._eventsQueue.publish("producer.segment.change", { producer: this, segment: newSegment });
    return newSegment;
  }

  addRole(role: Omit<DeepReadonly<Partial<Role>>, "id">): DeepReadonly<Role> {
    const addedRole: Role = {
      id: crypto.randomUUID(),
      name: "",
      ...role,
    };
    this._roles[addedRole.id] = addedRole;
    this._eventsQueue.publish("producer.role.add", { producer: this, role: addedRole })
    return addedRole;
  }

  removeRole(role: Pick<DeepReadonly<Role>, "id">): DeepReadonly<Role> {
    const removedRole = this._roles[role.id];
    delete this._roles[role.id];
    this._eventsQueue.publish("producer.role.remove", { producer: this, role: removedRole });
    return removedRole;
  }

  changeRole(role: Keep<DeepReadonly<Role>, "id">): DeepReadonly<Role> {
    const oldRole = this._roles[role.id];
    const newRole = { ...oldRole, ...role };
    this._roles[role.id] = newRole;
    this._eventsQueue.publish("producer.role.change", { producer: this, role: newRole });
    return newRole;
  }

  selectSegment(segmentID: Segment["id"]): void {
    const segment = this._clip.segments[segmentID];
    if (!segment) {
      throw `select segment: segment ${segmentID} does not exist`
    }
    this._segment = segment;
    this._eq.publish("clip.segments.selected", { producer: this, segment });
  }
};

export interface Video {
  get duration(): Duration;
  get offset(): Duration;
  play(options?: { from?: Duration, to?: Duration }): Promise<void>;
  pause(): Promise<void>;
  continue(): Promise<void>;
  stop(): Promise<void>;
  seek(at: Duration): Promise<void>;
};
