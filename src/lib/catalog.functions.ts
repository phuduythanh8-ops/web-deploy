import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getCatalog = createServerFn({ method: 'GET' }).handler(async () => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Không tải được quầy trưng bày.');
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
  const [samples, services] = await Promise.all([
    client.from('samples').select('*').eq('published', true).order('created_at', { ascending: false }),
    client.from('services').select('*').order('slug'),
  ]);
  if (samples.error || services.error) throw new Error('Không tải được quầy trưng bày.');
  const rows = await Promise.all((samples.data ?? []).map(async sample => {
    if (!sample.image_url) return sample;
    const { data } = await client.storage.from('sample-media').createSignedUrl(sample.image_url, 3600);
    return { ...sample, image_url: data?.signedUrl ?? null };
  }));
  return { samples: rows, services: services.data ?? [] };
});

export const checkAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc('claim_designated_admin');
    if (error) throw new Error('Không kiểm tra được quyền quản trị.');
    return Boolean(data);
  });