import { describe, expect, test } from "vitest";
import CyclicalColorProvider from "./cyclicalColorProvider";

describe("CyclicalColorProvider", () => {
  test("throws when no colors are provided", () => {
    expect(() => {
      const _ = new CyclicalColorProvider([]);
    }).toThrow();
  });
  test("cycles through the colors", () => {
    const p = new CyclicalColorProvider(["red", "blue", "green"]);

    expect(p.color("1")).toBe("red");
    expect(p.color("2")).toBe("blue");
    expect(p.color("3")).toBe("green");
    expect(p.color("4")).toBe("red");
    expect(p.color("5")).toBe("blue");
    expect(p.color("6")).toBe("green");
  });
  test("remembers generated colors", () => {
    const p = new CyclicalColorProvider(["red", "blue", "green"]);

    const color1 = p.color("1");
    const color2 = p.color("2");
    expect(p.color("1")).toBe(color1);
    expect(p.color("2")).toBe(color2);
  });
});
