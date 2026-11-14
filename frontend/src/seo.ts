// 每一頁的標題、描述、正式網址、分享預覽與結構化資料。
// 伺服器端產生 HTML 時輸出成 <head> 裡的標籤;瀏覽器端換頁時套用到 document 上。兩邊用同一份資料。
import { categories, fmt, products } from './data';
import { salePrice } from './pricing';
import { HOME_CATEGORY, brandPath, categoryPath, productPath, routePath } from './routes';
import type { Route } from './routes';
import { INDEXABLE, SITE_NAME, absolute } from './site';
import type { Category, Product } from './types';

export type HeadTag = { tag: 'meta' | 'link' | 'script'; attrs: Record<string, string>; text?: string };
export type PageMeta = { title: string; description: string; tags: HeadTag[] };

type Crumb = { name: string; path: string };

const categoryOf = (p: Product) => categories.find((c) => c.id === p.cat)!;
const fullName = (p: Product) => `${p.brand} ${p.name}`;

// 「腳位 AM5、核心數 8 核」:商品有填的規格,照分類的規格順序
export const specSummary = (p: Product, category: Category) =>
  category.specs
    .filter((d) => p.specs[d.key] !== undefined)
    .map((d) => `${d.label} ${p.specs[d.key]}${d.unit ?? ''}`)
    .join('、');

const breadcrumbLd = (crumbs: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absolute(c.path) })),
});

const itemListLd = (items: Product[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  numberOfItems: items.length,
  itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: fullName(p), url: absolute(productPath(p)) })),
});

function productLd(p: Product, category: Category, description: string) {
  const images = (p.images?.length ? p.images : p.image ? [p.image] : []).map((src) => new URL(src, absolute('/')).href);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: fullName(p),
    sku: p.id,
    brand: { '@type': 'Brand', name: p.brand },
    category: category.name,
    description,
    ...(images.length > 0 && { image: images }),
    additionalProperty: category.specs
      .filter((d) => p.specs[d.key] !== undefined)
      .map((d) => ({ '@type': 'PropertyValue', name: d.label, value: `${p.specs[d.key]}${d.unit ?? ''}` })),
    // 庫存狀態等後台有庫存資料後再標;沒有的資訊不標
    offers: {
      '@type': 'Offer',
      url: absolute(productPath(p)),
      priceCurrency: 'TWD',
      price: salePrice(p),
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

type Page = { title: string; description: string; type: 'website' | 'product'; image?: string; ld: object[] };

function describe(route: Route): Page {
  switch (route.kind) {
    case 'category': {
      const c = route.category;
      const items = products.filter((p) => p.cat === c.id);
      const names = [...new Set(items.map((p) => p.brand))].slice(0, 5).join('、');
      const low = Math.min(...items.map(salePrice));
      // 首頁(第一個分類):標題與描述講整個網站,不只這個分類
      if (c === HOME_CATEGORY)
        return {
          title: `${SITE_NAME}|電腦零組件線上估價與相容性檢查`,
          description: `線上挑選${categories
            .slice(0, 6)
            .map((x) => x.name)
            .join('、')}等 ${products.length} 項電腦零組件,即時計算總價、套用優惠,並自動檢查處理器、主機板與機殼是否相容。`,
          type: 'website',
          ld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: absolute('/') }, itemListLd(items)],
        };
      return {
        title: `${c.name}價格與規格比較|${SITE_NAME}`,
        description: `比較 ${items.length} 款${c.name}的規格與價格,${fmt(low)} 起。品牌包含 ${names};可依${c.specs
          .slice(0, 3)
          .map((d) => d.label)
          .join('、')}篩選,加入估價單即時計算總價。`,
        type: 'website',
        ld: [
          breadcrumbLd([
            { name: '首頁', path: '/' },
            { name: c.name, path: categoryPath(c) },
          ]),
          itemListLd(items),
        ],
      };
    }
    case 'product': {
      const p = route.product;
      const c = categoryOf(p);
      const specs = specSummary(p, c);
      const description = `${fullName(p)} ${c.name}${specs ? `,${specs}` : ''}。售價 ${fmt(salePrice(p))},可加入估價單與其他零件一起計算總價並檢查相容性。`;
      return {
        title: `${fullName(p)} ${c.name}|${SITE_NAME}`,
        description,
        type: 'product',
        image: p.images?.[0] ?? p.image,
        ld: [
          productLd(p, c, description),
          breadcrumbLd([
            { name: '首頁', path: '/' },
            ...(c === HOME_CATEGORY ? [] : [{ name: c.name, path: categoryPath(c) }]),
            { name: fullName(p), path: productPath(p) },
          ]),
        ],
      };
    }
    case 'brand': {
      const items = products.filter((p) => p.brand === route.brand);
      const cats = categories.filter((c) => items.some((p) => p.cat === c.id)).map((c) => c.name);
      return {
        title: `${route.brand} 電腦零組件價格|${SITE_NAME}`,
        description: `${route.brand} 的${cats.join('、')}共 ${items.length} 款,列出規格與售價,可直接加入估價單計算總價。`,
        type: 'website',
        ld: [
          breadcrumbLd([
            { name: '首頁', path: '/' },
            { name: route.brand, path: brandPath(route.brand) },
          ]),
          itemListLd(items),
        ],
      };
    }
    case 'notfound':
      return { title: `找不到頁面|${SITE_NAME}`, description: '這個頁面不存在,或商品已經移除。', type: 'website', ld: [] };
  }
}

