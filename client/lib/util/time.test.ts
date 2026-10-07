import { describe, expect, it } from "vitest";
import { Duration } from "@/lib/util/time";

describe("Duration", () => {
  it("initializes to zero", () => {
    const d = new Duration();
    expect(d.milliseconds).toBe(0);
  });
  it("returns milliseconds", () => {
    const d = new Duration(1234);
    expect(d.milliseconds).toBe(1234);
  });
  it("returns seconds", () => {
    const d = new Duration(1234);
    expect(d.seconds).toBeCloseTo(1.234, 3);
  });
});
