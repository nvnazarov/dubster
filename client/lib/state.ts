import { useEffect, useState } from "react";

import { DeepReadonly } from "@/lib/type";

type Callback = (value: any) => void;

const subscribers = new Map<string, Set<Callback>>();

const markState: unique symbol = Symbol();

function copy<T>(object: T): T {
  // TODO: implement shallow copying.
  return object;
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

function unsubscribe<T>(key: string, callback: (value: T) => void): void {
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

function notifySubscribersComputed<T>(key: string, computeValue: () => T) {
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

type NonStateFields<T> = {
  [F in keyof T as T[F] extends State<infer _R> ? never : F]: T[F];
};

/**
 * State is an object which fields notify subscribers
 * when they change. When multiple fields in a state
 * are changing simultaneously, a React component can
 * react to all of them at once by delaying the
 * processing until the next render (changes to the
 * component's state are queued).
 */
export type State<T extends object> = T & {
  [markState]: true;
  subscribe<F extends keyof NonStateFields<T>>(field: F, callback: (value: T[F]) => void): Subscription;
  subscribe(callback: (value: T) => void): Subscription;
};

export function state<T extends object>(value: T): State<T> {
  const stateKey = crypto.randomUUID();
  const state = new Proxy({
    ...value,
    [markState]: true,
    subscribe<F extends keyof NonStateFields<T>>(...args: [F, (value: T[F]) => void] | [(value: T) => void]) {
      if (args.length === 2) {
        const fieldKey = `${stateKey}:${args[0].toString()}`;
        return subscribe(fieldKey, args[1]);
      }
      return subscribe(stateKey, args[0]);
    }
  }, {
    set(target: any, field: any, value: any): boolean {
      if (field === "subscribe" || field === markState) {
        return false;
      }
      if (Object.is(target[field], value)) {
        return true;
      }
      target[field] = value;
      const fieldKey = `${stateKey}:${field.toString()}`;
      notifySubscribers(fieldKey, value);
      notifySubscribers(stateKey, copy(target));
      return true;
    }
  });
  return state as State<T>;
}

export class Entities<T> {
  readonly [markState] = true;
  private key = crypto.randomUUID();
  private _entities: Record<string, T> = {};

  constructor(private id: (entity: T) => string) { }

  get entities(): DeepReadonly<Record<string, T>> {
    return this._entities as any;
  }

  add(entity: T): void {
    const id = this.id(entity);
    const entityInside = this._entities[id];
    if (entityInside) {
      throw `entity ${id} already exists`;
    }
    this._entities[id] = entity;
    notifySubscribersComputed<T[]>(this.key, () => Object.values(this._entities) as T[]);
  };

  delete(id: string): void {
    const entity = this.get(id);
    if (!entity) {
      throw `entity ${id} not found`;
    }
    delete this._entities[id];
    notifySubscribersComputed(this.key, () => Object.values(this._entities) as T[]);
  };

  get(id: string): T {
    const entity = this._entities[id];
    if (!entity) {
      throw `entity ${id} not found`;
    }
    return entity;
  }

  subscribe(callback: (value: DeepReadonly<T[]>) => void): Subscription {
    return subscribe(this.key, callback);
  }
}

export function useField<T extends object, F extends keyof NonStateFields<T>>(state: State<T>, field: F): T[F] {
  const [value, setValue] = useState<T[F]>(state[field]);
  useEffect(() => {
    const sub = state.subscribe(field, setValue);
    return () => {
      sub.cancel();
    };
  }, [state]);
  return value;
}

export function use<T extends object>(state: State<T>): T {
  const [value, setValue] = useState<T>(state);
  useEffect(() => {
    const sub = state.subscribe(setValue);
    return () => {
      sub.cancel();
    };
  }, [state]);
  return value;
}
