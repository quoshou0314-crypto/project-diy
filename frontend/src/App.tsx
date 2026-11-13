import { useEffect, useMemo, useState } from 'react';
import { categories, fmt, productById } from './data';
import Menu from './Menu';
import { quote } from './pricing';
import Products from './Products';
import type { Cart } from './types';

const STORAGE_KEY = 'diy-menu';

// 估價單可由網址分享:#m=c3.1-m2.1&c=DIY500
function loadState(): { cart: Cart; coupon: string } {
  try {
    const hash = new URLSearchParams(location.hash.slice(1));
    const m = hash.get('m');
    if (m) {
      const cart: Cart = {};
      for (const part of m.split('-')) {
        const [id, qty] = part.split('.');
        const n = Number(qty);
        if (productById.has(id) && n > 0) cart[id] = Math.min(n, 99);
      }
      return { cart, coupon: hash.get('c') ?? '' };
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* 資料損毀就當作空估價單 */
  }
  return { cart: {}, coupon: '' };
}

export default function App() {
  const [initial] = useState(loadState);
  const [cart, setCart] = useState<Cart>(initial.cart);
  const [coupon, setCoupon] = useState(initial.coupon);
  const [active, setActive] = useState(categories[0].id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cleared, setCleared] = useState<{ cart: Cart; coupon: string } | null>(null); // 剛清空的估價單,留著給「復原」

  // 手機的估價單是全螢幕面板:開著時背景不捲動,Esc 可以關閉
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [sheetOpen]);

  const q = useMemo(() => quote(cart, coupon), [cart, coupon]);

  useEffect(() => {
    const m = Object.entries(cart)
      .map(([id, n]) => `${id}.${n}`)
      .join('-');
    const hash = m ? `#m=${m}${coupon ? `&c=${encodeURIComponent(coupon)}` : ''}` : '';
    history.replaceState(null, '', location.pathname + hash);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart, coupon }));
    } catch {
      /* 無法寫入時不影響操作 */
    }
  }, [cart, coupon]);

  const setQty = (id: string, qty: number) => {
    setCleared(null); // 開始排新的估價單後,就不再提供復原
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(qty, 99);
      return next;
    });
  };

  return (
    <div className="app">
      <nav className="topbar">
        <span className="brand">DIY 估價</span>
      </nav>
      <div className="shell">
      <Menu
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        q={q}
        active={active}
        onSelect={(id) => {
          setActive(id);
          setSheetOpen(false);
        }}
        setQty={setQty}
        coupon={coupon}
        setCoupon={setCoupon}
        onClear={() => {
          setCleared({ cart, coupon });
          setCart({});
          setCoupon('');
        }}
        onUndo={
          cleared
            ? () => {
                setCart(cleared.cart);
                setCoupon(cleared.coupon);
                setCleared(null);
              }
            : undefined
        }
      />
      <Products key={active} active={active} onSelect={setActive} cart={cart} setQty={setQty} />
      </div>
      <button className="mobilebar" onClick={() => setSheetOpen(true)}>
        <span>估價單 · {q.count} 件</span>
        <strong>{fmt(q.total)}</strong>
      </button>
    </div>
  );
}
