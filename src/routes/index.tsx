import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import "../chiquy.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CHÍ QUY® — Creative Department" },
      {
        name: "description",
        content:
          "CHÍ QUY® — Creative Department: website, video & trải nghiệm sự kiện tại HCMC.",
      },
      { property: "og:title", content: "CHÍ QUY® — Creative Department" },
      {
        property: "og:description",
        content:
          "Creative department làm website, video & trải nghiệm sự kiện — HCMC, Vietnam.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FILTERS = ["all", "web", "video", "event", "3d", "motion", "brand"];

const SAMPLES = [
  {
    cls: "s1",
    tags: "web 3d brand",
    code: "CQ-W-026",
    name: "Sculpture / Web",
    label: "#WEB #3D #BRAND",
  },
  {
    cls: "s2",
    tags: "video motion brand",
    code: "CQ-V-019",
    name: "Afterimage",
    label: "#VIDEO #MOTION #BRAND",
  },
  {
    cls: "s3",
    tags: "event brand",
    code: "CQ-E-008",
    name: "Night Market",
    label: "#EVENT #BRAND",
  },
];

const FRAG = `precision mediump float;uniform vec2 r,m;uniform float t;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.;a*=.5;}return v;}
void main(){vec2 u=gl_FragCoord.xy/r;float k=r.x/r.y;vec2 p=u*vec2(k,1.)*2.5,mm=m*vec2(k,1.)*2.5;float d=distance(p,mm);
p+=normalize(p-mm+.001)*.5*exp(-d*1.6);
float q=fbm(p+t*.08),w=fbm(p+3.*q+vec2(t*.12,-t*.09));
vec3 c=mix(vec3(.035,.035,.06),vec3(.94,.24,.18),smoothstep(.35,.85,w));
c=mix(c,vec3(.19,.34,1.),smoothstep(.35,.9,q)*.85);
c=mix(c,vec3(.45,.34,.91),smoothstep(.5,.2,w)*.5);
c=mix(c,vec3(.85,.95,.29),smoothstep(.7,1.,w*q*2.2));
c+=vec3(.94,.46,.66)*exp(-d*2.)*.35;gl_FragColor=vec4(c*.85,1.);}`;

const VERT =
  "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

function Index() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Reveal on scroll
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.1 }
    );
    root.querySelectorAll(".rv").forEach((el) => io.observe(el));

    // Hero kinetic type
    const hs = root.querySelectorAll<HTMLElement>(".hero h1 span");
    const onScroll = () => {
      const y = window.scrollY;
      hs.forEach((s) => {
        s.style.transform = `translateX(${y * parseFloat(s.dataset["s"] || "0") * 3}px)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Pointer / touch glow
    let mx = 0.5,
      my = 0.5,
      tx = 0.5,
      ty = 0.5,
      lastMove = 0;
    const glow = glowRef.current;
    const setTarget = (x: number, y: number) => {
      tx = x / window.innerWidth;
      ty = 1 - y / window.innerHeight;
      lastMove = performance.now();
      if (glow) glow.style.transform = `translate(${x}px,${y}px)`;
    };
    const onPointer = (e: PointerEvent) => setTarget(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setTarget(t.clientX, t.clientY);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    // Magnetic CTA
    const cta = ctaRef.current;
    const hoverOk = window.matchMedia("(hover:hover)").matches;
    const onCtaMove = (e: MouseEvent) => {
      if (!cta) return;
      const r = cta.getBoundingClientRect();
      cta.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    };
    const onCtaLeave = () => {
      if (cta) cta.style.transform = "";
    };
    if (hoverOk && cta) {
      cta.addEventListener("mousemove", onCtaMove);
      cta.addEventListener("mouseleave", onCtaLeave);
    }

    // Service cards: cursor/touch spotlight + slight tilt
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".card"));
    const cardHandlers = cards.map((card) => {
      const move = (x: number, y: number) => {
        const r = card.getBoundingClientRect();
        const px = x - r.left,
          py = y - r.top;
        card.style.setProperty("--mx", `${px}px`);
        card.style.setProperty("--my", `${py}px`);
        if (hoverOk) {
          const rx = ((py / r.height) - 0.5) * -4;
          const ry = ((px / r.width) - 0.5) * 4;
          card.style.transform = `translateZ(0) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        }
      };
      const onMove = (e: PointerEvent) => move(e.clientX, e.clientY);
      const onTouchMove = (e: TouchEvent) => {
        const t = e.touches[0];
        if (t) move(t.clientX, t.clientY);
      };
      const onEnter = () => card.classList.add("touch");
      const onLeave = () => {
        card.classList.remove("touch");
        card.style.transform = "translateZ(0)";
      };
      card.addEventListener("pointermove", onMove, { passive: true });
      card.addEventListener("touchmove", onTouchMove, { passive: true });
      card.addEventListener("touchstart", onEnter, { passive: true });
      card.addEventListener("pointerleave", onLeave);
      card.addEventListener("touchend", onLeave);
      return { card, onMove, onTouchMove, onEnter, onLeave };
    });

    // WebGL liquid background
    let raf = 0;
    const cv = canvasRef.current;
    const gl = cv?.getContext("webgl");
    let cleanupGl = () => {};
    if (cv && gl) {
      const sh = (t: number, s: string) => {
        const o = gl.createShader(t)!;
        gl.shaderSource(o, s);
        gl.compileShader(o);
        return o;
      };
      const pr = gl.createProgram()!;
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(pr);
      if (gl.getProgramParameter(pr, gl.LINK_STATUS)) {
        gl.useProgram(pr);
        const b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
          gl.STATIC_DRAW
        );
        const a = gl.getAttribLocation(pr, "p");
        gl.enableVertexAttribArray(a);
        gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
        const ur = gl.getUniformLocation(pr, "r");
        const um = gl.getUniformLocation(pr, "m");
        const ut = gl.getUniformLocation(pr, "t");
        const rs = () => {
          cv.width = window.innerWidth * 0.5;
          cv.height = window.innerHeight * 0.5;
          gl.viewport(0, 0, cv.width, cv.height);
        };
        rs();
        window.addEventListener("resize", rs);
        const still = window.matchMedia(
          "(prefers-reduced-motion:reduce)"
        ).matches;
        let hidden = false;
        const onVis = () => {
          hidden = document.hidden;
          if (!hidden && !still) raf = requestAnimationFrame(f);
        };
        document.addEventListener("visibilitychange", onVis);
        const f = (ms: number) => {
          if (hidden) return;
          // Idle drift: when no pointer/touch for 2s (e.g. touch devices),
          // glide the colour field along a gentle lissajous path.
          if (ms - lastMove > 2000) {
            const t = ms / 1000;
            tx = 0.5 + 0.32 * Math.sin(t * 0.35);
            ty = 0.5 + 0.3 * Math.cos(t * 0.27);
          }
          mx += (tx - mx) * 0.06;
          my += (ty - my) * 0.06;
          gl.uniform2f(ur, cv.width, cv.height);
          gl.uniform2f(um, mx, my);
          gl.uniform1f(ut, ms / 1000);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          if (!still) raf = requestAnimationFrame(f);
        };
        raf = requestAnimationFrame(f);
        cleanupGl = () => {
          window.removeEventListener("resize", rs);
          document.removeEventListener("visibilitychange", onVis);
        };
      }
    }

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchmove", onTouch);
      if (cta) {
        cta.removeEventListener("mousemove", onCtaMove);
        cta.removeEventListener("mouseleave", onCtaLeave);
      }
      cardHandlers.forEach(({ card, onMove, onTouchMove, onEnter, onLeave }) => {
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("touchmove", onTouchMove);
        card.removeEventListener("touchstart", onEnter);
        card.removeEventListener("pointerleave", onLeave);
        card.removeEventListener("touchend", onLeave);
      });
      cancelAnimationFrame(raf);
      cleanupGl();
    };
  }, []);

  return (
    <div className="cq-root" ref={rootRef}>
      <canvas id="gl" ref={canvasRef} />
      <div className="glow" ref={glowRef} />
      <nav className="nav">
        <a className="logo" href="#">
          CHÍ QUY®
        </a>
        <a href="#departments">SERVICES</a>
        <a href="#archive">SAMPLES</a>
        <a href="#policy">POLICY</a>
        <a href="#contact">CONTACT</a>
      </nav>

      <header className="hero" id="hero">
        <div>
          <div className="pill mono">
            CREATIVE DEPARTMENT / 2026 — OPEN FOR PROJECTS
          </div>
          <h1>
            <span data-s="-.06">MAKE</span>
            <span data-s=".08" className="o">
              IT
            </span>
            <span data-s="-.03">MOVE.</span>
          </h1>
        </div>
        <div className="hero-foot">
          <p className="hero-copy">
            Một creative department làm <b>website, video &amp; trải nghiệm sự kiện</b>{" "}
            — nhiều màu sắc, nhiều ý tưởng, làm ra thứ có lý do để được nhớ.
          </p>
          <div className="mono">
            WEB / VIDEO / EVENT
            <br />
            HCMC — VIETNAM
            <br />
            KÉO CHUỘT ĐỂ LÀM LOANG MÀU ↓
          </div>
        </div>
      </header>

      <div className="band" aria-hidden="true">
        <div className="track">
          <span>
            CHÍ QUY® ✺ WEB ✺ VIDEO ✺ EVENT ✺ MAKE IT MOVE ✺ CHÍ QUY® ✺ WEB ✺
            VIDEO ✺ EVENT ✺ MAKE IT MOVE ✺{" "}
          </span>
          <span>
            CHÍ QUY® ✺ WEB ✺ VIDEO ✺ EVENT ✺ MAKE IT MOVE ✺ CHÍ QUY® ✺ WEB ✺
            VIDEO ✺ EVENT ✺ MAKE IT MOVE ✺{" "}
          </span>
        </div>
      </div>

      <section className="section" id="departments">
        <div className="head rv">
          <span className="kicker">01 / DEPARTMENTS</span>
          <h2 className="title">
            PICK
            <br />
            YOUR
            <br />
            <span className="o">THING.</span>
          </h2>
        </div>
        <div className="stack">
          <article className="card" style={{ "--i": 0 } as React.CSSProperties}>
            <div className="l">
              <div className="no">
                <span>CQ-W / 001</span>
                <span>↗</span>
              </div>
              <h3>WEB</h3>
            </div>
            <div className="r">
              <p>
                Landing page, business site, portfolio, interactive experience
                &amp; vibe coding.
              </p>
              <div>
                <div className="price">
                  <span>01</span>
                  <strong>Landing Page</strong>
                  <span>from 3.5M</span>
                </div>
                <div className="price">
                  <span>02</span>
                  <strong>Business Web</strong>
                  <span>from 7M</span>
                </div>
                <div className="price">
                  <span>03</span>
                  <strong>Custom Build</strong>
                  <span>quote</span>
                </div>
              </div>
            </div>
          </article>
          <article className="card" style={{ "--i": 1 } as React.CSSProperties}>
            <div className="l">
              <div className="no">
                <span>CQ-V / 001</span>
                <span>↗</span>
              </div>
              <h3>VIDEO</h3>
            </div>
            <div className="r">
              <p>Editing, motion, social content, brand film &amp; event recap.</p>
              <div>
                <div className="price">
                  <span>01</span>
                  <strong>Short Form</strong>
                  <span>from 500K</span>
                </div>
                <div className="price">
                  <span>02</span>
                  <strong>Brand Edit</strong>
                  <span>from 2M</span>
                </div>
                <div className="price">
                  <span>03</span>
                  <strong>Motion</strong>
                  <span>quote</span>
                </div>
              </div>
            </div>
          </article>
          <article className="card" style={{ "--i": 2 } as React.CSSProperties}>
            <div className="l">
              <div className="no">
                <span>CQ-E / 001</span>
                <span>↗</span>
              </div>
              <h3>EVENT</h3>
            </div>
            <div className="r">
              <p>
                Creative concept, visual direction, content &amp; on-ground
                experience.
              </p>
              <div>
                <div className="price">
                  <span>01</span>
                  <strong>Concept</strong>
                  <span>from 5M</span>
                </div>
                <div className="price">
                  <span>02</span>
                  <strong>Visual</strong>
                  <span>from 5M</span>
                </div>
                <div className="price">
                  <span>03</span>
                  <strong>Full Event</strong>
                  <span>quote</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section" id="archive">
        <div className="head rv">
          <span className="kicker">02 / SAMPLE ARCHIVE</span>
          <h2 className="title">
            FIND
            <br />
            <span className="o">SOMETHING.</span>
          </h2>
        </div>
        <div className="filters rv">
          {FILTERS.map((t) => (
            <button
              key={t}
              className={`filter${filter === t ? " active" : ""}`}
              data-tag={t}
              aria-pressed={filter === t}
              onClick={() => setFilter(t)}
            >
              {t === "all" ? "ALL" : `#${t.toUpperCase()}`}
            </button>
          ))}
        </div>
        <div className="rail rv">
          {SAMPLES.map((s) => (
            <article
              key={s.code}
              className={`sample ${s.cls}`}
              data-tags={s.tags}
              hidden={!(filter === "all" || s.tags.split(" ").includes(filter))}
            >
              <div className="vis" />
              <div className="meta">
                <div className="code">{s.code}</div>
                <div className="name">{s.name}</div>
                <div className="tags">{s.label}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="policy">
        <div className="head rv">
          <span className="kicker">03 / POLICY</span>
          <h2 className="title">
            READ
            <br />
            BEFORE
            <br />
            <span className="o">ORDER.</span>
          </h2>
        </div>
        <div className="rv">
          <details open>
            <summary>
              <em>01</em>Timeline
            </summary>
            <p>
              Thời gian thực hiện phụ thuộc scope, số lượng deliverable và mức
              độ custom. Timeline được chốt trước khi bắt đầu.
            </p>
          </details>
          <details>
            <summary>
              <em>02</em>Revision
            </summary>
            <p>
              Mỗi gói có số vòng chỉnh sửa riêng. Các thay đổi ngoài scope sẽ
              được báo lại trước khi thực hiện.
            </p>
          </details>
          <details>
            <summary>
              <em>03</em>Payment
            </summary>
            <p>
              Chi phí và mốc thanh toán được xác nhận trong báo giá / order
              trước khi production.
            </p>
          </details>
          <details>
            <summary>
              <em>04</em>Delivery
            </summary>
            <p>
              File bàn giao, source và quyền sử dụng được quy định theo từng
              dịch vụ.
            </p>
          </details>
        </div>
      </section>

      <section className="section contact" id="contact">
        <div className="kicker" style={{ alignSelf: "flex-start" }}>
          04 / CONTACT &amp; SUPPORT
        </div>
        <h2>
          <span>LET'S</span>
          <span>MAKE</span>
          <span className="o">SOMETHING.</span>
        </h2>
        <div className="row">
          <div className="mono">
            HELLO@CHIQUY.STUDIO
            <br />
            INSTAGRAM / TIKTOK / FACEBOOK
          </div>
          <a className="cta" id="cta" ref={ctaRef} href="mailto:hello@chiquy.studio">
            START A PROJECT ↗
          </a>
        </div>
      </section>
      <footer>
        <span>CHÍ QUY®</span>
        <span>CREATIVE DEPARTMENT — HCMC</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
}
