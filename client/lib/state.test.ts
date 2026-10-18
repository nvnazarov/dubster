import { describe, expect, it } from "vitest";
import { Entities, isState, makeState } from "@/lib/state";

describe("ObjectState", () => {
  it("subscribes to fields", () => {
    const state = makeState({
      x: 1,
    });
    let x: number | null = null;
    let calls = 0;
    const sub = state.subscribe("x", (v) => { x = v; calls += 1 });
    expect(calls).toBe(0);
    state.x = 2;
    expect(x).toBe(2);
    expect(calls).toBe(1);
    sub.cancel();
    state.x = 3;
    expect(x).toBe(2);
    expect(calls).toBe(1);
  });
  it("subscribes to object", () => {
    const state = makeState({
      x: 1,
    });
    let obj: { x: number } | null = null;
    let calls = 0;
    const sub = state.subscribe((v) => { obj = v; calls += 1 });
    expect(calls).toBe(0);
    state.x = 2;
    expect(obj).toMatchObject({ x: 2 });
    expect(calls).toBe(1);
    sub.cancel();
    state.x = 3;
    expect(obj).toMatchObject({ x: 2 });
    expect(calls).toBe(1);
  });
  it("propagates nested changes", () => {
    const state = makeState({
      inner: makeState({
        x: 1,
      }),
    });
    let obj: { inner: { x: number } } | null = null;
    let calls = 0;
    const sub = state.subscribe((v) => { obj = v; calls += 1 });
    expect(calls).toBe(0);
    state.inner.x = 2;
    expect(obj).toMatchObject({ inner: { x: 2 } });
    expect(calls).toBe(1);
    sub.cancel();
    state.inner.x = 3;
    expect(obj).toMatchObject({ inner: { x: 2 } });
    expect(calls).toBe(1);
  });
});

describe("Entities", () => {
  it("propagates array", () => {
    const state = makeState({
      entities: new Entities<{ id: string }>((v) => v.id),
    });
    let obj: any = null;
    let calls = 0;
    const sub = state.subscribe((v) => { obj = v; calls += 1 });
    expect(calls).toBe(0);
    state.entities.add({ id: "1" });
    expect(calls).toBe(1);
    expect(obj).toMatchObject({ entities: [{ id: "1" }] });
    state.entities.delete("1");
    expect(calls).toBe(2);
    expect(obj).toMatchObject({ entities: [] });
    sub.cancel();
    state.entities.add({ id: "2" });
    expect(calls).toBe(2);
    expect(obj).toMatchObject({ entities: [] });
  });
});

describe("isState", () => {
  it("returns true for state", () => {
    const state = makeState({});
    expect(isState(state)).toBe(true);
  })
  it("returns false for ordinary objects", () => {
    const objects: any[] = [1, "", true, () => { }, { x: 1 }];
    for (const object of objects) {
      expect(isState(object)).toBe(false);
    }
  });
});
