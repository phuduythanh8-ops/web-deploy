import { createFileRoute, Link } from '@tanstack/react-router';
import { CatalogNav } from '@/components/catalog-view';
import { PolicyContent } from '@/components/policy-content';
import { pageHead } from '@/lib/catalog';
import generalPolicy from '@/content/general-policy.txt?raw';
import '../chiquy.css';

export const Route = createFileRoute('/policies')({
  head: () => pageHead('Quy định chung', 'Thời gian hoạt động, phạm vi dịch vụ, thanh toán, bàn giao và trách nhiệm của hai bên tại Chí Quy.'),
  component: PoliciesPage,
});
function PoliciesPage() {
  return <div className="cq-root page"><CatalogNav/><main className="catalog-page"><span className="kicker">CHÍ QUY / QUY ĐỊNH</span><h1 className="catalog-title">QUY ĐỊNH CHUNG.</h1><PolicyContent text={generalPolicy}/><div className="policy-links">{[['web', 'CHÍ QUY (WEBSITE)'], ['video', 'CHÁNH TRÌ (VIDEO)'], ['event', 'PHONG HƯỞNG (EVENT)']].map(([service, name]) => <Link key={service} to="/services/$service" params={{ service }} className="catalog-more">{name} ↗</Link>)}<Link to="/samples" className="catalog-more">DEMO / SẢN PHẨM MẪU ↗</Link></div></main></div>;
}