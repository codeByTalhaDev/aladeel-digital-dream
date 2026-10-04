
-- roles
CREATE TYPE public.app_role AS ENUM ('admin','staff','customer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- catalog
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  sku text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description_en text,
  description_ar text,
  price numeric(10,2) NOT NULL,
  compare_at_price numeric(10,2),
  material text,
  color text,
  images text[] NOT NULL DEFAULT '{}',
  stock_status text NOT NULL DEFAULT 'in_stock',
  stock_qty int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number bigint GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  emirate text NOT NULL,
  area text NOT NULL,
  address text NOT NULL,
  landmark text,
  delivery_date date,
  delivery_slot text,
  notes text,
  payment_method text NOT NULL DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'pending',
  subtotal numeric(10,2) NOT NULL,
  vat numeric(10,2) NOT NULL,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders insert" ON public.orders FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "orders read own" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity int NOT NULL,
  line_total numeric(10,2) NOT NULL
);
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- seed
INSERT INTO public.categories (slug, name_en, name_ar, image_url, sort_order) VALUES
 ('sofas','Sofa Sets','أطقم كنب','/images/sofa.jpg',1),
 ('bedroom','Bedroom Sets','غرف نوم','/images/bed.jpg',2),
 ('majlis','Majlis','مجالس','/images/hero-majlis.jpg',3),
 ('dining','Dining','طاولات طعام','/images/sofa.jpg',4),
 ('tv-stands','TV Stands','طاولات تلفزيون','/images/bed.jpg',5),
 ('kitchen','Kitchen','مطابخ','/images/sofa.jpg',6);

INSERT INTO public.products (slug, sku, category_id, name_en, name_ar, description_en, description_ar, price, compare_at_price, material, color, images, stock_status, stock_qty, is_featured)
SELECT * FROM (VALUES
 ('l-shape-beige-sofa','AD-SF-001',(SELECT id FROM public.categories WHERE slug='sofas'),'Almaemura L-Shape Sofa','كنبة الماعمورة زاوية','Spacious L-shape sofa in soft beige fabric with solid wood frame. Assembly included.','كنبة زاوية واسعة بقماش بيج ناعم وهيكل خشب صلب. التركيب مشمول.',4200.00,4900.00,'Fabric','Beige',ARRAY['/images/sofa.jpg'],'in_stock',6,true),
 ('royal-majlis-set','AD-MJ-001',(SELECT id FROM public.categories WHERE slug='majlis'),'Royal Green Majlis Set','طقم مجلس أخضر ملكي','Full majlis seating set in emerald velvet with gold detailing. Made to order in 2-3 weeks.','طقم مجلس كامل بمخمل أخضر وتفاصيل ذهبية. يُصنع حسب الطلب خلال أسبوعين إلى ثلاثة.',12500.00,14000.00,'Velvet','Green',ARRAY['/images/hero-majlis.jpg'],'made_to_order',0,true),
 ('walnut-king-bed','AD-BD-001',(SELECT id FROM public.categories WHERE slug='bedroom'),'Walnut King Bed','سرير كينج جوز','Upholstered king bed with walnut frame and padded headboard.','سرير كينج منجد بهيكل خشب الجوز ولوح رأس مبطن.',3800.00,NULL,'Wood & Fabric','Walnut',ARRAY['/images/bed.jpg'],'in_stock',4,true),
 ('classic-3-seater','AD-SF-002',(SELECT id FROM public.categories WHERE slug='sofas'),'Classic 3-Seater Sofa','كنبة كلاسيك ٣ مقاعد','Comfortable three seater with removable cushions.','كنبة ثلاثة مقاعد مريحة بوسائد قابلة للفك.',2450.00,2800.00,'Fabric','Cream',ARRAY['/images/sofa.jpg'],'in_stock',9,true),
 ('family-dining-table','AD-DN-001',(SELECT id FROM public.categories WHERE slug='dining'),'Family Dining Table (6 Seats)','طاولة طعام عائلية ٦ كراسي','Solid wood dining table with six upholstered chairs.','طاولة طعام من الخشب الصلب مع ستة كراسي منجدة.',5600.00,6200.00,'Wood','Brown',ARRAY['/images/sofa.jpg'],'in_stock',3,false),
 ('modern-tv-stand','AD-TV-001',(SELECT id FROM public.categories WHERE slug='tv-stands'),'Modern TV Stand 200cm','طاولة تلفزيون مودرن ٢٠٠ سم','Wall-length TV unit with storage drawers and LED lighting.','وحدة تلفزيون بطول الجدار مع أدراج تخزين وإضاءة.',1650.00,NULL,'MDF','White',ARRAY['/images/bed.jpg'],'in_stock',12,false),
 ('bedroom-package','AD-PK-001',(SELECT id FROM public.categories WHERE slug='bedroom'),'Complete Bedroom Package','باكج غرفة نوم كاملة','Bed, two side tables, dresser with mirror and wardrobe — one bundle price.','سرير، كومدينتان، تسريحة بمرآة ودولاب — بسعر باكج واحد.',9900.00,11500.00,'Wood','Walnut',ARRAY['/images/bed.jpg'],'made_to_order',0,true),
 ('custom-kitchen','AD-KT-001',(SELECT id FROM public.categories WHERE slug='kitchen'),'Custom Fitted Kitchen','مطبخ تفصيل','Made-to-measure kitchen cabinets. Free site measurement in Ras Al Khaimah.','خزائن مطبخ حسب المقاس. قياس مجاني في رأس الخيمة.',15000.00,NULL,'MDF','Grey',ARRAY['/images/sofa.jpg'],'made_to_order',0,false)
) AS t;
