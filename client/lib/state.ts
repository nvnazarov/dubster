import { useEffect, useState } from "react";

type Callback = (value: any) => void;

const subscribers = new Map<string, Set<Callback>>();

const markState: unique symbol = Symbol();

export function isState(value: unknown): boolean {
  if (typeof value === "object") {
    if (value === null || value === undefined) {
      return false;
    }
    return Object.hasOwn(value as object, markState);
  }
  return false;
}

function subscribe(key: string, callback: Callback): Subscription {
  const subs = subscribers.get(key);
  if (!subs) {
    subscribers.set(key, new Set([callback]));
  } else {
    subs.add(callback);
  }
  return new subscription(key, callback);
}

function unsubscribe(key: string, callback: Callback): void {
  const subs = subscribers.get(key);
  if (subs) {
    subs.delete(callback);
  }
}

function notifySubscribers<T>(key: string, value: T): void {
  for (const callback of subscribers.get(key) || []) {
    callback(value);
  }
}

class subscription {
  constructor(private key: string, private callback: Callback) { }

  cancel(): void {
    unsubscribe(this.key, this.callback);
  }
};

export interface Subscription {
  cancel(): void;
};

export class Subscriptions {
  private subs: Subscription[] = [];

  add(sub: Subscription): void {
    this.subs.push(sub);
  };

  cancel(): void {
    for (const sub of this.subs) {
      sub.cancel();
    }
  };
};

function notifySubscribersComputed(key: string, computeValue: () => any) {
  const callbacks = subscribers.get(key);
  if (!callbacks || callbacks.size === 0) {
    return;
  }
  const value = computeValue();
  for (const callback of callbacks) {
    callback(value);
  }
}

export function unsubscribeAll(): void {
  subscribers.clear();
}

type Snapshot<T> = T extends State<infer S> ? S : T;

export interface State<T> {
  [markState]: true;
  subscribe(callback: (value: T) => void): Subscription;
  snapshot(): T;
}

type NonStateObjectProperties<T> = {
  [F in keyof T as T[F] extends State<any> ? never : F]: T[F];
};

export interface ObjectPropertySubscriber<T extends object> {
  subscribe<F extends keyof NonStateObjectProperties<T>>(field: F, callback: (value: Snapshot<T[F]>) => void): Subscription;
}

type ObjectSnapshot<T extends object> = { [F in keyof T]: Snapshot<T[F]> };

export type StateObject<T extends object> = T & ObjectPropertySubscriber<T> & State<ObjectSnapshot<T>>;

export function makeState<T extends object>(object: T): StateObject<T> {
  const stateKey = crypto.randomUUID();
  const state = new Proxy({
    ...object,
    [markState]: true,
    subscribe<F extends keyof NonStateObjectProperties<T>>(...args: [F, (value: T[F]) => void] | [(value: T) => void]) {
      if (args.length === 2) {
        const fieldKey = `${stateKey}:${args[0].toString()}`;
        return subscribe(fieldKey, args[1]);
      }
      return subscribe(stateKey, args[0]);
    },
    snapshot(): ObjectSnapshot<T> {
      const result: any = {}
      for (const [property, value] of Object.entries(this)) {
        if (property === "subscribe" || property === "snapshot") continue;
        if (isState(value)) {
          result[property] = (value as State<typeof value>).snapshot();
        } else {
          result[property] = value;
        }
      }
      return result;
    }
  }, {
    set(target: any, field: any, value: any): boolean {
      if (field === "subscribe" || field === "snapshot" || field === markState) {
        return false;
      }
      if (isState(target[field])) {
        return false;
      }
      if (Object.is(target[field], value)) {
        return true;
      }
      target[field] = value;
      const fieldKey = `${stateKey}:${field.toString()}`;
      notifySubscribers(fieldKey, value);
      notifySubscribers(stateKey, target.snapshot());
      return true;
    }
  });
  for (const [_, value] of Object.entries(object)) {
    if (isState(value)) {
      const _ = (value as State<any>).subscribe((_) => {
        notifySubscribers(stateKey, state.snapshot());
      });
    }
  }
  return state as StateObject<T>;
}

export class Entities<T> implements State<ReadonlyArray<Snapshot<T>>> {
  readonly [markState] = true;
  private key = crypto.randomUUID();
  private _entities: Record<string, T> = {};
  private _subs: Record<string, Subscription> = {};

  constructor(private id: (entity: T) => string) { }

  get size(): number {
    return Object.keys(this._entities).length;
  }

  add(entity: T): void {
    const id = this.id(entity);
    const entityInside = this._entities[id];
    if (entityInside) {
      throw `entity ${id} already exists`;
    }
    this._entities[id] = entity;
    if (isState(entity)) {
      this._subs[id] = (entity as State<any>).subscribe((_) => notifySubscribers(this.key, this.snapshot()));
    }
    notifySubscribers(this.key, this.snapshot());
  };

  delete(id: string): void {
    const entity = this.get(id);
    if (!entity) {
      throw `entity ${id} not found`;
    }
    delete this._entities[id];
    this._subs[id]?.cancel();
    delete this._subs[id];
    notifySubscribers(this.key, this.snapshot());
  };

  get(id: string): T {
    const entity = this._entities[id];
    if (!entity) {
      throw `entity ${id} not found`;
    }
    return entity;
  }

  snapshot(): ReadonlyArray<Snapshot<T>> {
    return Object.values(this._entities).map((entity) => snapshot(entity));
  }

  subscribe(callback: (value: ReadonlyArray<Snapshot<T>>) => void): Subscription {
    return subscribe(this.key, callback);
  }

  *[Symbol.iterator](): Generator<T> {
    for (const entity of Object.values(this._entities)) {
      yield entity;
    }
  }
}

function snapshot<T>(v: T): Snapshot<T> {
  if (isState(v)) {
    return (v as State<Snapshot<T>>).snapshot();
  }
  return v as any;
}

export function useObjectProperty<T extends object, F extends keyof NonStateObjectProperties<T>>
  (object: StateObject<T>, property: F): Snapshot<T[F]> {
  const [value, setValue] = useState<Snapshot<T[F]>>(snapshot(object[property]));
  useEffect(() => {
    setValue(snapshot(object[property]));
    const sub = object.subscribe(property, setValue);
    return () => {
      sub.cancel();
    };
  }, [object]);
  return value;
}

export function useSnapshot<T>(state: State<T>): T {
  const [value, setValue] = useState(state.snapshot());
  useEffect(() => {
    setValue(state.snapshot());
    const sub = state.subscribe(setValue);
    return () => {
      sub.cancel();
    };
  }, [state]);
  return value;
}
