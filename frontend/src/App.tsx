import { useCallback, useEffect, useMemo, useState } from 'react';
import { fmt, productById } from './data';
import Menu from './Menu';
import { BrandPage, Home, NotFound, ProductPage } from './pages';
import { quote } from './pricing';
import Products from './Products';
import { categoryPath, parseRoute } from './routes';
import { Link, RouterContext, clientReady, markClientReady } from './router';
import { applyMeta, pageMeta } from './seo';
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

const EMPTY: { cart: Cart; coupon: string } = { cart: {}, coupon: '' };

// initialPath:伺服器端產生 HTML 時是要產生的網址;瀏覽器端是目前的網址
export default function App({ initialPath }: { initialPath: string }) {
  const [path, setPath] = useState(initialPath);
  const route = useMemo(() => parseRoute(path), [path]);

  // 估價單存在瀏覽器裡,伺服器輸出的畫面是空的估價單。接手伺服器輸出的那一次 render 要和它一致,
  // 所以接手完成後才讀取;讀完之前(loaded = false)不寫回網址與儲存空間,免得把存著的估價單蓋掉。
  const [initial] = useState(() => (clientReady() ? loadState() : EMPTY));
  const [loaded, setLoaded] = useState(clientReady);
  const [cart, setCart] = useState<Cart>(initial.cart);
  const [coupon, setCoupon] = useState(initial.coupon);
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

  useEffect(() => {
    markClientReady(); // 接手完成:之後掛載的元件可以直接讀瀏覽器裡的狀態
    if (loaded) return;
    const saved = loadState();
    setCart(saved.cart);
    setCoupon(saved.coupon);
    setLoaded(true);
  }, [loaded]);

  // 上一頁 / 下一頁
  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // 換頁後更新標題、描述、正式網址與結構化資料
  useEffect(() => applyMeta(pageMeta(route)), [route]);

  // 站內換頁:不重新載入。估價單寫在 # 後面,換頁時帶著走
  const navigate = useCallback((to: string) => {
    if (to !== location.pathname) history.pushState(null, '', to + location.hash);
    setPath(to);
    setSheetOpen(false);
  }, []);
  const router = useMemo(() => ({ path, navigate }), [path, navigate]);

  const q = useMemo(() => quote(cart, coupon), [cart, coupon]);

  useEffect(() => {
    if (!loaded) return;
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
  }, [cart, coupon, loaded, path]); // path:上一頁回到的網址可能帶著舊的估價單,換頁後一律改寫成目前的

  const setQty = (id: string, qty: number) => {
    setCleared(null); // 開始排新的估價單後,就不再提供復原
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(qty, 99);
      return next;
    });
  };

  // 估價單裡標示的「目前分類」:分類頁是該分類,商品頁是商品所屬的分類
  const active = route.kind === 'category' ? route.category.id : route.kind === 'product' ? route.product.cat : '';

  return (
    <RouterContext.Provider value={router}>
    <div className="app">
      <nav className="topbar" aria-label="網站">
        <Link className="brand" to="/">
          DIY 估價
        </Link>
      </nav>
      <div className="shell">
      <Menu
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        q={q}
        active={active}
        onSelect={(id) => navigate(categoryPath({ id }))}
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
      {/* 以網址當 key:換頁時重新掛載,捲動位置、篩選、數量都從頭開始 */}
      {route.kind === 'home' && <Home />}
      {route.kind === 'category' && <Products key={path} active={route.category.id} cart={cart} setQty={setQty} />}
      {route.kind === 'product' && <ProductPage key={path} product={route.product} cart={cart} setQty={setQty} />}
      {route.kind === 'brand' && <BrandPage key={path} brand={route.brand} />}
      {route.kind === 'notfound' && <NotFound />}
      </div>
      <button className="mobilebar" onClick={() => setSheetOpen(true)}>
        <span>估價單 · {q.count} 件</span>
        <strong>{fmt(q.total)}</strong>
      </button>
    </div>
    </RouterContext.Provider>
  );
}
