import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

export type TableActionMenuPos = {
  top?: number;
  bottom?: number;
  right: number;
};

/**
 * Fixed-position row action menu that does not block page scroll
 * (no full-screen overlay; closes on outside click / Escape / scroll).
 */
export function useTableActionMenu<T extends string | number>() {
  const [openId, setOpenId] = useState<T | null>(null);
  const [pos, setPos] = useState<TableActionMenuPos | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setOpenId(null);
    setPos(null);
  }, []);

  const toggle = useCallback(
    (id: T, event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (openId === id) {
        close();
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const menuHeight = 180;
      const openUp = rect.bottom + menuHeight > window.innerHeight - 12;
      setPos(
        openUp
          ? {
              bottom: window.innerHeight - rect.top + 4,
              right: window.innerWidth - rect.right,
            }
          : {
              top: rect.bottom + 4,
              right: window.innerWidth - rect.right,
            },
      );
      setOpenId(id);
    },
    [openId, close],
  );

  useEffect(() => {
    if (openId == null) return;

    const onPointerDown = (event: globalThis.MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    // Close on any scroll so the menu never traps wheel/trackpad on the admin shell.
    const onScroll = () => close();

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [openId, close]);

  return { openId, pos, menuRef, toggle, close };
}

export function TableActionMenu({
  open,
  pos,
  menuRef,
  children,
}: {
  open: boolean;
  pos: TableActionMenuPos | null;
  menuRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  if (!open || !pos || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[60] w-44 bg-background-50 border border-background-200/70 rounded-xl shadow-lg overflow-hidden"
      style={{
        top: pos.top,
        bottom: pos.bottom,
        right: pos.right,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
