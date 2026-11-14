import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  onClose: () => void;
  children: ReactNode;
};

const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])';

// 疊加框的共用外殼:遮罩 + 框。Esc 與點框外會關閉;開啟時焦點移進框內(優先給 data-autofocus 的元件)、
// Tab 只在框內循環、背景不捲動;關閉後焦點回到開啟它的那個鍵。
export default function Modal({ label, onClose, children }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const el = box.current!;
    const back = document.activeElement as HTMLElement | null; // 焦點還沒移進框內:這時的焦點 = 開啟它的鍵
    (el.querySelector<HTMLElement>('[data-autofocus]') ?? el).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close.current();
      if (e.key !== 'Tab') return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return e.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      const cur = document.activeElement;
      const inside = el.contains(cur) && cur !== el;
      if (e.shiftKey && (cur === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (cur === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      back?.focus();
    };
  }, []);

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className="dialog" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
