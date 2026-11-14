// 商品頁、品牌頁、找不到頁面:給從搜尋結果進來的人看的頁面。首頁與分類頁是 Products(估價用的商品清單)。
import { useState } from 'react';
import type { ReactNode } from 'react';
import { categories, fmt, products } from './data';
import { compatibleWith, itemPromo, salePrice } from './pricing';
import { Gallery, ProductLinks, SpecTable } from './ProductDetail';
import { HOME_CATEGORY, brandPath, categoryPath } from './routes';
import { Link } from './router';
import type { Cart, Category, Product } from './types';

type Crumb = { name: string; to?: string };

// 麵包屑:最後一項是目前頁面,不是連結
function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="目前位置">
      <ol>
        {items.map((c) => (
          <li key={c.name}>{c.to ? <Link to={c.to}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

const HOME: Crumb = { name: '首頁', to: '/' };
// 首頁本身就是第一個分類:它的商品不必列兩層
const trail = (category: Category): Crumb[] => (category === HOME_CATEGORY ? [HOME] : [HOME, { name: category.name, to: categoryPath(category) }]);

function Page({ children }: { children: ReactNode }) {
  return <main className="products page">{children}</main>;
}

type ProductPageProps = { product: Product; cart: Cart; setQty: (id: string, qty: number) => void };

export function ProductPage({ product, cart, setQty }: ProductPageProps) {
  const [qty, setCount] = useState(1); // 這次要加入的數量
  const category = categories.find((c) => c.id === product.cat)!;
  const promo = itemPromo(product.id);
  const price = salePrice(product);
  const name = `${product.brand} ${product.name}`;
  const inCart = cart[product.id] ?? 0;
  const others = products.filter((p) => p.cat === product.cat && p.id !== product.id);

  return (
    <Page>
      <Crumbs items={[...trail(category), { name }]} />

      <article className="product">
        <div className="product-top">
          <div className="product-gallery">
            <Gallery product={product} />
          </div>
          <div className="product-info">
            <p className="product-brand">
              <Link to={brandPath(product.brand)}>{product.brand}</Link> · {category.name}
            </p>
            <h1>{name}</h1>
            {promo && <span className="tag">{promo.label}</span>}
            <div className="dialog-price">
              {price < product.price && <s>{fmt(product.price)}</s>}
              <strong>{fmt(price)}</strong>
            </div>
            <div className="dialog-foot product-buy">
              <span className="qty">
                <button aria-label="減少" disabled={qty <= 1} onClick={() => setCount(qty - 1)}>
                  −
                </button>
                {qty}
                <button aria-label="增加" disabled={qty >= 99} onClick={() => setCount(qty + 1)}>
                  +
                </button>
              </span>
              <button className="primary" disabled={inCart >= 99} onClick={() => setQty(product.id, inCart + qty)}>
                加入估價單
              </button>
            </div>
            <p className="product-status" role="status">
              {inCart > 0 ? `估價單裡已有 ${inCart} 件` : ''}
            </p>
          </div>
        </div>

        <h2>商品描述</h2>
        <p className="dialog-desc">{product.description ?? '尚無商品描述。'}</p>

        <h2>商品規格</h2>
        <SpecTable product={product} category={category} />

        {compatibleWith(product).map((g) => (
          <section key={g.label}>
            <h2>{g.label}</h2>
            <ProductLinks items={g.items} />
          </section>
        ))}

        {others.length > 0 && (
          <section>
            <h2>其他{category.name}</h2>
            <ProductLinks items={others} />
          </section>
        )}
      </article>
    </Page>
  );
}

export function BrandPage({ brand }: { brand: string }) {
  const items = products.filter((p) => p.brand === brand);
  return (
    <Page>
      <Crumbs items={[HOME, { name: brand }]} />
      <h1>{brand} 電腦零組件</h1>
      <p className="lead">共 {items.length} 款,點進商品頁可以看規格並加入估價單。</p>
      {categories
        .filter((c) => items.some((p) => p.cat === c.id))
        .map((c) => (
          <section key={c.id}>
            <h2>
              <Link to={categoryPath(c)}>{c.name}</Link>
            </h2>
            <ProductLinks items={items.filter((p) => p.cat === c.id)} />
          </section>
        ))}
    </Page>
  );
}

export function NotFound() {
  return (
    <Page>
      <h1>找不到這個頁面</h1>
      <p className="lead">網址可能有誤,或商品已經移除。可以從下面的分類重新開始。</p>
      <ul className="brand-list">
        {categories.map((c) => (
          <li key={c.id}>
            <Link to={categoryPath(c)}>{c.name}</Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}
