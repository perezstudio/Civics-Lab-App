// app/utils/hooks.ts

import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * Custom hook for handling component mount state
 * to prevent memory leaks and updates on unmounted components
 */
export function useIsMounted() {
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return useCallback(() => isMountedRef.current, []);
}

/**
 * Custom hook to debounce a function
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
  
  // Clear the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedFn;
}

/**
 * Custom hook to throttle a function
 * @param callback The function to throttle
 * @param limit The limit in milliseconds
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef(0);
  const throttledFn = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRunRef.current >= limit) {
      callback(...args);
      lastRunRef.current = now;
    }
  }, [callback, limit]);
  
  return throttledFn;
}

/**
 * Custom hook for safe state updates
 * that prevents updates after component unmount
 */
export function useSafeState<T>(initialState: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialState);
  const isMounted = useIsMounted();
  
  const setSafeState = useCallback((value: T | ((prev: T) => T)) => {
    if (isMounted()) {
      setState(value);
    }
  }, [isMounted]);
  
  return [state, setSafeState];
}

/**
 * Custom hook to track a previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/**
 * Custom hook to handle asynchronous operations safely
 * with loading and error state management
 */
export function useAsyncOperation<T, A extends any[]>(
  asyncFn: (...args: A) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    immediate?: boolean;
    immediateArgs?: A;
  } = {}
) {
  const [isLoading, setIsLoading] = useSafeState(false);
  const [error, setError] = useSafeState<any>(null);
  const [data, setData] = useSafeState<T | null>(null);
  const isMounted = useIsMounted();
  
  const execute = useCallback(async (...args: A) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn(...args);
      if (isMounted()) {
        setData(result);
        options.onSuccess?.(result);
      }
      return result;
    } catch (err) {
      if (isMounted()) {
        setError(err);
        options.onError?.(err);
      }
      return null;
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, [asyncFn, isMounted, options.onSuccess, options.onError]);
  
  useEffect(() => {
    if (options.immediate) {
      execute(...(options.immediateArgs || [] as unknown as A));
    }
  }, []);
  
  return { execute, isLoading, error, data };
}