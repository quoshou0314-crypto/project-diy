import { useState } from 'react';
import { categories, fmt, products } from './data';
import Modal from './Modal';
import { compatibleWith, salePrice } from './pricing';
import { ProductCard } from './ProductCard';
import { Gallery, SpecTable } from './ProductDetail';
import type { Cart, Product } from './types';

type Props = {
  product: Product;
  cart: Cart;
  setQty: (id: string, qty: number) => void;
  onOpen: (p: Product) => void; // 從框底的商品卡換到另一個商品
  onClose: () => void;
  onAdd: (qty: number) => void; // 把這個數量加進估價單
};

const MORE = 6; // 「其他同類商品」最多列幾張

// 商品詳情的疊加框:大圖 + 縮圖列 | 商品描述 | 商品規格 | 搭配零件與同類商品的商品卡;底部是價格、數量與加入估價單。× 、Esc、點框外都能關閉。
// 疊加框開著時網址是這個商品的網址(/p/…),所以框的標題就是這一頁的主標題。
export default function ProductDialog({ product, cart, setQty, onOpen, onClose, onAdd }: Props) {
  const [qty, setCount] = useState(1); // 這次要加入的數量
  const price = salePrice(product);
  const category = categories.find((c) => c.id === product.cat)!;
  // 框底的商品卡:先列搭配得起來的零件(可以直接加入估價單),再列同類的其他商品
  const related = [
    ...compatibleWith(product),
    { label: `其他${category.name}`, items: products.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, MORE) },
  ].filter((g) => g.items.length > 0);

  return (
    <Modal label={`${product.brand} ${product.name}`} onClose={onClose}>
      <header className="dialog-head">
        <h1>{`${product.brand} ${product.name}`}</h1>
        <button className="dialog-close" aria-label="關閉" onClick={onClose} data-autofocus>
          ×
        </button>
      </header>

      <div className="dialog-body">
        <Gallery product={product} />

        <hr />

        <h3>商品描述</h3>
        <p className="dialog-desc">{product.description ?? '尚無商品描述。'}</p>

        <h3>商品規格</h3>
        <SpecTable product={product} category={category} />

        {related.map((g) => (
          <section key={g.label}>
            <h3>{g.label}</h3>
            <ul className="grid">
              {g.items.map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  specs={categories.find((c) => c.id === p.cat)!.specs}
                  qty={cart[p.id] ?? 0}
                  setQty={setQty}
                  onOpen={onOpen}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="dialog-foot">
        <div className="dialog-price">
          {price < product.price && <s>{fmt(product.price)}</s>}
          <strong>{fmt(price)}</strong>
        </div>
        <span className="qty">
          <button aria-label="減少" disabled={qty <= 1} onClick={() => setCount(qty - 1)}>
            −
          </button>
          {qty}
          <button aria-label="增加" disabled={qty >= 99} onClick={() => setCount(qty + 1)}>
            +
          </button>
        </span>
        <button
          className="primary"
          onClick={() => {
            onAdd(qty);
            onClose();
          }}
        >
          加入估價單
        </button>
      </footer>
    </Modal>
  );
}
