import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { markClientReady } from './router';
import './styles.css';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App initialPath={location.pathname} />
  </StrictMode>
);

if (root.firstElementChild) {
  // 伺服器已經輸出這一頁的 HTML:接手它,不重新畫
  // (App 掛載完成後自己會標記「接手完成」;在那之前的 render 都要和伺服器輸出一致)
  hydrateRoot(root, app);
} else {
  // 開發模式(npm run dev)沒有預先產生的 HTML:直接在瀏覽器畫
  markClientReady();
  createRoot(root).render(app);
}
