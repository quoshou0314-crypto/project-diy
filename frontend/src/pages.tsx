import { categories } from './data';
import { categoryPath } from './routes';
import { Link } from './router';

export function NotFound() {
  return (
    <main className="products page">
      <h1>找不到這個頁面</h1>
      <p className="lead">網址可能有誤,或商品已經移除。可以從下面的分類重新開始。</p>
      <ul className="brand-list">
        {categories.map((c) => (
          <li key={c.id}>
            <Link to={categoryPath(c)}>{c.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
