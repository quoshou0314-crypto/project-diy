import { useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { categories } from './data';
import type { Category } from './types';
import { usePopup } from './usePopup';

type Props = {
  active: string;
  onSelect: (cat: string) => void;
};

type Tab = { kind: 'cat'; cat: Category } | { kind: 'group'; name: string; items: Category[] };

// 頂列的類別頁籤:DIY 核心零組件(沒有 group 的類別)直接顯示成頁籤;
// 其餘類別依 group 收進下拉頁籤(例如「周邊配件 ▾」),類別變多時只是下拉變長。
const tabs: Tab[] = [];
for (const cat of categories) {
  if (!cat.group) {
    tabs.push({ kind: 'cat', cat });
    continue;
  }
  const found = tabs.find((t) => t.kind === 'group' && t.name === cat.group);
  if (found && found.kind === 'group') found.items.push(cat);
  else tabs.push({ kind: 'group', name: cat.group, items: [cat] });
}

export default function CategoryTabs({ active, onSelect }: Props) {
  const [menu, setMenu] = useState<{ group: string; x: number; y: number } | null>(null);
  const [more, setMore] = useState({ left: false, right: false }); // 左右兩邊還有沒有捲出畫面的頁籤
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = categories.find((c) => c.id === active)!;
  const openGroup = tabs.find((t) => t.kind === 'group' && t.name === menu?.group);

  usePopup(menu?.group ?? null, () => setMenu(null), menuRef, '.tab');

  // 頁籤放不下時可以左右捲:把目前的頁籤捲到中間(切換類別後這個元件會重新掛載),並在還有頁籤的那一邊顯示提示
  useLayoutEffect(() => {
    const nav = navRef.current!;
    const on = nav.querySelector<HTMLElement>('.tab.on');
    if (on) {
      const a = on.getBoundingClientRect();
      const b = nav.getBoundingClientRect();
      nav.scrollLeft += a.left - b.left - (b.width - a.width) / 2;
    }
    const measure = () => {
      const left = nav.scrollLeft > 1;
      const right = nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 1;
      setMore((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };
    measure();
    nav.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => {
      nav.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, []);

  const toggleMenu = (group: string, e: ReactMouseEvent<HTMLButtonElement>) => {
    if (menu?.group === group) return setMenu(null);
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({ group, x: Math.max(8, Math.min(r.left, window.innerWidth - 180)), y: r.bottom + 2 }); // 不超出畫面右緣
  };

  return (
    <div className={`tabs-wrap${more.left ? ' more-left' : ''}${more.right ? ' more-right' : ''}`}>
      <nav className="tabs" ref={navRef} aria-label="商品類別">
        {tabs.map((t) => {
          if (t.kind === 'cat')
            return (
              <button
                key={t.cat.id}
                className={t.cat.id === active ? 'tab on' : 'tab'}
                aria-current={t.cat.id === active ? 'page' : undefined}
                onClick={() => {
                  setMenu(null);
                  onSelect(t.cat.id);
                }}
              >
                {t.cat.name}
              </button>
            );
          const on = current.group === t.name;
          return (
            <button
              key={t.name}
              className={on ? 'tab on' : 'tab'}
              aria-haspopup="true"
              aria-expanded={menu?.group === t.name}
              onClick={(e) => toggleMenu(t.name, e)}
            >
              {t.name}
              {on && <span className="tab-current">{current.name}</span>}
              <span className="caret">▾</span>
            </button>
          );
        })}
      </nav>

      {menu && openGroup?.kind === 'group' && (
        <div ref={menuRef} className="tab-menu" role="menu" style={{ left: menu.x, top: menu.y }}>
          {openGroup.items.map((c) => (
            <button
              key={c.id}
              role="menuitemradio"
              aria-checked={c.id === active}
              className="item"
              onClick={() => {
                setMenu(null);
                onSelect(c.id);
              }}
            >
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
