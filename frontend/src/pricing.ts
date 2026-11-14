// 模擬計價:正式版由後端 POST /api/quote 計算,前端只顯示結果。
// 套用順序:單品促銷 → 組合促銷 → 滿額折 → 折扣券(限一張)。
import { coupons, fmt, productById, products, promotions } from './data';
import type { Cart, Product, Promotion } from './types';

export type Line = { product: Product; qty: number; unit: number; total: number };
export type Discount = { label: string; amount: number };
export type Quote = {
  lines: Line[];
  count: number;
  subtotal: number; // 原價小計
  discounts: Discount[];
  total: number;
  coupon: { ok: boolean; message: string } | null;
  warnings: string[]; // 相容性提醒:只提醒,不擋加入
};

// 機殼能裝的主機板:大機殼裝得下小板子
const FORM_RANK: Record<string, number> = { ITX: 1, mATX: 2, ATX: 3 };

export type Related = { label: string; items: Product[] };

// 商品頁列出的「搭配得起來的零件」:和 compatibility() 用的是同一套規則(腳位、主機板與機殼尺寸)
export function compatibleWith(p: Product): Related[] {
  const of = (cat: string, ok: (x: Product) => boolean) => products.filter((x) => x.cat === cat && ok(x));
  const rank = (x: Product) => FORM_RANK[String(x.specs.form)] ?? 0;
  const out: Related[] = [];
  if (p.cat === 'cpu') out.push({ label: `相容的主機板(${p.specs.socket})`, items: of('mb', (x) => x.specs.socket === p.specs.socket) });
  if (p.cat === 'mb') {
    out.push({ label: `相容的處理器(${p.specs.socket})`, items: of('cpu', (x) => x.specs.socket === p.specs.socket) });
    out.push({ label: `裝得下的機殼(${p.specs.form})`, items: of('case', (x) => rank(x) >= rank(p)) });
  }
  if (p.cat === 'case') out.push({ label: `裝得下的主機板(最大 ${p.specs.form})`, items: of('mb', (x) => rank(x) > 0 && rank(x) <= rank(p)) });
  return out.filter((g) => g.items.length > 0);
}

// 已選零件之間明顯裝不起來的組合(目前看得出來的:處理器與主機板腳位、主機板與機殼尺寸)
function compatibility(lines: Line[]): string[] {
  const out: string[] = [];
  const of = (cat: string) => lines.filter((l) => l.product.cat === cat).map((l) => l.product);
  const boards = of('mb');
  if (boards.length === 0) return out;

  const sockets = [...new Set(boards.map((b) => String(b.specs.socket)))];
  for (const cpu of of('cpu'))
    if (!sockets.includes(String(cpu.specs.socket)))
      out.push(`${cpu.name} 是 ${cpu.specs.socket} 腳位,已選的主機板是 ${sockets.join('、')}`);

  for (const box of of('case')) {
    const max = FORM_RANK[String(box.specs.form)];
    const tooBig = boards.filter((b) => max && (FORM_RANK[String(b.specs.form)] ?? 0) > max);
    if (tooBig.length > 0)
      out.push(`${box.name} 最大支援 ${box.specs.form} 主機板,已選的是 ${[...new Set(tooBig.map((b) => b.specs.form))].join('、')}`);
  }
  return out;
}

const itemPromos = new Map(
  promotions.filter((x): x is Extract<Promotion, { type: 'item' }> => x.type === 'item').map((x) => [x.productId, x]),
);

export const itemPromo = (id: string) => itemPromos.get(id);
export const salePrice = (p: Product) => p.price - (itemPromos.get(p.id)?.off ?? 0);

export function quote(cart: Cart, couponCode: string): Quote {
  const lines: Line[] = [];
  for (const [id, qty] of Object.entries(cart)) {
    const product = productById.get(id);
    if (!product || qty <= 0) continue;
    const unit = salePrice(product);
    lines.push({ product, qty, unit, total: unit * qty });
  }

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  let running = lines.reduce((s, l) => s + l.total, 0);
  const discounts: Discount[] = [];
  if (subtotal > running) discounts.push({ label: '單品促銷', amount: subtotal - running });

  const cats = new Set(lines.map((l) => l.product.cat));
  for (const promo of promotions) {
    if (promo.type === 'bundle' && promo.cats.every((c) => cats.has(c))) {
      discounts.push({ label: promo.label, amount: promo.off });
      running -= promo.off;
    }
  }
  for (const promo of promotions) {
    if (promo.type === 'threshold' && running >= promo.min) {
      discounts.push({ label: promo.label, amount: promo.off });
      running -= promo.off;
    }
  }

  let coupon: Quote['coupon'] = null;
  const code = couponCode.trim().toUpperCase();
  if (code) {
    const c = coupons.find((x) => x.code === code);
    if (!c) {
      coupon = { ok: false, message: '查無此折扣券' };
    } else if (running < c.min) {
      coupon = { ok: false, message: `還差 ${fmt(c.min - running)} 才能使用(${c.label})` };
    } else {
      const amount = c.off ?? Math.min(Math.floor((running * (c.percent ?? 0)) / 100), c.cap ?? Infinity);
      discounts.push({ label: `折扣券 ${c.code}`, amount });
      running -= amount;
      coupon = { ok: true, message: c.label };
    }
  }

  return {
    lines,
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal,
    discounts,
    total: Math.max(running, 0),
    coupon,
    warnings: compatibility(lines),
  };
}
