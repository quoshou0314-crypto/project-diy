import { useState } from 'react';
import { categories, fmt } from './data';
import Modal from './Modal';
import { salePrice } from './pricing';
import { Gallery, SpecTable } from './ProductDetail';
import type { Product } from './types';

type Props = {
  product: Product;
  onClose: () => void;
  onAdd: (qty: number) => void; // 把這個數量加進估價單
};

// 商品詳情的疊加框:大圖 + 縮圖列 | 商品描述 | 商品規格;底部是價格、數量與加入估價單。× 、Esc、點框外都能關閉。
// 同樣的內容在商品頁(ProductPage)有完整的版本,那是給從搜尋結果進來的人看的。
export default function ProductDialog({ product, onClose, onAdd }: Props) {
  const [qty, setQty] = useState(1); // 這次要加入的數量
  const price = salePrice(product);
  const category = categories.find((c) => c.id === product.cat)!;

  return (
    <Modal label={`${product.brand} ${product.name}`} onClose={onClose}>
      <header className="dialog-head">
        <h2>
          {product.brand} {product.name}
        </h2>
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
      </div>

      <footer className="dialog-foot">
        <div className="dialog-price">
          {price < product.price && <s>{fmt(product.price)}</s>}
          <strong>{fmt(price)}</strong>
        </div>
        <span className="qty">
          <button aria-label="減少" disabled={qty <= 1} onClick={() => setQty(qty - 1)}>
            −
          </button>
          {qty}
          <button aria-label="增加" disabled={qty >= 99} onClick={() => setQty(qty + 1)}>
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
