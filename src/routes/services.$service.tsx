import { createFileRoute, notFound } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { catalogOptions, pageHead } from '@/lib/catalog';
import { CatalogView, CatalogNav, CatalogError } from '@/components/catalog-view';
import '../chiquy.css';
export const Route = createFileRoute('/services/$service')({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(catalogOptions);
    const service = data.services.find(s => s.slug === params.service);
    if (!service) throw notFound();
    return service;
  },
  head: ({ loaderData }) => pageHead(loaderData ? `${loaderData.name} (${loaderData.subtitle})` : 'Dịch vụ', loaderData ? `Phụ trách: ${loaderData.leads}. Quy định và demo ${loaderData.subtitle}.` : 'Dịch vụ sáng tạo CHÍ QUY®.'),
  errorComponent: CatalogError, notFoundComponent: CatalogError,
  component: ServicePage,
});
function ServicePage() {
  const service = Route.useLoaderData();
  const { data } = useSuspenseQuery(catalogOptions);
  return <div className="cq-root page"><CatalogNav/><main className={`catalog-page service-${service.slug}`}><span className="kicker">{service.subtitle}</span><h1 className="catalog-title">{service.name}<small>({service.subtitle})</small></h1><p className="service-leads">Phụ trách: {service.leads}</p><section className="policy-band"><h2>QUY ĐỊNH DỊCH VỤ</h2><p>{service.policy}</p></section><h2 className="catalog-subtitle">DEMO / SẢN PHẨM MẪU</h2><CatalogView samples={data.samples.filter(s => s.service === service.slug)} service={service.slug}/></main></div>;
}