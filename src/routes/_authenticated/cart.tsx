import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import "../../chiquy.css";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Giỏ demo — CHÍ QUY®" },
      { name: "description", content: "Giỏ demo của bạn: điền thông tin, mức giá đề xuất và gửi đặt hàng tới CHÍ QUY®." },
      { property: "og:title", content: "Giỏ demo — CHÍ QUY®" },
      { property: "og:description", content: "Điền thông tin & mức giá mỗi demo rồi gửi đặt hàng." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartPage,
});

type Item = {
  id: string;
  sample_code: string;
  sample_name: string;
  facebook_url: string | null;
  contact_email: string | null;
  offer_price: number | null;
  status: string;
  submitted_at: string | null;
};

const itemSchema = z.object({
  facebook_url: z.string().trim().url("Link Facebook không hợp lệ").max(300)
    .refine((v) => /facebook\.com|fb\.com/i.test(v), "Cần là link tài khoản Facebook"),
  contact_email: z.string().trim().email("Email liên hệ không hợp lệ").max(255),
  offer_price: z.number({ invalid_type_error: "Bắt buộc điền mức giá" }).int().positive("Bắt buộc điền mức giá").max(100_000_000_000),
});

const fmt = (n: number) => n.toLocaleString("vi-VN") + " ₫";

function CartPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("demo_requests").select("*").order("created_at", { ascending: false });
    setItems((data as Item[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const cart = items.filter((i) => i.status === "cart");
  const sent = items.filter((i) => i.status !== "cart");

  const patch = (id: string, p: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const save = (i: Item) =>
    supabase.from("demo_requests").update({
      facebook_url: i.facebook_url, contact_email: i.contact_email, offer_price: i.offer_price,
    }).eq("id", i.id);

  const remove = async (id: string) => {
    await supabase.from("demo_requests").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const submit = async () => {
    setMsg(null);
    const errs: Record<string, string> = {};
    for (const i of cart) {
      const r = itemSchema.safeParse({
        facebook_url: i.facebook_url ?? "", contact_email: i.contact_email ?? "", offer_price: i.offer_price ?? NaN,
      });
      if (!r.success) errs[i.id] = r.error.issues[0]?.message ?? "Thiếu thông tin";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return setMsg("Vui lòng điền đủ thông tin cho mỗi demo trước khi gửi.");
    setBusy(true);
    for (const i of cart) await save(i);
    const now = new Date().toISOString();
    const { error } = await supabase.from("demo_requests")
      .update({ status: "submitted", submitted_at: now })
      .in("id", cart.map((i) => i.id));
    setBusy(false);
    if (error) return setMsg("Gửi không thành công, vui lòng thử lại.");
    setMsg("Đã gửi đặt hàng! CHÍ QUY sẽ phản hồi trong vòng 7 ngày.");
    load();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="cq-root page">
      <nav className="nav">
        <Link className="logo" to="/">CHÍ QUY®</Link>
        <Link to="/" hash="archive">← SAMPLES</Link>
        <button className="link-cq" onClick={signOut}>ĐĂNG XUẤT</button>
      </nav>
      <main className="panel wide">
        <span className="kicker">CART / {user.email}</span>
        <h1 className="title">GIỎ DEMO.</h1>
        <p className="note">
          Mỗi demo bắt buộc điền mức giá — đây là giá bạn đưa ra cho CHÍ QUY để mua demo và phát triển
          thêm theo yêu cầu. Thời gian phản hồi: <b>7 ngày</b>.
        </p>
        <p className="note warn">Lưu ý: các mức giá ghi nhận đều giao dịch bằng phương thức chuyển khoản.</p>

        {loading ? <p className="note">ĐANG TẢI…</p> : cart.length === 0 ? (
          <p className="noresult">GIỎ TRỐNG — <Link to="/" hash="archive">CHỌN DEMO TRONG SAMPLE ARCHIVE</Link></p>
        ) : (
          <div className="cart-list">
            {cart.map((i) => (
              <div key={i.id} className={`cart-item ${errors[i.id] ? "err" : ""}`}>
                <div className="cart-head">
                  <div><div className="code">{i.sample_code}</div><div className="name">{i.sample_name}</div></div>
                  <button className="filter clear" onClick={() => remove(i.id)}>XOÁ ✕</button>
                </div>
                <label>Link account Facebook
                  <input className="search" placeholder="https://facebook.com/..." value={i.facebook_url ?? ""}
                    onChange={(e) => patch(i.id, { facebook_url: e.target.value })} onBlur={() => save(i)} />
                </label>
                <label>Email liên hệ
                  <input className="search" type="email" placeholder="ban@email.com" value={i.contact_email ?? ""}
                    onChange={(e) => patch(i.id, { contact_email: e.target.value })} onBlur={() => save(i)} />
                </label>
                <label>Mức giá đưa ra cho demo (VNĐ) *
                  <input className="search" inputMode="numeric" placeholder="VD: 5.000.000"
                    value={i.offer_price ? i.offer_price.toLocaleString("vi-VN") : ""}
                    onChange={(e) => {
                      const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                      patch(i.id, { offer_price: Number.isFinite(n) ? n : null });
                    }} onBlur={() => save(i)} />
                </label>
                {errors[i.id] && <p className="note warn">{errors[i.id]}</p>}
              </div>
            ))}
            <div className="cart-total">
              TỔNG ĐỀ XUẤT: {fmt(cart.reduce((s, i) => s + (i.offer_price ?? 0), 0))}
              <button className="btn-cq" onClick={submit} disabled={busy}>{busy ? "ĐANG GỬI…" : "GỬI ĐẶT HÀNG"}</button>
            </div>
          </div>
        )}
        {msg && <p className="note warn">{msg}</p>}

        {sent.length > 0 && (
          <>
            <h2 className="kicker" style={{ marginTop: 48 }}>ĐÃ GỬI</h2>
            <div className="cart-list">
              {sent.map((i) => (
                <div key={i.id} className="cart-item sent">
                  <div className="cart-head">
                    <div><div className="code">{i.sample_code}</div><div className="name">{i.sample_name}</div></div>
                    <div className="code">{i.offer_price ? fmt(i.offer_price) : ""}</div>
                  </div>
                  <p className="note">Gửi lúc {i.submitted_at ? new Date(i.submitted_at).toLocaleString("vi-VN") : ""} · chờ phản hồi trong 7 ngày</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
