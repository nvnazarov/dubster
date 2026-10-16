import Video from "@/lib/services/video";
import { Duration } from "@/lib/time";

export default class HTMLVideo implements Video {
  constructor(private _html: HTMLVideoElement) { }

  get duration(): Duration {
    return new Duration(this._html.duration * 1000);
  }

  get offset(): Duration {
    return new Duration(this._html.currentTime * 1000);
  }
}