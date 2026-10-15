import { Role, Segment } from "@/lib/models/clip";
import Video from "@/lib/services/video";
import { Duration } from "@/lib/util/time";
import { DeepReadonly } from "@/lib/util/type";

export default interface Event {
  "video.stopped": {
    at: Duration;
  },
  "video.played": {
    from: Duration;
    to: Duration;
  },
  "video.opened": {
    video: Video;
  },
  "segment.selected": {
    segment: DeepReadonly<Segment>;
  },
  "segment.added": {
    segment: DeepReadonly<Segment>;
  },
  "segment.deleted": {
    segment: DeepReadonly<Segment>;
  },
  "segment.changed": {
    segment: DeepReadonly<Segment>;
  },
  "role.added": {
    role: DeepReadonly<Role>;
  },
  "role.changed": {
    role: DeepReadonly<Role>;
  },
  "role.deleted": {
    role: DeepReadonly<Role>;
  },
};