export function pageMeta(route: Route): PageMeta {
  const page = describe(route);
  const path = routePath(route);
  const meta = (name: string, content: string): HeadTag => ({ tag: 'meta', attrs: { name, content } });
  const og = (property: string, content: string): HeadTag => ({ tag: 'meta', attrs: { property, content } });
  const image = page.image && new URL(page.image, absolute('/')).href;

  const tags: HeadTag[] = [
    meta('description', page.description),
    // 找不到的頁面,以及還沒設定正式網域(尚未上線)時,不給搜尋引擎收錄
    meta('robots', path && INDEXABLE ? 'index,follow,max-image-preview:large' : 'noindex,nofollow'),
    og('og:site_name', SITE_NAME),
    og('og:locale', 'zh_TW'),
    og('og:type', page.type),
    og('og:title', page.title),
    og('og:description', page.description),
    meta('twitter:card', image ? 'summary_large_image' : 'summary'),
  ];
  if (path) {
    tags.push({ tag: 'link', attrs: { rel: 'canonical', href: absolute(path) } }, og('og:url', absolute(path)));
  }
  if (image) tags.push(og('og:image', image));
  for (const ld of page.ld) {
    // 內嵌在 <script> 裡:把 < 換掉,資料裡就算有 </script> 也不會提早結束標籤
    tags.push({ tag: 'script', attrs: { type: 'application/ld+json' }, text: JSON.stringify(ld).replace(/</g, '\\u003c') });
  }
  return { title: page.title, description: page.description, tags };
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 伺服器端:輸出成 <head> 裡的 HTML。每個標籤帶 data-seo,瀏覽器端換頁時才知道要換掉哪些。
export function headHtml(meta: PageMeta): string {
  const lines = [`<title>${escapeHtml(meta.title)}</title>`];
  for (const t of meta.tags) {
    const attrs = Object.entries(t.attrs)
      .map(([k, v]) => ` ${k}="${escapeHtml(v)}"`)
      .join('');
    lines.push(t.tag === 'script' ? `<script data-seo${attrs}>${t.text ?? ''}</script>` : `<${t.tag} data-seo${attrs} />`);
  }
  return lines.join('\n    ');
}

// 瀏覽器端換頁後:把標題與 <head> 裡的標籤換成新頁面的
export function applyMeta(meta: PageMeta) {
  document.title = meta.title;
  document.head.querySelectorAll('[data-seo]').forEach((el) => el.remove());
  for (const t of meta.tags) {
    const el = document.createElement(t.tag);
    el.setAttribute('data-seo', '');
    for (const [k, v] of Object.entries(t.attrs)) el.setAttribute(k, v);
    if (t.text) el.textContent = t.text;
    document.head.appendChild(el);
  }
}

export function sitemapXml(paths: string[]): string {
  const urls = paths.map((p) => `  <url><loc>${escapeHtml(absolute(p))}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(): string {
  if (!INDEXABLE) return 'User-agent: *\nDisallow: /\n';
  return ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /admin/', 'Disallow: /account/', 'Disallow: /checkout/', '', `Sitemap: ${absolute('/sitemap.xml')}`, ''].join('\n');
}
