import { Duration } from "@/lib/util/time";

export default interface Video {
  get duration(): Duration;
  get offset(): Duration;
};
