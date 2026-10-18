/**
 * useContainerSize — measure an element with a ResizeObserver and report its box as plain numbers.
 *
 * react-force-graph (2D + 3D) does NOT observe its container: `width` / `height` must be passed as numeric
 * props, and `zoomToFit()` silently does nothing on a zero-size canvas. This hook is the single source of
 * truth for those numbers: it measures `getBoundingClientRect()` (floored, NO minimum clamp — a collapsed
 * panel really reports 0 so the caller can decide not to render / not to fit), re-measures on every
 * ResizeObserver callback and on `window` resize, and exposes `remeasure()` for the events a ResizeObserver
 * cannot see reliably (fullscreenchange, panel drag end, route change, inspector toggle, 2D/3D toggle).
 * Works without ResizeObserver (jsdom / very old browsers) by falling back to window resize only.
 */
import { useCallback, useEffect, useRef, useState, type RefCallback } from 'react';

interface ContainerSize {
  width: number;
  height: number;
}

interface UseContainerSizeResult<T extends HTMLElement> {
  /** Attach to the element to measure (callback ref — stable identity). */
  ref: RefCallback<T>;
  width: number;
  height: number;
  /** Force a synchronous re-measure (state only changes when the floored box actually changed). */
  remeasure: () => void;
  /** The element currently attached (null before mount). */
  element: T | null;
}

export function measureElement(el: Element): ContainerSize {
  const r = el.getBoundingClientRect();
  return { width: Math.max(0, Math.floor(r.width)), height: Math.max(0, Math.floor(r.height)) };
}

export function useContainerSize<T extends HTMLElement>(): UseContainerSizeResult<T> {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 });
  const elementRef = useRef<T | null>(null);

  const ref = useCallback<RefCallback<T>>((node) => {
    elementRef.current = node;
    setElement(node);
  }, []);

  const remeasure = useCallback((): void => {
    const el = elementRef.current;
    if (!el) return;
    const next = measureElement(el);
    setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next));
  }, []);

  useEffect(() => {
    if (!element) return undefined;
    remeasure(); // initial measurement on mount
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => remeasure());
      ro.observe(element);
    }
    window.addEventListener('resize', remeasure);
    return () => {
      if (ro) {
        ro.unobserve(element);
        ro.disconnect();
      }
      window.removeEventListener('resize', remeasure);
    };
  }, [element, remeasure]);

  return { ref, width: size.width, height: size.height, remeasure, element };
}
