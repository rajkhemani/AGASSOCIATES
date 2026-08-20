'use client';

import { useEffect, useCallback } from 'react';

export function useKeyboard(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean } = {}
) {
  const { ctrl = false, shift = false, alt = false, meta = false } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrl &&
        event.shiftKey === shift &&
        event.altKey === alt &&
        event.metaKey === meta
      ) {
        handler(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, handler, ctrl, shift, alt, meta]);
}

export function useEscape(handler: () => void) {
  useKeyboard('Escape', useCallback(() => handler(), [handler]));
}

export function useEnter(handler: () => void) {
  useKeyboard('Enter', useCallback(() => handler(), [handler]));
}

export function useTab(handler: (event: KeyboardEvent) => void) {
  useKeyboard('Tab', useCallback((e) => handler(e), [handler]));
}

export function useArrowKeys(
  handlers: {
    up?: () => void;
    down?: () => void;
    left?: () => void;
    right?: () => void;
  }
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          handlers.up?.();
          break;
        case 'ArrowDown':
          handlers.down?.();
          break;
        case 'ArrowLeft':
          handlers.left?.();
          break;
        case 'ArrowRight':
          handlers.right?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}