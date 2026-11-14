// 網址與頁面的對應。每個分類、商品、品牌都有自己的網址;伺服器端產生頁面與瀏覽器端換頁共用這一份。
import { categories, products } from './data';
import type { Category, Product } from './types';

export type Route =
  | { kind: 'home' }
  | { kind: 'category'; category: Category }
  | { kind: 'product'; product: Product }
  | { kind: 'brand'; brand: string }
  | { kind: 'notfound' };

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const brands = [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'en'));
const brandBySlug = new Map(brands.map((b) => [slug(b), b]));
const categoryById = new Map(categories.map((c) => [c.id, c]));
const productById = new Map(products.map((p) => [p.id, p]));

export const categoryPath = (c: Pick<Category, 'id'>) => `/c/${c.id}`;
// 商品網址以代號開頭,後面接可讀的名稱。系統只認代號:品名改了,舊網址仍然找得到同一個商品。
export const productPath = (p: Product) => `/p/${p.id}-${slug(`${p.brand} ${p.name}`)}`;
export const brandPath = (brand: string) => `/brand/${slug(brand)}`;

export function parseRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { kind: 'home' };
  const [, section, rest, extra] = path.split('/');
  if (extra === undefined && rest) {
    if (section === 'c') {
      const category = categoryById.get(rest);
      if (category) return { kind: 'category', category };
    }
    if (section === 'p') {
      const product = productById.get(rest.split('-')[0]);
      if (product) return { kind: 'product', product };
    }
    if (section === 'brand') {
      const brand = brandBySlug.get(rest);
      if (brand) return { kind: 'brand', brand };
    }
  }
  return { kind: 'notfound' };
}

// 這個頁面的正式網址(不含網域)。找不到的頁面沒有正式網址。
export function routePath(route: Route): string | null {
  switch (route.kind) {
    case 'home':
      return '/';
    case 'category':
      return categoryPath(route.category);
    case 'product':
      return productPath(route.product);
    case 'brand':
      return brandPath(route.brand);
    case 'notfound':
      return null;
  }
}

// 所有要產生成 HTML、列入網站地圖的網址
export const allPaths = (): string[] => [
  '/',
  ...categories.map(categoryPath),
  ...brands.map(brandPath),
  ...products.map(productPath),
];
