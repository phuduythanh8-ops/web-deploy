import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import "../chiquy.css";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Tài khoản thành viên — CHÍ QUY®" },
      { name: "description", content: "Đăng nhập hoặc đăng ký thành viên CHÍ QUY® để đặt mua demo." },
      { property: "og:title", content: "Tài khoản thành viên — CHÍ QUY®" },
      { property: "og:description", content: "Đăng ký thành viên để thêm demo vào giỏ và gửi đặt hàng." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Email không hợp lệ").max(255),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/cart" });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/cart" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return setMsg(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
    setBusy(true);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({
        ...parsed.data,
        options: { emailRedirectTo: window.location.origin + "/cart" },
      });
      setMsg(error ? error.message : "Đã gửi email xác nhận — vui lòng kiểm tra hộp thư để hoàn tất đăng ký.");
    } else {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) setMsg("Sai email hoặc mật khẩu, hoặc tài khoản chưa xác nhận email.");
    }
    setBusy(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r && "error" in r && r.error) setMsg(String(r.error));
  };

  return (
    <div className="cq-root page">
      <nav className="nav">
        <Link className="logo" to="/">CHÍ QUY®</Link>
        <Link to="/">← TRANG CHỦ</Link>
      </nav>
      <main className="panel">
        <span className="kicker">MEMBER</span>
        <h1 className="title">{mode === "in" ? "ĐĂNG NHẬP." : "ĐĂNG KÝ."}</h1>
        <p className="note">Cần tài khoản thành viên để thêm demo vào giỏ hàng và gửi đặt hàng.</p>
        <form onSubmit={submit} className="form">
          <input className="search" type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="search" type="password" placeholder="MẬT KHẨU" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn-cq" disabled={busy}>{mode === "in" ? "ĐĂNG NHẬP" : "TẠO TÀI KHOẢN"}</button>
        </form>
        <button className="filter" onClick={google}>TIẾP TỤC VỚI GOOGLE</button>
        {msg && <p className="note warn">{msg}</p>}
        <button className="link-cq" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
          {mode === "in" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </button>
      </main>
    </div>
  );
}
