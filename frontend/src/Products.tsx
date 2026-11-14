import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import CategoryTabs from './CategoryTabs';
import { categories, fmt, products } from './data';
import Modal from './Modal';
import { itemPromo, salePrice } from './pricing';
import { AddControl, ProductCard } from './ProductCard';
import ProductDialog from './ProductDialog';
import { productPath } from './routes';
import { clientReady, isPlainClick } from './router';
import type { Cart, Product, SpecDef, SpecValue } from './types';
import { usePopup } from './usePopup';

type Props = {
  active: string;
  detail: Product | null; // 疊加框正在看的商品(由網址決定:/p/… 就是開著那個商品)
  deferList: boolean; // 直接由商品網址進來、詳情框還沒關:清單先不畫(見 App)
  onOpen: (p: Product) => void;
  onClose: () => void;
  cart: Cart;
  setQty: (id: string, qty: number) => void;
};

type Sort = { key: string; dir: 1 | -1 } | null; // 依哪一欄排序;1 遞增、-1 遞減
const BRAND: SpecDef = { key: '_brand', label: '品牌' };
const PRICE: SpecDef = { key: '_price', label: '價格' };
const MENU_WIDTH = 200;

const valueOf = (p: Product, key: string): SpecValue | undefined =>
  key === BRAND.key ? p.brand : key === PRICE.key ? salePrice(p) : p.specs[key];
const show = (v: SpecValue | undefined, def: SpecDef) => (v === undefined ? '-' : `${v}${def.unit ?? ''}`);

// 欄寬(px):圖片、型號、價格是固定欄,品牌與規格欄每欄至少 COL_MIN。
// 表格放得下幾欄就顯示幾欄,放不下的規格自動收起來 —— 所以表格永遠不需要左右捲。
const COL_THUMB = 56;
const COL_MODEL = 170;
const COL_PRICE = 244; // 原價欄 50 + 間距 12 + 售價欄 68 + 間距 16 + 按鍵(觸控時 80)+ 儲存格內距,排成一行所需的寬度(對應 styles.css 的 .add)
const COL_PRICE_NARROW = 176; // 售價 + 間距 12 + 按鍵 80 + 儲存格內距 // 手機放不下一行:價格在上、購物車鍵或步進器在下
const COL_MIN = 96;
// 伺服器端量不到寬度:先當成桌機寬度輸出,HTML 裡才有品牌與規格欄。瀏覽器接手後、畫面更新前會換成實際寬度。
const SSR_WIDTH = 1100;

type View = 'list' | 'grid';
const VIEW_KEY = 'diy-view';

// 顯示方式記在瀏覽器裡:切換類別(這個元件會重新掛載)或重新整理後都保持同一種
function loadView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list';
  } catch {
    return 'list';
  }
}

// 沒有商品圖時的佔位圖:品牌縮寫(中性灰,不拿顏色做分類)
function Thumb({ p }: { p: Product }) {
  if (p.image) return <img className="thumb" src={p.image} alt="" loading="lazy" />;
  return (
    <div className="thumb placeholder" aria-hidden="true">
      {p.brand.slice(0, 2).toUpperCase()}
    </div>
  );
}

