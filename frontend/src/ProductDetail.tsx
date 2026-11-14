import { useState } from 'react';
import type { Category, Product } from './types';

const PLACEHOLDERS = 4; // 沒有商品圖時先放幾格佔位圖

// 商品圖:大圖 + 縮圖列
export function Gallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const count = images.length || PLACEHOLDERS;
  const name = `${product.brand} ${product.name}`;

  return (
    <>
      <div className="gallery-main">
        {images.length > 0 ? (
          <img src={images[index]} alt={index === 0 ? name : `${name} 圖片 ${index + 1}`} />
        ) : (
          <div className="gallery-placeholder">
            {product.brand.slice(0, 2).toUpperCase()}
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
    </>
  );
}

export function SpecTable({ product, category }: { product: Product; category: Category }) {
  return (
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
  );
}
