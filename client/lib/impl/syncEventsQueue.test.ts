import { describe, expect, test } from "vitest";
import SyncEventsQueue from "./syncEventsQueue";

describe("SyncEventsQueue", () => {
  test("publishes events for subscribers", () => {
    interface Event {
      "a": number,
    };
    const eq = new SyncEventsQueue<Event>();
    let calls1 = 0;
    let calls2 = 0;
    eq.subscribe("a", () => { calls1++; });
    eq.subscribe("a", () => { calls2++; });

    eq.publish("a", 1);

    expect(calls1).toBe(1);
    expect(calls2).toBe(1);
  });
  test("unsubscribes", () => {
    interface Event {
      "a": number,
    };
    const eq = new SyncEventsQueue<Event>();
    let calls = 0;
    const fn = () => {
      calls++;
    };

    eq.subscribe("a", fn);
    eq.unsubscribe("a", fn);
    eq.publish("a", 1);

    expect(calls).toBe(0);
  });
});
