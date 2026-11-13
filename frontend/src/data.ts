// 模擬資料:品名為真實產品,價格、促銷與折扣券皆為示意,之後由後端 API 取代。
import type { Category, Coupon, Product, Promotion, SpecValue } from './types';

export const categories: Category[] = [
  { id: 'cpu', name: '處理器', specs: [{ key: 'socket', label: '腳位' }, { key: 'cores', label: '核心數', unit: ' 核' }] },
  {
    id: 'mb',
    name: '主機板',
    specs: [
      { key: 'socket', label: '腳位' },
      { key: 'chipset', label: '晶片組' },
      { key: 'form', label: '尺寸' },
    ],
  },
  {
    id: 'ram',
    name: '記憶體',
    specs: [
      { key: 'type', label: '類型' },
      { key: 'cap', label: '容量', unit: 'GB' },
      { key: 'speed', label: '時脈', unit: 'MHz' },
    ],
  },
  { id: 'gpu', name: '顯示卡', specs: [{ key: 'chip', label: '晶片' }, { key: 'vram', label: '記憶體', unit: 'GB' }] },
  { id: 'ssd', name: '固態硬碟', specs: [{ key: 'iface', label: '介面' }, { key: 'cap', label: '容量', unit: 'TB' }] },
  { id: 'psu', name: '電源供應器', specs: [{ key: 'watt', label: '瓦數', unit: 'W' }, { key: 'rating', label: '80 PLUS' }] },
  { id: 'case', name: '機殼', specs: [{ key: 'form', label: '支援主機板' }, { key: 'color', label: '顏色' }] },
  { id: 'cooler', name: '散熱器', specs: [{ key: 'type', label: '類型' }, { key: 'size', label: '規格' }] },
  {
    id: 'monitor', group: '周邊配件',
    name: '螢幕',
    specs: [
      { key: 'size', label: '尺寸', unit: '"' },
      { key: 'panel', label: '面板類型' },
      { key: 'res', label: '解析度' },
      { key: 'curve', label: '面板曲率' },
      { key: 'nits', label: '最大亮度', unit: 'nits' },
      { key: 'bits', label: '位元深度', unit: 'bits' },
      { key: 'hz', label: '最高刷新率', unit: 'Hz' },
    ],
  },
  {
    id: 'kb', group: '周邊配件',
    name: '鍵盤',
    specs: [
      { key: 'sw', label: '軸體' },
      { key: 'layout', label: '配置' },
      { key: 'conn', label: '連線' },
    ],
  },
  { id: 'mouse', group: '周邊配件', name: '滑鼠', specs: [{ key: 'conn', label: '連線' }, { key: 'weight', label: '重量', unit: 'g' }] },
];

const p = (id: string, cat: string, brand: string, name: string, price: number, specs: Record<string, SpecValue>): Product => ({
  id,
  cat,
  brand,
  name,
  price,
  specs,
  description: `${brand} ${name}。這是示意用的商品描述,正式內容(特色、保固、內容物等)之後由後台填寫。`,
});

