import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useSession, addToCart } from '@/lib/cart';
import { normalize } from '@/lib/catalog';
import type { Tables } from '@/integrations/supabase/types';

export function CatalogNav() {
  const { session } = useSession();
  return <nav className="nav"><Link className="logo" to="/">CHÍ QUY®</Link><Link to="/samples">SAMPLES</Link><Link to={session ? '/cart' : '/auth'}>{session ? 'GIỎ DEMO' : 'ĐĂNG NHẬP'}</Link>{session && <Link to="/admin">QUẢN LÝ</Link>}</nav>;
}

export function CatalogView({ samples, service }: { samples: Tables<'samples'>[]; service?: string }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [tags, setTags] = useState<string[]>([]);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const { session } = useSession();
  const navigate = useNavigate();
  const choices = [...new Set(samples.flatMap(s => s.styles))];
  const visible = samples.filter(s => (!service || s.service === service) && (category === 'all' || s.service === category) && tags.every(t => s.styles.includes(t)) && normalize(`${s.name} ${s.code} ${s.tags.join(' ')} ${s.styles.join(' ')}`).includes(normalize(query.trim())));
  const add = async (s: Tables<'samples'>) => {
    if (!session) return void navigate({ to: '/auth' });
    setMessages(p => ({ ...p, [s.id]: 'ĐANG THÊM…' }));
    try { const result = await addToCart(session.user.id, s.code, s.name); setMessages(p => ({ ...p, [s.id]: result === 'added' ? '✓ ĐÃ THÊM' : '✓ ĐÃ CÓ TRONG GIỎ' })); }
    catch { setMessages(p => ({ ...p, [s.id]: 'KHÔNG THỂ THÊM — THỬ LẠI' })); }
  };
  return <>
    <div className="searchbar"><input className="search" type="search" aria-label="Tìm sample theo tên hoặc mã số" placeholder="TÌM TÊN / MÃ SỐ" value={query} onChange={e => setQuery(e.target.value)} /><Button variant="ghost" className="filter" onClick={() => { setQuery(''); setTags([]); setCategory('all'); }}>XOÁ ✕</Button></div>
    {!service && <div className="filters">{['all','web','video','event'].map(t => <Button key={t} variant="ghost" className={`filter ${category === t ? 'active' : ''}`} aria-pressed={category === t} onClick={() => setCategory(t)}>{t === 'all' ? 'TẤT CẢ' : t.toUpperCase()}</Button>)}</div>}
    <div className="filters">{choices.map(t => <Button key={t} variant="ghost" className={`filter style ${tags.includes(t) ? 'active' : ''}`} aria-pressed={tags.includes(t)} onClick={() => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p,t])}>{t.toUpperCase()}</Button>)}</div>
    <div className="catalog-grid">{visible.map(s => <article className={`sample ${s.visual_class}`} key={s.id}>
      <div className="vis">{s.image_url && <img src={s.image_url} alt={s.name} loading="lazy" />}</div>
      <div className="meta"><div className="code">{s.code}</div><h3 className="name">{s.name}</h3><div className="tags">{s.styles.map(t => `#${t}`).join(' · ')}</div><p className="note">{s.description}</p><p className={`availability ${s.availability === 'slot_out' ? 'sold' : ''}`}>{s.availability === 'slot_out' ? 'Slot out' : 'Chưa thuộc quyền sở hữu'}</p><Button variant="ghost" className="addcart" disabled={s.availability === 'slot_out' || messages[s.id] === 'ĐANG THÊM…'} onClick={() => add(s)}>{s.availability === 'slot_out' ? 'SLOT OUT' : messages[s.id] ?? '+ THÊM VÀO GIỎ'}</Button></div>
    </article>)}</div>{!visible.length && <p className="noresult">KHÔNG THẤY SAMPLE NÀO KHỚP.</p>}
  </>;
}

export function CatalogError() { return <div className="cq-root page"><CatalogNav/><main className="panel"><h1>Không tải được nội dung.</h1><Button className="btn-cq" onClick={() => window.location.reload()}>Thử lại</Button></main></div>; }