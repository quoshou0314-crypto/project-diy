import { useEffect, useRef } from 'react';
import { fmt } from './data';
import { itemPromo, salePrice } from './pricing';
import { productPath } from './routes';
import { isPlainClick } from './router';
import type { Product, SpecDef } from './types';

// 加入估價單的控制項,清單與格狀共用。
// 原價(有促銷時,刪除線) 售價 [購物車鍵];加入後購物車鍵換成數量步進器(− 數量 +),減到 0 就是移除。
export function AddControl({ p, qty, setQty }: { p: Product; qty: number; setQty: (id: string, qty: number) => void }) {
  const box = useRef<HTMLSpanElement>(null);
  const refocus = useRef(false);
  const promo = itemPromo(p.id);
  const name = `${p.brand} ${p.name}`;
  const added = qty > 0;

  // 購物車鍵與步進器互換時,原本有焦點的鍵會消失:把焦點接到換上來的鍵
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    box.current?.querySelector<HTMLElement>(added ? '[data-step="up"]' : '.cart-btn')?.focus();
  }, [added]);

  const change = (n: number) => {
    refocus.current = n > 0 !== added;
    setQty(p.id, n);
  };

  return (
    <span className="add" ref={box}>
      <span className="add-price">
        {promo && <s>{fmt(p.price)}</s>}
        <strong>{fmt(salePrice(p))}</strong>
      </span>
      {added ? (
        <span className="stepper" role="group" aria-label={`${name} 的數量`}>
          <button aria-label={qty === 1 ? `移除 ${name}` : `減少 ${name}`} onClick={() => change(qty - 1)}>
            −
          </button>
          <span aria-live="polite">{qty}</span>
          <button data-step="up" aria-label={`增加 ${name}`} disabled={qty >= 99} onClick={() => change(qty + 1)}>
            +
          </button>
        </span>
      ) : (
        <button className="cart-btn" title="加入估價單" aria-label={`加入 ${name}`} onClick={() => change(1)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h9.3a1 1 0 0 0 1-.8L20.5 7H6" />
            <circle cx="9.5" cy="20" r="1.4" />
            <circle cx="17.5" cy="20" r="1.4" />
          </svg>
        </button>
      )}
    </span>
  );
}

type CardProps = {
  p: Product;
  specs: SpecDef[]; // 卡片上要列的規格
  qty: number; // 估價單裡的數量
  setQty: (id: string, qty: number) => void;
  onOpen: (p: Product) => void; // 開啟這個商品的詳情
};

// 商品卡:圖、品名、規格、價格與加入估價單。格狀的商品清單與商品詳情底部的「搭配零件」共用。
export function ProductCard({ p, specs, qty, setQty, onOpen }: CardProps) {
  const promo = itemPromo(p.id);
  return (
    <li className={qty > 0 ? 'card picked' : 'card'}>
      <button className="card-img" aria-label={`查看 ${p.brand} ${p.name} 的圖片與說明`} onClick={() => onOpen(p)}>
        {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span aria-hidden="true">{p.brand.slice(0, 2).toUpperCase()}</span>}
      </button>
      <div className="card-name" title={p.name} onClick={() => onOpen(p)}>
        <span className="model-brand">{p.brand}</span>
        {/* 品名是連到商品網址的連結(搜尋引擎、另開分頁用);一般點擊不重新載入,直接開詳情 */}
        <a
          className="model-name"
          href={productPath(p)}
          onClick={(e) => {
            if (!isPlainClick(e)) return;
            e.preventDefault();
            e.stopPropagation(); // 外層的品名區塊也會開詳情,不重複觸發
            onOpen(p);
          }}
        >
          {p.name}
        </a>
        {promo && <span className="tag">{promo.label}</span>}
      </div>
      {/* 沒有規格要顯示時也留著這一段:每張卡固定四段,同一排才對得齊 */}
      <dl className="card-specs">
        {specs.map((def) => {
          const value = p.specs[def.key] === undefined ? '-' : `${p.specs[def.key]}${def.unit ?? ''}`;
          return (
            <div key={def.key}>
              <dt>{def.label}</dt>
              <dd title={value}>{value}</dd>
            </div>
          );
        })}
      </dl>
      <div className="card-price">
        <AddControl p={p} qty={qty} setQty={setQty} />
      </div>
    </li>
  );
}
