import * as React from 'react';
import type { Observable } from 'obsrvbl';

/**
 * @internal
 */
export function useObservableState<T>(observable: Observable<T> | undefined, startWith: T) {
  const [state, setState] = React.useState<T>(startWith);
  React.useEffect(() => {
    // observable state doesn't run in SSR
    if (typeof window === 'undefined' || !observable) return;
    const subscription = observable.subscribe(setState);
    return () => subscription.unsubscribe();
  }, [observable]);
  return state;
}

/**
 * @internal
 */
export function useObservableStateAsync<T>(
  observable: Observable<Promise<T>> | undefined,
  startWith: T,
) {
  const [state, setState] = React.useState<T>(startWith);
  React.useEffect(() => {
    // observable state doesn't run in SSR
    if (typeof window === 'undefined' || !observable) return;
    const subscription = observable.subscribe(async (val) => setState(await val));
    return () => subscription.unsubscribe();
  }, [observable]);
  return state;
}
