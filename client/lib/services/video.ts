import { Duration } from "@/lib/time";

export default interface Video {
  get duration(): Duration;
  get offset(): Duration;
};
