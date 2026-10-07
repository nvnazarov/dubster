import { describe, expectTypeOf, it } from "vitest";
import { deepIgnorer, DeepIgnorer, DeepPartial, DeepReadonly } from "@/lib/util/type";

describe("DeepPartial", () => {
  it("preserves basic types", () => {
    expectTypeOf(1 as DeepPartial<number>).toEqualTypeOf<number>();
    expectTypeOf(true as DeepPartial<boolean>).toEqualTypeOf<boolean>();
    expectTypeOf("" as DeepPartial<string>).toEqualTypeOf<string>();
    expectTypeOf((() => { }) as DeepPartial<() => void>).toEqualTypeOf<() => void>();
  });
  it("makes object's fields partial", () => {
    const a = {
      number: 0,
      boolean: true,
      string: "",
      fn: () => { },
      array: [""],
      object: {
        number: 0,
      },
    };
    const p: DeepPartial<typeof a> = a;
    expectTypeOf(p).toEqualTypeOf<{
      number?: number,
      boolean?: boolean,
      string?: string,
      fn?: () => void,
      array?: string[],
      object?: {
        number?: number,
      },
    }>();
  });
  it("makes array's elements partial", () => {
    expectTypeOf([] as DeepPartial<string[]>).toEqualTypeOf<string[]>();
    expectTypeOf([] as DeepPartial<{ number: number }[]>)
      .toEqualTypeOf<{ number?: number }[]>();
  });
  it("preserves objects that implement DeepIgnorer", () => {
    class Ignorer implements DeepIgnorer {
      readonly [deepIgnorer] = true;
      number: number = 0;
      boolean: boolean = true;
      string: string = "";
      fn: () => void = () => { };
      array: string[] = [];
      object: { number: number } = { number: 0 };
      method(): void { };
    };
    expectTypeOf(new Ignorer() as DeepPartial<Ignorer>).toEqualTypeOf<Ignorer>();
  });
});

describe("DeepReadonly", () => {
  it("preserves basic types", () => {
    expectTypeOf(1 as DeepReadonly<number>).toEqualTypeOf<number>();
    expectTypeOf(true as DeepReadonly<boolean>).toEqualTypeOf<boolean>();
    expectTypeOf("" as DeepReadonly<string>).toEqualTypeOf<string>();
    expectTypeOf((() => { }) as DeepReadonly<() => void>).toEqualTypeOf<() => void>();
  });
  it("makes object's fields readonly", () => {
    const a = {
      number: 0,
      boolean: true,
      string: "",
      fn: () => { },
      array: [""],
      object: {
        number: 0,
      },
    };
    const p: DeepReadonly<typeof a> = a;
    expectTypeOf(p).toEqualTypeOf<{
      readonly number: number,
      readonly boolean: boolean,
      readonly string: string,
      readonly fn: () => void,
      readonly array: ReadonlyArray<string>,
      readonly object: {
        readonly number: number,
      },
    }>();
  });
  it("makes array's elements readonly", () => {
    expectTypeOf([] as DeepReadonly<string[]>).toEqualTypeOf<ReadonlyArray<string>>();
    expectTypeOf([] as DeepReadonly<{ number: number }[]>)
      .toEqualTypeOf<ReadonlyArray<{ readonly number: number }>>();
  });
  it("preserves objects that implement DeepIgnorer", () => {
    class Ignorer implements DeepIgnorer {
      readonly [deepIgnorer] = true;
      number: number = 0;
      boolean: boolean = true;
      string: string = "";
      fn: () => void = () => { };
      array: string[] = [];
      object: { number: number } = { number: 0 };
      method(): void { };
    };
    expectTypeOf(new Ignorer() as DeepReadonly<Ignorer>).toEqualTypeOf<Ignorer>();
  });
});
