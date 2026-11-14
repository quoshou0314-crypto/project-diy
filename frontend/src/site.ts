// 網站層級的設定。正式網域由建置時的環境變數 VITE_SITE_URL 提供(例如 https://shop.example.tw)。
// 沒有設定時視為還沒上線:所有頁面標示不收錄,robots.txt 擋下全部,避免示意資料被搜尋引擎收進去。
const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/+$/, '');

export const SITE_NAME = 'DIY 估價';
export const SITE_URL = configured || 'http://localhost:5173';
export const INDEXABLE = Boolean(configured);

export const absolute = (path: string) => SITE_URL + path;