export const products: Product[] = [
  p('c1', 'cpu', 'AMD', 'Ryzen 5 9600X', 7490, { socket: 'AM5', cores: 6 }),
  p('c2', 'cpu', 'AMD', 'Ryzen 7 9700X', 10900, { socket: 'AM5', cores: 8 }),
  p('c3', 'cpu', 'AMD', 'Ryzen 7 9800X3D', 15900, { socket: 'AM5', cores: 8 }),
  p('c4', 'cpu', 'AMD', 'Ryzen 9 9950X', 19900, { socket: 'AM5', cores: 16 }),
  p('c5', 'cpu', 'Intel', 'Core Ultra 5 245K', 9990, { socket: 'LGA1851', cores: 14 }),
  p('c6', 'cpu', 'Intel', 'Core Ultra 7 265K', 12900, { socket: 'LGA1851', cores: 20 }),
  p('c7', 'cpu', 'Intel', 'Core i5-14400F', 5490, { socket: 'LGA1700', cores: 10 }),

  p('m1', 'mb', 'ASUS', 'TUF GAMING B650-PLUS WIFI', 5990, { socket: 'AM5', chipset: 'B650', form: 'ATX' }),
  p('m2', 'mb', 'MSI', 'MAG B850 TOMAHAWK WIFI', 7490, { socket: 'AM5', chipset: 'B850', form: 'ATX' }),
  p('m3', 'mb', 'GIGABYTE', 'B650M AORUS ELITE AX', 5290, { socket: 'AM5', chipset: 'B650', form: 'mATX' }),
  p('m4', 'mb', 'ASUS', 'ROG STRIX X870-A GAMING WIFI', 11900, { socket: 'AM5', chipset: 'X870', form: 'ATX' }),
  p('m5', 'mb', 'MSI', 'PRO Z890-P WIFI', 7990, { socket: 'LGA1851', chipset: 'Z890', form: 'ATX' }),
  p('m6', 'mb', 'GIGABYTE', 'B860M DS3H', 4290, { socket: 'LGA1851', chipset: 'B860', form: 'mATX' }),
  p('m7', 'mb', 'ASRock', 'B760M Pro RS', 3690, { socket: 'LGA1700', chipset: 'B760', form: 'mATX' }),

  p('r1', 'ram', 'Kingston', 'FURY Beast 16GB×2', 3299, { type: 'DDR5', cap: 32, speed: 6000 }),
  p('r2', 'ram', 'G.SKILL', 'Trident Z5 RGB 16GB×2', 4190, { type: 'DDR5', cap: 32, speed: 6400 }),
  p('r3', 'ram', 'Corsair', 'Vengeance 32GB×2', 6490, { type: 'DDR5', cap: 64, speed: 6000 }),
  p('r4', 'ram', 'Crucial', 'Pro 16GB', 1590, { type: 'DDR5', cap: 16, speed: 5600 }),
  p('r5', 'ram', 'Kingston', 'FURY Beast 8GB×2', 1290, { type: 'DDR4', cap: 16, speed: 3200 }),

  p('g1', 'gpu', 'MSI', 'GeForce RTX 5060 VENTUS 2X', 10490, { chip: 'RTX 5060', vram: 8 }),
  p('g2', 'gpu', 'ASUS', 'PRIME GeForce RTX 5070', 19990, { chip: 'RTX 5070', vram: 12 }),
  p('g3', 'gpu', 'GIGABYTE', 'GeForce RTX 5070 Ti GAMING OC', 28990, { chip: 'RTX 5070 Ti', vram: 16 }),
  p('g4', 'gpu', 'ASUS', 'TUF GeForce RTX 5080', 41990, { chip: 'RTX 5080', vram: 16 }),
  p('g5', 'gpu', 'Sapphire', 'PULSE Radeon RX 9070 XT', 22990, { chip: 'RX 9070 XT', vram: 16 }),
  p('g6', 'gpu', 'PowerColor', 'Radeon RX 9060 XT', 12990, { chip: 'RX 9060 XT', vram: 16 }),

  p('s1', 'ssd', 'WD', 'Black SN850X', 2890, { iface: 'PCIe 4.0', cap: 1 }),
  p('s2', 'ssd', 'Samsung', '990 PRO', 5490, { iface: 'PCIe 4.0', cap: 2 }),
  p('s3', 'ssd', 'Crucial', 'T500', 2590, { iface: 'PCIe 4.0', cap: 1 }),
  p('s4', 'ssd', 'Kingston', 'NV3', 1290, { iface: 'PCIe 4.0', cap: 0.5 }),
  p('s5', 'ssd', 'Samsung', '9100 PRO', 8490, { iface: 'PCIe 5.0', cap: 2 }),
  p('s6', 'ssd', 'Crucial', 'MX500', 2190, { iface: 'SATA', cap: 1 }),

  p('p1', 'psu', 'Seasonic', 'FOCUS GX-750', 3690, { watt: 750, rating: '金牌' }),
  p('p2', 'psu', 'Corsair', 'RM850x', 4490, { watt: 850, rating: '金牌' }),
  p('p3', 'psu', 'FSP', 'Hydro G PRO 1000W', 5490, { watt: 1000, rating: '金牌' }),
  p('p4', 'psu', 'Cooler Master', 'MWE 650 Bronze V3', 1790, { watt: 650, rating: '銅牌' }),
  p('p5', 'psu', 'MSI', 'MAG A650BN', 1690, { watt: 650, rating: '銅牌' }),

  p('k1', 'case', 'Lian Li', 'LANCOOL 216', 2990, { form: 'ATX', color: '黑' }),
  p('k2', 'case', 'Fractal Design', 'North', 4690, { form: 'ATX', color: '白' }),
  p('k3', 'case', 'NZXT', 'H5 Flow', 2790, { form: 'ATX', color: '黑' }),
  p('k4', 'case', 'Cooler Master', 'NR200P', 2690, { form: 'ITX', color: '黑' }),
  p('k5', 'case', 'Montech', 'AIR 903 MAX', 2190, { form: 'ATX', color: '白' }),

  p('o1', 'cooler', 'Thermalright', 'Peerless Assassin 120 SE', 1090, { type: '空冷', size: '雙塔' }),
  p('o2', 'cooler', 'Noctua', 'NH-D15 G2', 4990, { type: '空冷', size: '雙塔' }),
  p('o3', 'cooler', 'ARCTIC', 'Liquid Freezer III 360', 3490, { type: '水冷', size: '360mm' }),
  p('o4', 'cooler', 'NZXT', 'Kraken 240', 3990, { type: '水冷', size: '240mm' }),
  p('o5', 'cooler', 'DeepCool', 'AK400', 790, { type: '空冷', size: '單塔' }),

  p('d1', 'monitor', 'ASUS', 'TUF Gaming VG27AQ3A', 6990, { size: 27, panel: 'IPS', res: '2560x1440', nits: 350, bits: 10, hz: 180 }),
  p('d2', 'monitor', 'LG', 'UltraGear 27GS95QE', 22900, { size: 27, panel: 'OLED', res: '2560x1440', nits: 1000, bits: 10, hz: 240 }),
  p('d3', 'monitor', 'MSI', 'MAG 274UPF', 12900, { size: 27, panel: 'IPS', res: '3840x2160', nits: 400, bits: 10, hz: 144 }),
  p('d4', 'monitor', 'GIGABYTE', 'M32U', 15900, { size: 32, panel: 'IPS', res: '3840x2160', nits: 350, bits: 10, hz: 144 }),
  p('d5', 'monitor', 'AOC', '24G4', 3888, { size: 24, panel: 'IPS', res: '1920x1080', nits: 300, bits: 8, hz: 180 }),
  p('d6', 'monitor', 'Samsung', 'Odyssey G5 G55C', 7490, { size: 32, panel: 'VA', res: '2560x1440', curve: '1000R', nits: 300, bits: 8, hz: 165 }),

  p('kb1', 'kb', 'Keychron', 'K8 Pro', 3290, { sw: '茶軸', layout: '80%', conn: '無線' }),
  p('kb2', 'kb', 'Logitech', 'G PRO X TKL', 5990, { sw: '紅軸', layout: '80%', conn: '無線' }),
  p('kb3', 'kb', 'Ducky', 'One 3', 3990, { sw: '青軸', layout: '100%', conn: '有線' }),
  p('kb4', 'kb', 'Razer', 'BlackWidow V4 75%', 5490, { sw: '茶軸', layout: '75%', conn: '有線' }),
  p('kb5', 'kb', 'irocks', 'K71M', 1990, { sw: '紅軸', layout: '100%', conn: '有線' }),

  p('ms1', 'mouse', 'Logitech', 'G PRO X SUPERLIGHT 2', 4490, { conn: '無線', weight: 60 }),
  p('ms2', 'mouse', 'Razer', 'DeathAdder V3 Pro', 4290, { conn: '無線', weight: 63 }),
  p('ms3', 'mouse', 'Logitech', 'G304', 990, { conn: '無線', weight: 99 }),
  p('ms4', 'mouse', 'SteelSeries', 'Rival 3', 890, { conn: '有線', weight: 77 }),
  p('ms5', 'mouse', 'Pulsar', 'X2 V2', 2990, { conn: '無線', weight: 53 }),
];

export const promotions: Promotion[] = [
  { type: 'item', productId: 'c3', off: 1000, label: '限時折 $1,000' },
  { type: 'item', productId: 'g2', off: 1500, label: '限時折 $1,500' },
  { type: 'item', productId: 's2', off: 500, label: '限時折 $500' },
  { type: 'item', productId: 'r1', off: 300, label: '限時折 $300' },
  { type: 'item', productId: 'd2', off: 2000, label: '限時折 $2,000' },
  { type: 'bundle', cats: ['cpu', 'mb'], off: 500, label: '處理器+主機板合購' },
  { type: 'bundle', cats: ['kb', 'mouse'], off: 200, label: '鍵盤+滑鼠合購' },
  { type: 'threshold', min: 40000, off: 1000, label: '滿 $40,000 折 $1,000' },
];

export const coupons: Coupon[] = [
  { code: 'DIY500', label: '滿 $20,000 折 $500', min: 20000, off: 500 },
  { code: 'SAVE5', label: '全單 95 折(最高折 $1,500)', min: 0, percent: 5, cap: 1500 },
];

export const productById = new Map(products.map((x) => [x.id, x]));
export const fmt = (n: number) => '$' + n.toLocaleString('en-US');
