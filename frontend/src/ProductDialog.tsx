import { useState } from 'react';
import { categories, fmt } from './data';
import Modal from './Modal';
import { salePrice } from './pricing';
import type { Product } from './types';

type Props = {
  product: Product;
  onClose: () => void;
  onAdd: (qty: number) => void; // 把這個數量加進估價單
};

const PLACEHOLDERS = 4; // 沒有商品圖時先放幾格佔位圖

// 商品詳情的疊加框:大圖 + 縮圖列 | 商品描述 | 商品規格;底部是價格、數量與加入估價單。× 、Esc、點框外都能關閉。
export default function ProductDialog({ product, onClose, onAdd }: Props) {
  const [index, setIndex] = useState(0);
  const [qty, setQty] = useState(1); // 這次要加入的數量
  const price = salePrice(product);
  const category = categories.find((c) => c.id === product.cat)!;
  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const count = images.length || PLACEHOLDERS;
  const abbr = product.brand.slice(0, 2).toUpperCase();

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
        <div className="gallery-main">
          {images.length > 0 ? (
            <img src={images[index]} alt={`${product.name} 圖片 ${index + 1}`} />
          ) : (
            <div className="gallery-placeholder">
              {abbr}
              <span>圖片 {index + 1}</span>
            </div>
          )}
        </div>
        <div className="gallery-thumbs">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              className={i === index ? 'gallery-thumb on' : 'gallery-thumb'}
              aria-label={`圖片 ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            >
              {images.length > 0 ? <img src={images[i]} alt="" /> : i + 1}
            </button>
          ))}
        </div>

        <hr />

        <h3>商品描述</h3>
        <p className="dialog-desc">{product.description ?? '尚無商品描述。'}</p>

        <h3>商品規格</h3>
        <table className="dialog-specs">
          <tbody>
            <tr>
              <th>品牌</th>
              <td>{product.brand}</td>
            </tr>
            {category.specs.map((def) => (
              <tr key={def.key}>
                <th>{def.label}</th>
                <td>{product.specs[def.key] === undefined ? '-' : `${product.specs[def.key]}${def.unit ?? ''}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
