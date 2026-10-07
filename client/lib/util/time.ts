import { deepIgnorer, DeepIgnorer } from "@/lib/util/type";

/**
 * `Duration` is an immutable type that represents the duration of a process.
 */
export class Duration implements DeepIgnorer {
  readonly [deepIgnorer] = true;

  constructor(readonly milliseconds: number = 0) { }

  get seconds(): number {
    return this.milliseconds / 1000;
  }

  human(): string {
    if (this.milliseconds < 1000) {
      return "<1s";
    }
    if (this.milliseconds < 60000) {
      return Math.round(this.milliseconds / 1000) + "s";
    }
    const minutes = Math.floor(this.milliseconds / 60000);
    const seconds = Math.round((this.milliseconds - minutes * 60000) / 1000);
    return minutes + "m" + seconds + "s";
  }
};

/**
 * `sleep` sleeps for the given time period.
 * @param duration The duration of the sleep.
 * @returns A `Promise` that resolves after the sleep ends.
 */
export function sleep(duration: Duration) {
  return new Promise<void>(resolve => setTimeout(resolve, duration.milliseconds));
};
