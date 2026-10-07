import { EventsQueue } from "@/lib/services/eventsQueue";
import { Video } from "@/lib/services/producer";
import { Duration } from "@/lib/util/time";

export default class HTMLVideo implements Video {
  constructor(private _html: HTMLVideoElement, private _eq: EventsQueue) {
    this._html.addEventListener("ended", () => {
      this.stop();
    });
  }

  get duration(): Duration {
    return new Duration(this._html.duration * 1000);
  }

  get offset(): Duration {
    return new Duration(this._html.currentTime * 1000);
  }

  async play(options?: { from: Duration, to: Duration }): Promise<void> {
    await this._html.play();
    this._eq.publish("producer.video.play", { video: this, ...options });
  }

  async pause(): Promise<void> {
    this._html.pause();
    this._eq.publish("producer.video.stop", { video: this, at: this.offset });
  }

  async continue(): Promise<void> {
    await this._html.play();
    this._eq.publish("producer.video.play", { video: this })
  }

  async stop(): Promise<void> {
    this._html.pause();
    this._eq.publish("producer.video.stop", { video: this, at: this.offset })
  }

  async seek(at: Duration): Promise<void> {
    this._html.pause();
    this._html.currentTime = at.seconds();
    this._eq.publish("producer.video.seek", { video: this, at });
  }
}
