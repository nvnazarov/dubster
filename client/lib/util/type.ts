export const deepIgnorer = Symbol();

/**
 * Implement `DeepIgnorer` to preserve object's type when using
 * either `DeepPartial` or `DeepReadonly`. The object will be
 * treated as indivisible; its fields and methods will not receive
 * `readonly` or `Partial` modifiers.
 */
export interface DeepIgnorer {
  readonly [deepIgnorer]: true;
};

export type DeepPartial<T> =
  T extends DeepIgnorer ? T :
  T extends Function ? T :
  T extends (infer R)[] ? DeepPartial<R>[] :
  T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

export type DeepReadonly<T> =
  T extends DeepIgnorer ? T :
  T extends Function ? T :
  T extends (infer R)[] ? ReadonlyArray<DeepReadonly<R>> :
  T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

export type Keep<T, K extends keyof T> = Pick<T, K> & DeepPartial<T>;
