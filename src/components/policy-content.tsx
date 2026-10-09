export function PolicyContent({ text }: { text: string }) {
  const sections: { title: string; lines: string[] }[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const isHeading = /^\d+\.\s|^[IVX]+\.\s/.test(line) || (line.length > 8 && line === line.toLocaleUpperCase('vi-VN') && !line.startsWith('·'));
    if (isHeading || !sections.length) sections.push({ title: line, lines: [] });
    else sections.at(-1)?.lines.push(line);
  }
  return <div className="policy-content">{sections.map((s, i) => <details key={`${i}-${s.title}`} open={i === 0}><summary>{s.title}</summary><div className="policy-body">{s.lines.map((line, j) => /^\d+\.\d+/.test(line) ? <h3 key={j}>{line}</h3> : <p key={j}>{line}</p>)}</div></details>)}</div>;
}

export function WebsitePricing({ prices }: { prices: { name: string; price: string; description: string; examples?: string }[] }) {
  return <section className="website-pricing" aria-labelledby="website-price-title"><h2 id="website-price-title" className="catalog-subtitle">GIÁ DỊCH VỤ — WEBSITE</h2><div className="pricing-list">{prices.map((p, i) => <article className="pricing-row" key={p.name}><span className="code">0{i + 1}</span><div><h3>{p.name}</h3><p>{p.description}</p>{p.examples && <p className="pricing-examples"><strong>Ví dụ:</strong> {p.examples}</p>}</div><strong className="pricing-amount">{p.price}</strong></article>)}</div><div className="pricing-notes"><h3>Lưu ý</h3><p>Giá trên là phí xây dựng website hoàn chỉnh theo yêu cầu đã thống nhất.</p><p>Website có thể là web tĩnh, web động hoặc kết hợp cả hai. Nếu website có hệ thống quản trị, hệ thống quản trị được bàn giao cùng website.</p><p>Không bàn giao mã nguồn, repository hoặc các tài nguyên phát triển nội bộ. Tên miền, hosting và các dịch vụ bên thứ ba nếu có sẽ được tính riêng.</p><p>Mức giá khách đề xuất mua demo được xem xét riêng, không phải bảng giá xây dựng website này.</p></div></section>;
}