// 建置的最後一步:把每個網址的頁面輸出成靜態 HTML,並產生 sitemap.xml、robots.txt、404.html。
// 檔名是 /c/cpu → dist/c/cpu.html:靜態主機以不帶結尾斜線的網址提供,和頁面標示的正式網址一致。
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const { render, paths, sitemap, robots } = await import(pathToFileURL(join(root, 'dist-ssr/entry-server.js')).href);

const template = await readFile(join(dist, 'index.html'), 'utf8');
for (const mark of ['<!--app-head-->', '<!--app-html-->']) {
  if (!template.includes(mark)) throw new Error(`index.html 缺少 ${mark}`);
}

const page = (path) => {
  const { html, head, found } = render(path);
  return {
    found,
    // 用函式當取代值:內容裡的 $ 不會被當成特殊符號
    html: template.replace('<!--app-head-->', () => head).replace('<!--app-html-->', () => html),
  };
};

const write = async (file, content) => {
  await mkdir(dirname(join(dist, file)), { recursive: true });
  await writeFile(join(dist, file), content);
};

const all = paths();
for (const path of all) {
  const { html, found } = page(path);
  if (!found) throw new Error(`網址 ${path} 沒有對應的頁面`);
  await write(path === '/' ? 'index.html' : `${path.slice(1)}.html`, html);
}
await write('404.html', page('/404').html);
await write('sitemap.xml', sitemap());
await write('robots.txt', robots());
await rm(join(root, 'dist-ssr'), { recursive: true, force: true });

console.log(`已產生 ${all.length} 頁、404.html、sitemap.xml、robots.txt`);
