export type SpecValue = string | number;

/** 規格定義:每個分類有哪些可篩選的規格。unit 為標準單位(顯示時接在數值後)。 */
export type SpecDef = { key: string; label: string; unit?: string };

/** group:收進哪一個下拉頁籤(例如「周邊配件」);沒有 group 的是 DIY 核心零組件,直接顯示成頁籤。 */
export type Category = { id: string; name: string; group?: string; specs: SpecDef[] };

export type Product = {
  id: string;
  cat: string;
  brand: string;
  name: string;
  price: number; // 新台幣,整數
  image?: string; // 清單縮圖網址;沒有時顯示佔位圖
  images?: string[]; // 詳情疊加框的圖片(多張)
  description?: string; // 商品描述
  specs: Record<string, SpecValue>; // 缺少的規格在表格顯示「-」
};

export type Promotion =
  | { type: 'item'; productId: string; off: number; label: string }
  | { type: 'bundle'; cats: string[]; off: number; label: string }
  | { type: 'threshold'; min: number; off: number; label: string };

export type Coupon = {
  code: string;
  label: string;
  min: number; // 最低消費
  off?: number; // 固定折抵
  percent?: number; // 折抵百分比
  cap?: number; // 百分比折抵上限
};

export type Cart = Record<string, number>; // 商品 id → 數量
