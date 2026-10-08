CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id,role));
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
CREATE FUNCTION public.claim_designated_admin() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF auth.uid() IS NULL THEN RETURN false; END IF;
IF EXISTS (SELECT 1 FROM auth.identities WHERE user_id=auth.uid() AND provider='google' AND lower(identity_data->>'email')='bienthuachi@gmail.com' AND (identity_data->>'email_verified')='true') THEN
INSERT INTO public.user_roles(user_id,role) VALUES(auth.uid(),'admin') ON CONFLICT DO NOTHING;
END IF;
RETURN public.has_role(auth.uid(),'admin'); END $$;
REVOKE ALL ON FUNCTION public.claim_designated_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_designated_admin() TO authenticated;
CREATE TABLE public.services (slug text PRIMARY KEY, name text NOT NULL, subtitle text NOT NULL, leads text NOT NULL, policy text NOT NULL);
GRANT SELECT ON public.services TO anon,authenticated;
GRANT UPDATE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public service read" ON public.services FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY "Admin service update" ON public.services FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
INSERT INTO public.services VALUES
('web','CHÍ QUY','WEBSITE','Nghiên Tân, Biện Thừa Chí','Khách vui lòng cung cấp mục tiêu website, nội dung và những chức năng cần phát triển từ demo. Mức giá đề xuất là cơ sở để hai bên trao đổi, chưa phải xác nhận mua hoặc chuyển giao quyền sở hữu. Chí Quy phản hồi trong vòng 7 ngày và thống nhất phạm vi, tiến độ cùng quyền sử dụng trước khi thực hiện. Thanh toán bằng chuyển khoản theo thỏa thuận đã được xác nhận.'),
('video','CHÁNH TRÌ','VIDEO','Kinh Trung','Khách vui lòng mô tả mục đích video, thời lượng và phong cách mong muốn khi chọn demo. Mức giá đề xuất là cơ sở trao đổi; số lần chỉnh sửa và nội dung bàn giao sẽ được thống nhất trước khi thực hiện. Chánh Trì phản hồi trong vòng 7 ngày; quyền sử dụng hình ảnh, âm nhạc và file nguồn được xác nhận theo từng đơn. Thanh toán bằng chuyển khoản theo thỏa thuận giữa hai bên.'),
('event','PHONG HƯỞNG','EVENT','Nghiêm Hoằng Chương','Khách vui lòng cung cấp loại sự kiện, địa điểm dự kiến và các yêu cầu triển khai từ mẫu đã chọn. Mức giá đề xuất chưa bao gồm cam kết về phạm vi thực hiện hay quyền sở hữu demo. Phong Hưởng phản hồi trong vòng 7 ngày và thống nhất kế hoạch, chi phí cùng trách nhiệm của các bên trước khi triển khai. Thanh toán bằng chuyển khoản theo thỏa thuận được xác nhận.');
CREATE TABLE public.samples (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, service text NOT NULL REFERENCES public.services(slug), tags text[] NOT NULL DEFAULT '{}', styles text[] NOT NULL DEFAULT '{}', visual_class text NOT NULL DEFAULT 's1', image_url text, description text NOT NULL DEFAULT '', availability text NOT NULL DEFAULT 'available' CHECK(availability IN ('available','slot_out')), published boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.samples TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.samples TO authenticated;
GRANT ALL ON public.samples TO service_role;
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published samples read" ON public.samples FOR SELECT TO anon,authenticated USING(published);
CREATE POLICY "Admin samples all" ON public.samples FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
INSERT INTO public.samples(code,name,service,tags,styles,visual_class) VALUES
('CQ-W-026','Sculpture / Web','web',ARRAY['web','3d','brand'],ARRAY['hiện đại','tương lai'],'s1'),
('CQ-V-019','Afterimage','video',ARRAY['video','motion','brand'],ARRAY['đường phố','hiện đại'],'s2'),
('CQ-E-008','Night Market','event',ARRAY['event','brand'],ARRAY['đường phố'],'s3'),
('CQ-W-031','Heritage House','web',ARRAY['web','brand'],ARRAY['cổ điển','tối giản'],'s4'),
('CQ-V-024','Neon Drift','video',ARRAY['video','motion'],ARRAY['tương lai','tối giản'],'s5'),
('CQ-E-012','Lantern Gala','event',ARRAY['event','3d'],ARRAY['cổ điển','hiện đại'],'s6');
ALTER TABLE public.demo_requests ADD COLUMN processing_status text NOT NULL DEFAULT 'received' CHECK(processing_status IN ('received','processing','completed','rejected'));
ALTER TABLE public.demo_requests ADD COLUMN admin_notes text NOT NULL DEFAULT '';
GRANT SELECT,INSERT,UPDATE,DELETE ON public.demo_requests TO authenticated;
GRANT ALL ON public.demo_requests TO service_role;
CREATE POLICY "Admin submitted read" ON public.demo_requests FOR SELECT TO authenticated USING(status='submitted' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin submitted update" ON public.demo_requests FOR UPDATE TO authenticated USING(status='submitted' AND public.has_role(auth.uid(),'admin')) WITH CHECK(status='submitted' AND public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.validate_demo_request() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF NEW.status NOT IN ('cart','submitted') THEN RAISE EXCEPTION 'Invalid order state'; END IF;
IF NEW.status='submitted' AND (NEW.offer_price IS NULL OR NEW.offer_price<=0 OR NEW.offer_price>100000000000 OR NEW.facebook_url IS NULL OR NEW.facebook_url !~* '^https?://([a-z0-9-]+\.)?(facebook\.com|fb\.com)(/|$)' OR NEW.contact_email IS NULL OR NEW.contact_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR NEW.submitted_at IS NULL) THEN RAISE EXCEPTION 'Complete order information required'; END IF;
IF TG_OP='UPDATE' AND NOT public.has_role(auth.uid(),'admin') AND (NEW.processing_status IS DISTINCT FROM OLD.processing_status OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN RAISE EXCEPTION 'Admin fields are protected'; END IF;
IF TG_OP='INSERT' AND (NEW.processing_status<>'received' OR NEW.admin_notes<>'') THEN RAISE EXCEPTION 'Invalid initial order'; END IF;
IF NEW.status='cart' AND NOT EXISTS(SELECT 1 FROM public.samples WHERE code=NEW.sample_code AND published AND availability='available') THEN RAISE EXCEPTION 'Demo unavailable'; END IF;
IF TG_OP='UPDATE' AND OLD.status='cart' AND NEW.status='submitted' AND NOT EXISTS(SELECT 1 FROM public.samples WHERE code=NEW.sample_code AND published AND availability='available') THEN RAISE EXCEPTION 'Demo unavailable'; END IF;
RETURN NEW; END $$;
CREATE TRIGGER validate_demo_request BEFORE INSERT OR UPDATE ON public.demo_requests FOR EACH ROW EXECUTE FUNCTION public.validate_demo_request();