import { queryOptions } from '@tanstack/react-query';
import { getCatalog } from './catalog.functions';

export const catalogOptions = queryOptions({ queryKey: ['catalog'], queryFn: () => getCatalog(), staleTime: 30_000 });
export const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
export const orderStatuses: Record<string, string> = { received: 'Đã Nhận Được Thông Tin — Chờ Phản Hồi Sau 7 Ngày', processing: 'Đang xử lý', completed: 'Hoàn tất', rejected: 'Không tiếp nhận' };
export const pageHead = (title: string, description: string) => ({ meta: [
  { title: `${title} — CHÍ QUY®` }, { name: 'description', content: description },
  { property: 'og:title', content: `${title} — CHÍ QUY®` }, { property: 'og:description', content: description },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
] });