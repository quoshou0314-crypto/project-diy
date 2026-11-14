import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

// 下拉選單的共用行為。key 是目前開著的選單(null = 沒開)。
// - 點選單外、捲動頁面、改變視窗大小會關閉(點開啟它的鍵由那顆鍵自己切換,所以用 triggerSelector 排除)
// - 開啟時焦點移到第一項;↑ ↓ 在項目間移動;Esc 或 Tab 關閉並把焦點還給開啟它的鍵
export function usePopup(key: string | null, close: () => void, menuRef: RefObject<HTMLElement | null>, triggerSelector: string) {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (key === null) return;
    const trigger = document.activeElement as HTMLElement | null;
    const items = () => [...(menuRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, a[href]') ?? [])];
    items()[0]?.focus();

    const outside = (e: Event) => {
      const t = e.target as Element | null;
      if (menuRef.current?.contains(t) || t?.closest?.(triggerSelector)) return;
      closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Tab') {
        trigger?.focus();
        closeRef.current();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const list = items();
        if (list.length === 0) return;
        e.preventDefault(); // 不讓頁面跟著捲(捲動會關掉選單)
        const i = list.indexOf(document.activeElement as HTMLElement);
        const step = e.key === 'ArrowDown' ? 1 : -1;
        list[i < 0 ? 0 : (i + step + list.length) % list.length].focus();
      }
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', outside, true);
    window.addEventListener('resize', outside);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', outside, true);
      window.removeEventListener('resize', outside);
      // 選了一項後選單消失,焦點會掉到 body:還給開啟它的鍵
      if (document.activeElement === document.body) trigger?.focus();
    };
  }, [key, menuRef, triggerSelector]);
}
