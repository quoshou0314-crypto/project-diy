// 伺服器端入口:把某個網址的頁面輸出成 HTML。建置時由 scripts/prerender.mjs 呼叫,逐頁產生靜態檔;
// 之後改由 Worker 即時產生時,呼叫的也是這個 render()。
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import { allPaths, parseRoute } from './routes';
import { headHtml, pageMeta, robotsTxt, sitemapXml } from './seo';

export function render(path: string): { html: string; head: string; found: boolean } {
  const route = parseRoute(path);
  const html = renderToString(
    <StrictMode>
      <App initialPath={path} />
    </StrictMode>,
  );
  return { html, head: headHtml(pageMeta(route)), found: route.kind !== 'notfound' };
}

export const paths = allPaths;
export const sitemap = () => sitemapXml(allPaths());
export const robots = robotsTxt;
