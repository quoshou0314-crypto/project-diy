import { createContext, useContext } from 'react';
import type { AnchorHTMLAttributes, MouseEvent } from 'react';

type Router = { path: string; navigate: (to: string) => void };

export const RouterContext = createContext<Router>({ path: '/', navigate: () => {} });
export const useRouter = () => useContext(RouterContext);

// 伺服器端輸出的畫面不含估價單、顯示方式這些存在瀏覽器裡的狀態。
// 瀏覽器接手(hydrate)時第一次 render 必須和伺服器輸出一致,接手完成後才讀取它們。
let ready = false;
export const clientReady = () => ready;
export const markClientReady = () => {
  ready = true;
};

const plainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

// 點了要另開分頁、下載等(按著輔助鍵或非左鍵)時,交還給瀏覽器處理
export const isPlainClick = (e: MouseEvent) => !e.defaultPrevented && plainClick(e);

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

// 站內連結:輸出的是真正的 <a href>(搜尋引擎與「另開分頁」都能用),一般點擊則在瀏覽器端直接換頁,不重新載入。
export function Link({ to, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter();
  return (
    <a
      {...rest}
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (!isPlainClick(e)) return;
        e.preventDefault();
        navigate(to);
      }}
    />
  );
}
