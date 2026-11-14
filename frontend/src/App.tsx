import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { categories, fmt, productById } from './data';
import Menu from './Menu';
import { NotFound } from './pages';
import { quote } from './pricing';
import Products from './Products';
import { categoryPath, parseRoute, productPath } from './routes';
import { Link, RouterContext, clientReady, markClientReady } from './router';
import { applyMeta, pageMeta } from './seo';
import type { Cart, Product } from './types';

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

  // 直接由商品網址進來時(搜尋結果、分享連結),這一頁的內容只有那個商品:背後的分類清單不畫。
  // 這樣每個商品網址的內容各自獨立,不會夾帶同分類的整份清單。
  // 關閉詳情框(×、Esc、點框外、加入估價單)或換頁之後才畫清單;站內點開的詳情框不受影響,清單本來就在。
  const [listDeferred, setListDeferred] = useState(() => parseRoute(initialPath).kind === 'product');

  // 上一頁 / 下一頁
  useEffect(() => {
    const onPop = () => {
      setListDeferred(false);
      setPath(location.pathname);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // 換頁後更新標題、描述、正式網址與結構化資料
  useEffect(() => applyMeta(pageMeta(route)), [route]);

  // 站內換頁:不重新載入。估價單寫在 # 後面,換頁時帶著走
  const navigate = useCallback((to: string, replace = false) => {
    if (to !== location.pathname) history[replace ? 'replaceState' : 'pushState'](null, '', to + location.hash);
    setPath(to);
    setListDeferred(false);
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

  // 商品的網址(/p/…)打開的是它所屬分類的清單,上面疊著這個商品的詳情
  const detail = route.kind === 'product' ? route.product : null;
  const category = route.kind === 'category' ? route.category : detail ? categories.find((c) => c.id === detail.cat)! : null;
  const active = category?.id ?? '';

  // 從清單點開的詳情:關閉 = 回上一頁(回到原本的清單與捲動位置)。
  // 直接由網址進來的(搜尋結果、分享連結)沒有上一頁:關閉後換成該分類的清單
  const openedHere = useRef(false);
  const openDetail = (p: Product) => {
    openedHere.current = true;
    navigate(productPath(p));
  };
  const closeDetail = () => {
    if (openedHere.current) {
      openedHere.current = false;
      history.back();
    } else if (category) navigate(categoryPath(category), true);
  };

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
      {/* 以分類當 key:切換分類時重新掛載(篩選歸零);開關商品詳情不重新掛載,清單的篩選與捲動位置留著 */}
      {category ? (
        <Products key={category.id} active={category.id} detail={detail} deferList={listDeferred} onOpen={openDetail} onClose={closeDetail} cart={cart} setQty={setQty} />
      ) : (
        <NotFound />
      )}
      </div>
      <button className="mobilebar" onClick={() => setSheetOpen(true)}>
        <span>估價單 · {q.count} 件</span>
        <strong>{fmt(q.total)}</strong>
      </button>
    </div>
    </RouterContext.Provider>
  );
}
