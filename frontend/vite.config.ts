import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// 預覽建置結果(npm run preview)時,找不到的網址回 dist/404.html 與 404 狀態碼,和靜態主機的行為一致
const notFoundPage = (): Plugin => ({
  name: 'preview-404-page',
  configurePreviewServer(server) {
    return () => {
      const dist = server.config.build.outDir;
      server.middlewares.use(async (req, res, next) => {
        // 走到這裡的請求不是靜態檔;網址若對得到某一頁的 HTML(/c/cpu → c/cpu.html),交給後面的中介層回應
        const file = decodeURIComponent((req.url ?? '/').split('?')[0]);
        if (!file.includes('..') && existsSync(`${dist}${file.endsWith('/') ? `${file}index.html` : file}`)) return next();
        const html = await readFile(`${dist}/404.html`).catch(() => 'Not Found');
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
      });
    };
  },
});

export default defineConfig(({ isPreview }) => ({
  plugins: [react(), notFoundPage()],
  server: { port: 5173, strictPort: true },
  // 開發時每個網址都回同一份 index.html,由瀏覽器端決定畫哪一頁;
  // 預覽建置結果時照靜態主機的方式:有檔案才回,沒有就回 404
  appType: isPreview ? 'mpa' : 'spa',
}));
