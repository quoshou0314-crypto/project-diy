import { useState } from 'react';
import { categories, fmt } from './data';
import type { Quote } from './pricing';

type Props = {
  open: boolean;
  onClose: () => void;
  q: Quote;
  active: string;
  onSelect: (cat: string) => void;
  setQty: (id: string, qty: number) => void;
  coupon: string;
  setCoupon: (code: string) => void;
  onClear: () => void;
  onUndo?: () => void; // 剛清空時才有:把清掉的估價單放回來
};

export default function Menu({ open, onClose, q, active, onSelect, setQty, coupon, setCoupon, onClear, onUndo }: Props) {
  const [draft, setDraft] = useState('');
  const [entering, setEntering] = useState(false);
  const [copied, setCopied] = useState(false);

  const discount = q.discounts.reduce((s, d) => s + d.amount, 0);
  const couponOk = coupon !== '' && q.coupon?.ok === true;
  const couponBad = coupon !== '' && !couponOk; // 代碼不存在或未達門檻:輸入框留著,錯誤寫在下面

  const share = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      prompt('複製這個連結即可分享估價單', location.href);
    }
  };

  const closeCoupon = () => {
    setCoupon('');
    setDraft('');
    setEntering(false);
  };

  return (
    <aside className={`menu${open ? ' open' : ''}`}>
      <header className="menu-head">
        <h2>估價單</h2>
        {q.count > 0 && (
          <button className="link" onClick={onClear}>
            清空
          </button>
        )}
        <button className="link sheet-close" onClick={onClose}>
          關閉
        </button>
      </header>

      {/* 只列出已選的零件,每個分類一段:上面一行分類名,下面每項一列(品名 | 數量 | 金額)。點分類或品名會切到該分類。 */}
      <div className="menu-body">
        {q.count === 0 &&
          (onUndo ? (
            <p className="menu-empty" role="status">
              已清空估價單。{' '}
              <button className="link" onClick={onUndo}>
                復原
              </button>
            </p>
          ) : (
            <p className="menu-empty">還沒有零件,點商品價格旁的購物車鍵就能加入。</p>
          ))}
        {categories.map((cat) => {
          const lines = q.lines.filter((l) => l.product.cat === cat.id);
          const on = active === cat.id ? ' active' : '';
          if (lines.length === 0) return null;
          return (
            <section key={cat.id} className={`slot${on}`}>
              <button className="cat" onClick={() => onSelect(cat.id)}>
                {cat.name}
              </button>
              {lines.map((l) => {
                const name = `${l.product.brand} ${l.product.name}`;
                return (
                  <div key={l.product.id} className="row">
                    <button className="pick" onClick={() => onSelect(cat.id)}>
                      {name}
                    </button>
                    <span className="qty">
                      <button aria-label={l.qty === 1 ? `移除 ${name}` : `減少 ${name}`} onClick={() => setQty(l.product.id, l.qty - 1)}>
                        −
                      </button>
                      {l.qty}
                      <button aria-label={`增加 ${name}`} disabled={l.qty >= 99} onClick={() => setQty(l.product.id, l.qty + 1)}>
                        +
                      </button>
                    </span>
                    <span className="price">{fmt(l.total)}</span>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>

      <footer className="summary">
        {q.warnings.length > 0 && (
          <ul className="warnings" role="status" aria-label="相容性提醒">
            {q.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}

        {discount > 0 && (
          <details className="discounts">
            <summary>
              <span>已折抵</span>
              <span>−{fmt(discount)}</span>
            </summary>
            {q.discounts.map((d) => (
              <div key={d.label} className="sum-row">
                <span>{d.label}</span>
                <span>−{fmt(d.amount)}</span>
              </div>
            ))}
          </details>
        )}

        <div className="sum-row total">
          <span>合計</span>
          <strong>{fmt(q.total)}</strong>
        </div>

        {couponOk ? (
          <div className="coupon-line">
            <span>
              折扣券 {coupon} · {q.coupon?.message}
            </span>
            <button className="link" onClick={closeCoupon}>
              移除
            </button>
          </div>
        ) : entering || couponBad ? (
          <>
            <form
              className="coupon"
              onSubmit={(e) => {
                e.preventDefault();
                const code = draft.trim().toUpperCase();
                if (!code) return;
                setCoupon(code);
                setDraft(code);
                setEntering(false);
              }}
            >
              <input
                autoFocus={entering}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="代碼(試試 DIY500)"
                aria-label="折扣券代碼"
                aria-invalid={couponBad}
              />
              <button type="submit">套用</button>
              <button type="button" className="link" onClick={closeCoupon}>
                取消
              </button>
            </form>
            {couponBad && (
              <p className="coupon-err" role="alert">
                折扣券 {coupon}:{q.coupon?.message}
              </p>
            )}
          </>
        ) : (
          <button className="link coupon-open" onClick={() => setEntering(true)}>
            使用折扣券
          </button>
        )}

        <div className="actions">
          <button className="primary" disabled={q.count === 0} onClick={share}>
            {copied ? '已複製連結' : '分享估價單'}
          </button>
          <button disabled={q.count === 0} onClick={() => window.print()}>
            列印
          </button>
        </div>
      </footer>
    </aside>
  );
}
