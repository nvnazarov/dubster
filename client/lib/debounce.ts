import { Duration } from "@/lib/time";

export function debounce<T extends (...args: any) => void>(f: T, options: {
  delay: Duration;
  skipFirst?: boolean;
}): T {
  let called: boolean = false;
  let timeout: NodeJS.Timeout | null = null;
  const debounced = (...args: any): void => {
    if (options.skipFirst && !called) {
      f(args);
      called = true;
      return;
    }
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => f(...args), options.delay.milliseconds);
  };
  return debounced as T;
}