// 切換分類時由父層以 key 重新掛載,篩選與欄位開關自動歸零。
export default function Products({ active, detail, deferList, onOpen, onClose, cart, setQty }: Props) {
  const [filters, setFilters] = useState<Record<string, SpecValue[]>>({});
  const [off, setOff] = useState<string[]>([]); // 使用者關掉的規格欄
  const [pinned, setPinned] = useState<string[]>([]); // 使用者點開的規格欄(最近點的在前),寬度不夠時優先保留
  const [width, setWidth] = useState(SSR_WIDTH); // 表格可用的寬度
  const tableRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{
    key: string;
    x: number;
    y: number;
  } | null>(null);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<Sort>(null);
  const [sheet, setSheet] = useState(false); // 篩選面板
  // 清單(表格)或格狀(商品卡)。伺服器輸出的一律是清單;接手伺服器輸出時先照它 render,隨後換成使用者上次選的
  const [view, setViewState] = useState<View>(() => (clientReady() ? loadView() : 'list'));
  useLayoutEffect(() => setViewState(loadView()), []);
  const menuRef = useRef<HTMLDivElement>(null);

  const category = categories.find((c) => c.id === active)!;
  const inCategory = useMemo(() => products.filter((p) => p.cat === active), [active]);

  // 量表格可用的寬度;視窗或版面一變就重算
  useLayoutEffect(() => {
    const el = tableRef.current!;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 放得下幾個「品牌 / 規格」欄。品牌排第一;一欄都放不下時(手機),品牌併進品名
  const capacity = Math.max(0, Math.floor((width - COL_THUMB - COL_MODEL - COL_PRICE) / COL_MIN));
  const stacked = capacity === 0;

  // 顯示哪些規格欄:沒被關掉的規格裡,先留使用者點開的(最近點的優先),其餘照規格順序,取到放滿為止
  const columns = useMemo(() => {
    if (stacked) return [];
    const rank = (d: SpecDef) => (pinned.includes(d.key) ? pinned.indexOf(d.key) - pinned.length : category.specs.indexOf(d));
    const chosen = category.specs
      .filter((d) => !off.includes(d.key))
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, capacity - 1);
    return [BRAND, ...category.specs.filter((d) => chosen.includes(d))];
  }, [category, off, pinned, capacity, stacked]);

  // 每個欄位可篩選的值,由商品資料自動產生
  const options = useMemo(() => {
    const out: Record<string, SpecValue[]> = {};
    for (const def of [BRAND, ...category.specs]) {
      const all = inCategory.map((p) => valueOf(p, def.key)).filter((v): v is SpecValue => v !== undefined);
      out[def.key] = [...new Set(all)].sort((a, b) =>
        typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'zh-Hant'),
      );
    }
    return out;
  }, [category, inCategory]);

  const list = useMemo(() => {
    if (deferList) return [];
    const kw = keyword.trim().toLowerCase();
    const out = inCategory.filter(
      (p) =>
        (!kw || `${p.brand} ${p.name}`.toLowerCase().includes(kw)) &&
        Object.entries(filters).every(([key, picked]) => {
          const v = valueOf(p, key);
          return picked.length === 0 || (v !== undefined && picked.includes(v));
        }),
    );
    if (sort)
      out.sort((a, b) => {
        const x = valueOf(a, sort.key);
        const y = valueOf(b, sort.key);
        if (x === undefined || y === undefined) return x === y ? 0 : x === undefined ? 1 : -1; // 沒有值的排最後
        return sort.dir * (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'zh-Hant'));
      });
    return out;
  }, [inCategory, filters, keyword, sort, deferList]);

  // 選單開啟時:點選單外、按 Esc、捲動頁面都會關閉;↑ ↓ 在項目間移動
  usePopup(menu?.key ?? null, () => setMenu(null), menuRef, '.th-btn');

  // 排序的說法跟著資料走:價格說高低、數字說大小、文字才說遞增遞減
  const sortWords = (def: SpecDef): [string, string] => {
    if (def === PRICE) return ['價格低到高', '價格高到低'];
    return options[def.key]?.every((v) => typeof v === 'number') ? ['小到大', '大到小'] : ['遞增', '遞減'];
  };

  const openMenu = (key: string, e: ReactMouseEvent<HTMLButtonElement>) => {
    if (menu?.key === key) return setMenu(null);
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({
      key,
      x: Math.max(8, Math.min(r.left, window.innerWidth - MENU_WIDTH - 8)),
      y: r.bottom + 4,
    });
  };

  const togglePick = (key: string, v: SpecValue) =>
    setFilters((prev) => {
      const cur = prev[key] ?? [];
      return {
        ...prev,
        [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
      };
    });

  // 規格開關:顯示中的點了就關掉;沒顯示的(被關掉或放不下而收起)點了就排到最優先,放滿時會擠掉順位最後的那一欄。
  // 收起來的規格仍然可以在篩選面板裡篩選,所以這裡不動篩選條件
  const toggleColumn = (key: string) => {
    setMenu(null);
    if (columns.some((d) => d.key === key)) {
      setOff([...off, key]);
      setPinned(pinned.filter((k) => k !== key));
    } else {
      setOff(off.filter((k) => k !== key));
      setPinned([key, ...pinned.filter((k) => k !== key)]);
    }
  };

  const setView = (v: View) => {
    setViewState(v);
    setMenu(null);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* 無法寫入時只是下次回到清單 */
    }
  };

  // 格狀沒有寬度限制:沒被關掉的規格全部列在商品卡上;開關只是開或關
  const grid = view === 'grid';
  const cardSpecs = category.specs.filter((d) => !off.includes(d.key));
  const toggleCardSpec = (key: string) => setOff(off.includes(key) ? off.filter((k) => k !== key) : [...off, key]);

  // 品名是連到商品網址的連結(搜尋引擎、另開分頁用);一般點擊不重新載入,直接開疊加框,網址跟著換成該商品的
  const quickView = (e: ReactMouseEvent, p: Product) => {
    if (!isPlainClick(e)) return;
    e.preventDefault();
    e.stopPropagation(); // 外層(手機的品名格、商品卡)也會開疊加框,不重複觸發
    onOpen(p);
  };

  // 再點一次同一個方向就取消排序
  const toggleSort = (key: string, dir: 1 | -1) => setSort(sort?.key === key && sort.dir === dir ? null : { key, dir });

  const picks = Object.values(filters).reduce((n, v) => n + v.length, 0); // 已勾選的篩選值總數
  const filtering = keyword !== '' || Object.values(filters).some((v) => v.length > 0);
  const menuDef = menu && [...columns, PRICE].find((d) => d.key === menu.key);

  // 表頭鍵:點開是這一欄的選單(排序、篩選)
  const headButton = (def: SpecDef) => {
    const picked = filters[def.key]?.length ?? 0;
    const sorted = sort?.key === def.key ? sort.dir : 0;
    return (
      <button
        className={picked > 0 || sorted !== 0 ? 'th-btn on' : 'th-btn'}
        aria-haspopup="true"
        aria-expanded={menu?.key === def.key}
        onClick={(e) => openMenu(def.key, e)}
      >
        {def.label}
        {picked > 0 && <span className="badge">{picked}</span>}
        <span className="caret">{sorted === 1 ? '▲' : sorted === -1 ? '▼' : '▾'}</span>
      </button>
    );
  };

  // 篩選鍵:點開是品牌與所有規格的篩選(包含沒顯示出來的規格);面板裡不放排序
  // 手機(stacked)沒有規格欄可開關,規格開關列改放這顆鍵,樣式是一般的框線鍵;其餘地方是表頭那種文字鍵
  const filterOn = picks > 0; // 篩選面板只管篩選;排序在各欄表頭的選單裡
  const filterButton = stacked ? (
    <button className={filterOn ? 'filter-btn on' : 'filter-btn'} aria-haspopup="dialog" onClick={() => setSheet(true)}>
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <path d="M2 4h12M4.5 8h7M7 12h2" />
      </svg>
      篩選
      {picks > 0 && <span className="badge">{picks}</span>}
    </button>
  ) : (
    <button className={filterOn ? 'th-btn on' : 'th-btn'} aria-haspopup="dialog" onClick={() => setSheet(true)}>
      篩選
      {picks > 0 && <span className="badge">{picks}</span>}
      <span className="caret">▾</span>
    </button>
  );

  return (
    <main className="products">
      <CategoryTabs active={active} />

      {/* 頁面標題給搜尋引擎與螢幕閱讀器;畫面上頁籤已經標出目前分類,不重複顯示。開著商品詳情時,主標題是商品名稱 */}
      {!detail && <h1 className="sr-only">{category.name}</h1>}

      <div className="toolbar">
        <input type="search" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={`搜尋${category.name}`} />
      </div>

      {/* 規格列:左邊是規格開關,右邊是顯示方式(清單 / 格狀)。格狀沒有表頭,所以篩選與價格排序放在這一列。
          手機(stacked)沒有規格開關,左邊換成篩選鍵 */}
      <div className="filter">
        <div className="chips" role="group" aria-label={stacked ? undefined : '顯示規格'}>
          {stacked && filterButton}
          {!stacked &&
            category.specs.map((def) => {
              const on = grid ? !off.includes(def.key) : columns.includes(def);
              // 清單放滿時,再開一欄會把順位最後的那一欄收起來:先講清楚
              const full = !grid && !on && columns.length >= capacity;
              return (
                <button
                  key={def.key}
                  className={on ? 'chip on' : 'chip'}
                  aria-pressed={on}
                  title={on ? `隱藏「${def.label}」` : full ? `顯示「${def.label}」(畫面放不下,會收起另一欄)` : `顯示「${def.label}」`}
                  onClick={() => (grid ? toggleCardSpec(def.key) : toggleColumn(def.key))}
                >
                  {def.label}
                </button>
              );
            })}
        </div>
        <div className="view-tools">
          {grid && !stacked && filterButton}
          {grid && headButton(PRICE)}
          <div className="seg" role="group" aria-label="顯示方式">
            <button className={grid ? '' : 'on'} aria-pressed={!grid} aria-label="清單" title="清單" onClick={() => setView('list')}>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
              </svg>
            </button>
            <button className={grid ? 'on' : ''} aria-pressed={grid} aria-label="格狀" title="格狀" onClick={() => setView('grid')}>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
                <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="0.5" />
                <rect x="9" y="2.5" width="4.5" height="4.5" rx="0.5" />
                <rect x="2.5" y="9" width="4.5" height="4.5" rx="0.5" />
                <rect x="9" y="9" width="4.5" height="4.5" rx="0.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {filtering && (
        <div className="count" role="status">
          <span>
            符合 {list.length} / {inCategory.length} 項
          </span>
          <button
            className="link"
            onClick={() => {
              setFilters({});
              setKeyword('');
            }}
          >
            清除篩選
          </button>
        </div>
      )}

      {/* 表格永遠剛好填滿這一塊的寬度(欄數依寬度決定),不會左右捲 */}
      <div className="table-fit" ref={tableRef}>
        {grid ? (
          <ul className="grid">
            {list.map((p) => (
              <ProductCard key={p.id} p={p} specs={cardSpecs} qty={cart[p.id] ?? 0} setQty={setQty} onOpen={onOpen} />
            ))}
          </ul>
        ) : (
          <div className="table-wrap">
            {/* 固定欄寬:篩選或排序後欄位不會跟著內容跳動 */}
            <table className={stacked ? 'spec-table stacked' : 'spec-table'}>
              <colgroup>
                <col style={{ width: COL_THUMB }} />
                <col style={stacked ? undefined : { width: COL_MODEL }} />
                {columns.map((def) => (
                  <col key={def.key} />
                ))}
                <col style={{ width: stacked ? COL_PRICE_NARROW : COL_PRICE }} />
              </colgroup>
              <thead>
                <tr>
                  <th aria-label="圖片" />
                  <th>
                    <div className="th-row">
                      型號
                      {!stacked && filterButton}
                    </div>
                  </th>
                  {columns.map((def) => (
                    <th key={def.key}>{options[def.key].length < 2 ? def.label : headButton(def)}</th>
                  ))}
                  <th>{headButton(PRICE)}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const promo = itemPromo(p.id);
                  const qty = cart[p.id] ?? 0;
                  return (
                    <tr key={p.id} className={qty > 0 ? 'picked' : ''}>
                      <td className="cell-thumb">
                        <button className="thumb-btn" aria-label={`查看 ${p.brand} ${p.name} 的圖片與說明`} onClick={() => onOpen(p)}>
                          <Thumb p={p} />
                        </button>
                      </td>
                      {/* 一欄規格都放不下時(手機):品牌併進品名,點品名開啟詳情看規格 */}
                      <td
                        className={stacked ? 'cell-model tappable' : 'cell-model'}
                        title={p.name}
                        onClick={stacked ? () => onOpen(p) : undefined}
                      >
                        {stacked && <span className="model-brand">{p.brand}</span>}
                        <a className="model-name" href={productPath(p)} onClick={(e) => quickView(e, p)}>
                          {p.name}
                        </a>
                        {promo && <span className="tag">{promo.label}</span>}
                      </td>
                      {columns.map((def) => (
                        <td key={def.key}>{show(valueOf(p, def.key), def)}</td>
                      ))}
                      <td className="cell-price">
                        <AddControl p={p} qty={qty} setQty={setQty} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {list.length === 0 && !deferList && <p className="empty">沒有符合條件的商品</p>}

      {menu && menuDef && (
        <div ref={menuRef} className="th-menu" role="menu" style={{ left: menu.x, top: menu.y, width: MENU_WIDTH }}>
          <button
            className="item"
            role="menuitemradio"
            aria-checked={sort?.key === menuDef.key && sort.dir === 1}
            onClick={() => toggleSort(menuDef.key, 1)}
          >
            {menuDef === PRICE ? sortWords(menuDef)[0] : `${sortWords(menuDef)[0]}排序`}
          </button>
          <button
            className="item"
            role="menuitemradio"
            aria-checked={sort?.key === menuDef.key && sort.dir === -1}
            onClick={() => toggleSort(menuDef.key, -1)}
          >
            {menuDef === PRICE ? sortWords(menuDef)[1] : `${sortWords(menuDef)[1]}排序`}
          </button>
          {menuDef !== PRICE && (
            <>
              <hr />
              <div className="th-menu-list">
                {options[menuDef.key].map((v) => (
                  <label key={String(v)}>
                    <input
                      type="checkbox"
                      checked={filters[menuDef.key]?.includes(v) ?? false}
                      onChange={() => togglePick(menuDef.key, v)}
                    />
                    {show(v, menuDef)}
                  </label>
                ))}
              </div>
              <button
                className="link"
                disabled={!filters[menuDef.key]?.length}
                onClick={() => setFilters((prev) => ({ ...prev, [menuDef.key]: [] }))}
              >
                清除篩選
              </button>
            </>
          )}
        </div>
      )}
      {sheet && (
        <Modal label={`篩選${category.name}`} onClose={() => setSheet(false)}>
            <header className="dialog-head">
              <h2>篩選{category.name}</h2>
              <button className="dialog-close" aria-label="關閉" onClick={() => setSheet(false)} data-autofocus>
                ×
              </button>
            </header>
            <div className="dialog-body">
              {[BRAND, ...category.specs]
                .filter((def) => options[def.key].length > 1)
                .map((def) => (
                  <section key={def.key} className="sheet-group">
                    <div className="sheet-head">
                      <h3>{def.label}</h3>
                    </div>
                    <div className="chips">
                      {options[def.key].map((v) => {
                        const on = filters[def.key]?.includes(v) ?? false;
                        return (
                          <button
                            key={String(v)}
                            className={on ? 'pick-chip on' : 'pick-chip'}
                            aria-pressed={on}
                            onClick={() => togglePick(def.key, v)}
                          >
                            {show(v, def)}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
            </div>
            <footer className="sheet-foot">
              <button
                className="link"
                disabled={picks === 0}
                onClick={() => setFilters({})}
              >
                全部清除
              </button>
              <button className="primary" onClick={() => setSheet(false)}>
                看 {list.length} 項商品
              </button>
            </footer>
        </Modal>
      )}

      {detail && (
        // 以商品當 key:從框底的商品卡換到另一個商品時重新掛載,捲回頂端、數量歸 1
        <ProductDialog
          key={detail.id}
          product={detail}
          cart={cart}
          setQty={setQty}
          onOpen={onOpen}
          onClose={onClose}
          onAdd={(n) => setQty(detail.id, (cart[detail.id] ?? 0) + n)}
        />
      )}
    </main>
  );
}
