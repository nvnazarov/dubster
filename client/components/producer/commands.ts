import { Role, Segment } from "@/lib/models/clip";
import { Duration } from "@/lib/util/time";
import { DeepReadonly } from "@/lib/util/type";

export default interface Command {
  "video.open": {
    file: Blob;
  },
  "video.play": {
    from?: Duration;
    to?: Duration;
  };
  "video.stop": void;
  "video.seek": {
    at: Duration;
  },
  "role.add": {
    role: DeepReadonly<Role>;
  },
  "role.change": {
    role: DeepReadonly<Role>;
  };
  "role.delete": {
    roleID: Role["id"];
  },
  "segment.select": {
    segmentID: Segment["id"];
  },
  "segment.add": {
    segment: DeepReadonly<Segment>;
  },
  "segment.delete": {
    segmentID: Segment["id"];
  },
  "segment.change": {
    segment: DeepReadonly<Segment>;
  },
};
