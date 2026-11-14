import { categories } from './data';
import { categoryPath } from './routes';
import { Link } from './router';

type Props = {
  active: string;
};

// 類別頁籤:每個類別都是一個連到分類頁的連結,全部直接列出來;一排放不下就折到下一排。
// 沒有下拉也不用左右捲:所有類別一眼看得到,搜尋引擎跟著連結也走得到每個分類。
// (一般點擊在瀏覽器端直接換頁,不重新載入)
export default function CategoryTabs({ active }: Props) {
  return (
    <nav className="tabs" aria-label="商品類別">
      {categories.map((c) => (
        <Link key={c.id} to={categoryPath(c)} className={c.id === active ? 'tab on' : 'tab'} aria-current={c.id === active ? 'page' : undefined}>
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
