import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CatalogNav, CatalogError } from '@/components/catalog-view';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { checkAdmin } from '@/lib/catalog.functions';
import { orderStatuses, pageHead } from '@/lib/catalog';
import { servicePolicy } from '@/lib/service-content';
import '../../chiquy.css';

const adminOptions = queryOptions({ queryKey: ['admin-content'], queryFn: async () => {
  const [orders, samples, services] = await Promise.all([
    supabase.from('demo_requests').select('*').eq('status','submitted').order('submitted_at', { ascending: false }),
    supabase.from('samples').select('*').order('created_at', { ascending: false }),
    supabase.from('services').select('*').order('slug'),
  ]);
  if (orders.error || samples.error || services.error) throw new Error('Không tải được dữ liệu quản lý.');
  return { orders: orders.data ?? [], samples: samples.data ?? [], services: services.data ?? [] };
} });
export const Route = createFileRoute('/_authenticated/admin')({
  head: () => pageHead('Quản lý Chí Quy', 'Quản lý đơn đặt demo, sản phẩm trưng bày và quy định dịch vụ.'),
  loader: async ({ context }) => {
    const allowed = await checkAdmin();
    if (allowed) await context.queryClient.ensureQueryData(adminOptions);
    return allowed;
  },
  errorComponent: CatalogError, notFoundComponent: CatalogError,
  component: AdminPage,
});
function AdminPage() {
  const allowed = Route.useLoaderData();
  return <div className="cq-root page"><CatalogNav/><main className="catalog-page"><span className="kicker">CHÍ QUY / MANAGEMENT</span><h1 className="catalog-title">QUẢN LÝ.</h1>{allowed ? <AdminContent/> : <p className="note">Tài khoản này không có quyền quản trị. Vui lòng đăng nhập bằng Google với tài khoản quản trị đã chỉ định.</p>}</main></div>;
}
function AdminContent() {
  const { data } = useSuspenseQuery(adminOptions);
  const qc = useQueryClient();
  const [tab, setTab] = useState('orders');
  const [editing, setEditing] = useState<Tables<'samples'> | null | undefined>();
  const [message, setMessage] = useState('');
  const refresh = async () => { await Promise.all([qc.invalidateQueries({ queryKey: ['admin-content'] }), qc.invalidateQueries({ queryKey: ['catalog'] })]); };
  return <><div className="filters admin-tabs">{[['orders','ĐƠN ĐẶT DEMO'],['samples','SẢN PHẨM MẪU'],['policies','QUY ĐỊNH']].map(([id,label]) => <Button key={id} variant="ghost" className={`filter ${tab === id ? 'active' : ''}`} onClick={() => { setTab(id ?? 'orders'); setEditing(undefined); }}>{label}</Button>)}</div><p role="status" className="note">{message}</p>
    {tab === 'orders' && <><p className="note">{data.orders.length} đơn đã nhận</p><div className="cart-list">{data.orders.map(order => <OrderEditor key={order.id} order={order} onSaved={refresh}/>)}{!data.orders.length && <p className="noresult">CHƯA CÓ ĐƠN ĐẶT DEMO.</p>}</div></>}
    {tab === 'samples' && <><Button className="btn-cq" onClick={() => setEditing(null)}>+ ĐĂNG DEMO</Button>{editing !== undefined && <SampleEditor key={editing?.id ?? 'new'} sample={editing} onCancel={() => setEditing(undefined)} onSaved={async () => { setEditing(undefined); setMessage('Đã lưu sản phẩm.'); await refresh(); }}/>}<div className="management-list">{data.samples.map(s => <div className="management-row" key={s.id}><div><span className="code">{s.code} · {s.service.toUpperCase()}</span><h3>{s.name}</h3><span className="note">{s.availability === 'slot_out' ? 'Slot out' : 'Chưa thuộc quyền sở hữu'} · {s.published ? 'Đang trưng bày' : 'Bản nháp'}</span></div><Button variant="ghost" className="filter" onClick={() => setEditing(s)}>CHỈNH SỬA</Button></div>)}</div></>}
    {tab === 'policies' && data.services.map(s => <PolicyEditor key={s.slug} service={s} onSaved={refresh}/>)}
  </>;
}
function OrderEditor({ order, onSaved }: { order: Tables<'demo_requests'>; onSaved: () => Promise<void> }) {
  const [status,setStatus] = useState(order.processing_status);
  const [notes,setNotes] = useState(order.admin_notes);
  const [busy,setBusy] = useState(false);
  const [msg,setMsg] = useState('');
  const save = async () => { setBusy(true); const { error } = await supabase.from('demo_requests').update({ processing_status:status, admin_notes:notes }).eq('id',order.id); setBusy(false); setMsg(error ? 'Chưa lưu được.' : 'Đã lưu trạng thái.'); if (!error) await onSaved(); };
  return <article className="cart-item"><div className="cart-head"><div><span className="code">{order.sample_code}</span><h3>{order.sample_name}</h3></div><strong>{order.offer_price?.toLocaleString('vi-VN')} ₫</strong></div><p className="note">{order.submitted_at ? new Date(order.submitted_at).toLocaleString('vi-VN') : ''}</p><a className="contact-link" href={order.facebook_url ?? undefined} target="_blank" rel="noreferrer">{order.facebook_url}</a><a href={`mailto:${order.contact_email}`}>{order.contact_email}</a><label>Trạng thái xử lý<select className="search" value={status} onChange={e => setStatus(e.target.value)}>{Object.entries(orderStatuses).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label><label>Ghi chú nội bộ<textarea className="search" value={notes} onChange={e => setNotes(e.target.value)}/></label><Button className="btn-cq" disabled={busy} onClick={save}>{busy ? 'ĐANG LƯU…' : 'LƯU TRẠNG THÁI'}</Button><p role="status" className="note">{msg}</p></article>;
}
function SampleEditor({ sample, onCancel, onSaved }: { sample: Tables<'samples'> | null; onCancel: () => void; onSaved: () => Promise<void> }) {
  const [busy,setBusy] = useState(false);
  const [msg,setMsg] = useState('');
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMsg('');
    const form = new FormData(event.currentTarget);
    let image = sample?.image_url ?? null;
    try {
      const file = form.get('image');
      if (file instanceof File && file.size) {
        if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10*1024*1024) throw new Error('Ảnh cần là JPG, PNG hoặc WebP, tối đa 10 MB.');
        const path = `${crypto.randomUUID()}.${file.type.split('/')[1]}`;
        const upload = await supabase.storage.from('sample-media').upload(path,file,{ contentType:file.type });
        if (upload.error) throw new Error('Không tải được ảnh.');
        image = path;
      }
      const service = String(form.get('service'));
      const split = (name: string) => String(form.get(name) ?? '').split(',').map(s => s.trim()).filter(Boolean);
      const row = { code:String(form.get('code')).trim(), name:String(form.get('name')).trim(), service, description:String(form.get('description') ?? ''), styles:split('styles'), tags:[service,...split('tags')], image_url:image, availability:String(form.get('availability')), published:form.get('published') === 'on', visual_class:String(form.get('visual_class')) };
      const { error } = sample ? await supabase.from('samples').update(row).eq('id',sample.id) : await supabase.from('samples').insert(row);
      if (error) throw new Error('Không lưu được; kiểm tra mã demo không bị trùng.');
      await onSaved();
    } catch (error) { setMsg(error instanceof Error ? error.message : 'Chưa lưu được demo.'); }
    finally { setBusy(false); }
  };
  return <form className="editor-form" onSubmit={save}><h2>{sample ? 'CHỈNH SỬA DEMO' : 'DEMO MỚI'}</h2><div className="editor-grid"><label>Mã demo<input className="search" name="code" required maxLength={60} defaultValue={sample?.code}/></label><label>Tên demo<input className="search" name="name" required maxLength={150} defaultValue={sample?.name}/></label><label>Dịch vụ<select className="search" name="service" defaultValue={sample?.service ?? 'web'}><option value="web">CHÍ QUY (WEBSITE)</option><option value="video">CHÁNH TRÌ (VIDEO)</option><option value="event">PHONG HƯỞNG (EVENT)</option></select></label><label>Trạng thái<select className="search" name="availability" defaultValue={sample?.availability ?? 'available'}><option value="available">Chưa thuộc quyền sở hữu</option><option value="slot_out">Slot out</option></select></label><label>Phong cách (cách nhau bằng dấu phẩy)<input className="search" name="styles" defaultValue={sample?.styles.join(', ')}/></label><label>Tag bổ sung<input className="search" name="tags" defaultValue={sample?.tags.filter(t => t !== sample.service).join(', ')}/></label><label>Ảnh sản phẩm<input name="image" type="file" accept="image/jpeg,image/png,image/webp"/></label><label>Mẫu hình nền<select className="search" name="visual_class" defaultValue={sample?.visual_class ?? 's1'}>{['s1','s2','s3','s4','s5','s6'].map((s,i) => <option key={s} value={s}>Mẫu {i+1}</option>)}</select></label></div><label>Mô tả<textarea className="search" name="description" defaultValue={sample?.description}/></label><label className="check-label"><input type="checkbox" name="published" defaultChecked={sample?.published ?? true}/> Trưng bày công khai</label><div className="filters"><Button className="btn-cq" type="submit" disabled={busy}>{busy ? 'ĐANG LƯU…' : 'LƯU DEMO'}</Button><Button variant="ghost" className="filter" type="button" onClick={onCancel}>HUỶ</Button></div><p className="note" role="status">{msg}</p></form>;
}
function PolicyEditor({ service, onSaved }: { service: Tables<'services'>; onSaved: () => Promise<void> }) {
  const [text,setText] = useState(servicePolicy(service.slug, service.policy));
  const [busy,setBusy] = useState(false);
  const [msg,setMsg] = useState('');
  return <form className="editor-form" onSubmit={async e => { e.preventDefault(); setBusy(true); const { error } = await supabase.from('services').update({ policy:text }).eq('slug',service.slug); setBusy(false); setMsg(error ? 'Chưa lưu được quy định.' : 'Đã cập nhật quy định.'); if (!error) await onSaved(); }}><h2>{service.name} ({service.subtitle})</h2><textarea aria-label={`Quy định ${service.name}`} className="search policy-input" required maxLength={100000} value={text} onChange={e => setText(e.target.value)}/><Button className="btn-cq" disabled={busy}>{busy ? 'ĐANG LƯU…' : 'LƯU QUY ĐỊNH'}</Button><p role="status" className="note">{msg}</p></form>;
}