import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { catalogOptions, pageHead } from '@/lib/catalog';
import { CatalogView, CatalogNav, CatalogError } from '@/components/catalog-view';
import { PolicyContent } from '@/components/policy-content';
import demoPolicy from '@/content/demo-policy.txt?raw';
import '../chiquy.css';
export const Route = createFileRoute('/samples')({
  head: () => pageHead('Quầy trưng bày', 'Toàn bộ demo website, video và sự kiện của Chí Quy, Chánh Trì, Phong Hưởng.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  errorComponent: CatalogError, notFoundComponent: CatalogError,
  component: SamplesPage,
});
function SamplesPage() {
  const { data } = useSuspenseQuery(catalogOptions);
  return <div className="cq-root page"><CatalogNav/><main className="catalog-page"><span className="kicker">SAMPLE ARCHIVE</span><h1 className="catalog-title">QUẦY TRƯNG BÀY.</h1><CatalogView samples={data.samples}/><section className="policy-band"><h2>QUY ĐỊNH ĐẶT MUA VÀ PHÁT TRIỂN DEMO</h2><PolicyContent text={demoPolicy}/></section></main></div>;
}