-- =============================================================================
-- Rang Moc Coffee - Supabase schema + seed data
-- =============================================================================
-- Paste toan bo file nay vao Supabase Dashboard > SQL Editor > New query > Run.
--
-- CANH BAO: script nay DROP (xoa) truoc khi tao lai cac bang/enum ben duoi, de
-- co the chay lai an toan nhieu lan tren cung 1 project. Chi chay tren project
-- Supabase MOI hoac project ma ban chac chan khong co du lieu quan trong dang
-- trung ten voi cac bang duoi day (users, categories, menu_items, customers,
-- orders, order_items).
--
-- KIEN TRUC BAO MAT (quan trong, doc truoc khi dung):
-- App hien tai (Next.js) tu quan ly dang nhap/phan quyen o phia server (khong
-- dung Supabase Auth) - dung bcrypt hash luu trong bang `users`. Vi vay:
--   - Trinh duyet (anon key, cong khai) CHI duoc RLS cho phep doc 2 bang khong
--     nhay cam: categories va menu_items (xem thuc don). Duoc dung truc tiep
--     tu client neu muon.
--   - TAT CA phan con lai - tao/tra cuu don hang, xac nhan thanh toan, doi
--     trang thai don, quan ly menu (them/sua/xoa), quan ly nhan vien, bao cao
--     doanh thu - deu KHONG co RLS policy cho anon/authenticated, tuc la RLS
--     se CHAN hoan toan. Cac thao tac nay phai di qua Next.js server (route
--     handler) dung SUPABASE SERVICE ROLE KEY (bo qua RLS, chi ton tai o phia
--     server, khong bao gio gui ve browser) - dung noi da co san logic kiem
--     tra vai tro Owner/Staff va validate du lieu (gia mon, ton kho...) giong
--     cac route /api/... hien tai cua app.
-- Xem chi tiet ly do khong mo RLS cho orders/order_items o Muc 4 ben duoi.
-- Neu sau nay ban muon chuyen sang dung Supabase Auth cho Owner/Staff, day la
-- buoc mo rong rieng (them bang lien ket auth.users, viet lai chinh sach RLS
-- theo auth.uid()) - schema nay chua bao gom phan do.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Cleanup (cho phep chay lai script an toan)
-- -----------------------------------------------------------------------------
drop table if exists chatbot_settings cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists menu_items cascade;
drop table if exists categories cascade;
drop table if exists customers cascade;
drop table if exists users cascade;

drop type if exists order_status cascade;
drop type if exists payment_status cascade;
drop type if exists fulfillment_type cascade;
drop type if exists user_role cascade;
drop type if exists account_status cascade;

-- -----------------------------------------------------------------------------
-- 2. Enum types
-- -----------------------------------------------------------------------------
create type user_role as enum ('owner', 'staff');
create type account_status as enum ('active', 'locked');
create type order_status as enum ('pending', 'preparing', 'ready', 'completed', 'cancelled');
create type payment_status as enum ('unpaid', 'paid');
create type fulfillment_type as enum ('takeaway', 'dine_in');

-- -----------------------------------------------------------------------------
-- 3. Tables
-- -----------------------------------------------------------------------------

-- Chu quan (owner) va nhan vien (staff). KHONG phai Supabase Auth - day la
-- bang ung dung tu quan ly, dung bcrypt hash giong app hien tai.
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null unique,               -- email hoac so dien thoai dung de dang nhap
  password_hash text not null,                  -- bcrypt hash, KHONG luu plaintext
  role user_role not null default 'staff',
  status account_status not null default 'active',
  created_at timestamptz not null default now()
);
comment on table users is 'Tai khoan Owner/Staff dang nhap khu vuc Admin. Khong lien quan Supabase Auth.';

-- Danh muc thuc don.
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0
);

-- Mon trong thuc don.
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  description text not null default '',
  price integer not null check (price > 0),      -- VND, khong co phan le
  image text not null default '',                -- duong dan anh (vd: /menu-images/xxx.jpg)
  available boolean not null default true,
  sort_order int not null default 0
);
create index idx_menu_items_category_id on menu_items(category_id);

-- Khach hang co tai khoan (tuy chon - mo rong cho C7 trong PRD, chua dung o MVP).
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null unique,                  -- email hoac so dien thoai
  password_hash text,
  created_at timestamptz not null default now()
);

-- Don hang.
create table orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                     -- ma don hien thi cho khach (vd: K7M4A)
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  fulfillment_type fulfillment_type not null,
  table_number text,
  status order_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  payment_confirmed_at timestamptz,
  payment_confirmed_by uuid references users(id) on delete set null,
  total_amount integer not null default 0 check (total_amount >= 0),
  note text not null default '',
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_status on orders(status);
create index idx_orders_customer_phone on orders(customer_phone);
create index idx_orders_payment_confirmed_at on orders(payment_confirmed_at);

-- Tu dong cap nhat updated_at moi khi orders thay doi.
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_orders_set_updated_at
  before update on orders
  for each row
  execute function set_updated_at();

-- Chi tiet mon trong 1 don hang. Luu lai ten + gia tai thoi diem dat (snapshot),
-- de menu_items thay doi gia/bi xoa sau nay khong lam sai lich su don cu.
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  name text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  note text not null default ''
);
create index idx_order_items_order_id on order_items(order_id);

-- Cau hinh chatbot AI (mot dong duy nhat, chinh sua o /admin/settings, chi
-- Owner duoc phep). provider_base_url/provider_api_key co the de trong (NULL)
-- de app fallback ve bien moi truong COMMAND_CODE_API_URL/COMMAND_CODE_API_KEY
-- - nghia la Owner khong bat buoc phai nhap lai API key o day, chi dung khi
-- muon doi sang provider/API key khac voi bien moi truong mac dinh.
create table chatbot_settings (
  id uuid primary key default gen_random_uuid(),
  is_enabled boolean not null default true,
  provider_base_url text,
  provider_api_key text,
  model_id text not null default 'poolside/laguna-s-2.1-free',
  model_name text not null default 'Laguna S 2.1 (Free)',
  system_prompt text not null default '',
  max_output_tokens integer not null default 512 check (max_output_tokens > 0),
  context_window_tokens integer not null default 8000 check (context_window_tokens > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references users(id) on delete set null
);
comment on table chatbot_settings is 'Cau hinh trung tam cho tro ly AI (mot dong duy nhat). Chua provider_api_key (bi mat) nen KHONG duoc phep co RLS policy cong khai - chi Next.js server (service role key) duoc doc/ghi bang nay, giong het co che ap dung cho users/orders o Muc 4.';

create trigger trg_chatbot_settings_set_updated_at
  before update on chatbot_settings
  for each row
  execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
-- -----------------------------------------------------------------------------
alter table users enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table chatbot_settings enable row level security;

-- Khach (anon) va nguoi dung web duoc XEM thuc don cong khai - day la du lieu
-- khong nhay cam, an toan de mo public (dung SELECT ... using (true)).
create policy "public can read categories"
  on categories for select
  to anon, authenticated
  using (true);

create policy "public can read menu items"
  on menu_items for select
  to anon, authenticated
  using (true);

-- CO CHU Y: KHONG tao policy cho anon/authenticated tren orders, order_items,
-- users, customers. Ly do:
--   1) Rieng tu: orders chua ten + so dien thoai khach hang. Neu cho anon
--      SELECT truc tiep bang RLS (vd "using (true)"), bat ky ai co anon key
--      cong khai deu co the doc TOAN BO don hang cua moi khach, khong chi don
--      cua ho - ro ri du lieu ca nhan nghiem trong.
--   2) Toan ven du lieu: neu cho anon INSERT truc tiep vao orders, client co
--      the tu gui len mot total_amount gia mao (khong khop gia thuc trong
--      menu_items), lam sai lech bao cao doanh thu.
-- => Moi thao tac voi orders/order_items (tao don, tra cuu don theo ma/so
--    dien thoai, doi trang thai, xac nhan thanh toan) PHAI di qua Next.js
--    server (route handler) dung SUPABASE SERVICE ROLE KEY - noi da co san
--    logic validate gia/ton kho va loc dung don theo ma+so dien thoai, giong
--    het cac route /api/orders va /api/orders/lookup hien tai cua app. Trinh
--    duyet khong bao gio duoc cap service role key.
-- Tuong tu, users/customers khong co policy nao cho anon/authenticated - chi
-- Next.js server (service role) moi doc/ghi duoc, dung y PRD Muc 5 (RBAC) va
-- Muc 8 ("phan quyen phai duoc kiem tra o phia server/database").

-- -----------------------------------------------------------------------------
-- 5. Seed data
-- -----------------------------------------------------------------------------

-- 5.1 Danh muc
insert into categories (name, sort_order) values
  ('Cà phê', 1),
  ('Trà & Đá xay', 2),
  ('Bánh & Ăn nhẹ', 3),
  ('Đồ uống khác', 4);

-- 5.2 Mon trong thuc don
insert into menu_items (category_id, name, description, price, image, available, sort_order)
values
  ((select id from categories where name = 'Cà phê'),
    'Cà phê đen đá', 'Cà phê phin truyền thống, đậm vị, rót đá lạnh.', 29000,
    '/menu-images/ca-phe-den-da.jpg', true, 1),
  ((select id from categories where name = 'Cà phê'),
    'Cà phê sữa đá', 'Cà phê phin pha cùng sữa đặc, béo nhẹ, cân bằng vị đắng.', 32000,
    '/menu-images/ca-phe-sua-da.jpg', true, 2),
  ((select id from categories where name = 'Cà phê'),
    'Bạc xỉu', 'Nhiều sữa hơn cà phê, vị ngọt dịu, dễ uống cả ngày.', 34000,
    '/menu-images/bac-xiu.jpg', true, 3),
  ((select id from categories where name = 'Cà phê'),
    'Cappuccino', 'Espresso kết hợp sữa nóng đánh bông mịn, phủ bọt dày.', 45000,
    '/menu-images/cappuccino.jpg', false, 4),
  ((select id from categories where name = 'Trà & Đá xay'),
    'Trà đào cam sả', 'Trà đen ủ lạnh, đào ngâm, cam tươi và sả thơm nhẹ.', 39000,
    '/menu-images/tra-dao-cam-sa.jpg', true, 1),
  ((select id from categories where name = 'Trà & Đá xay'),
    'Trà vải hồng ngọc', 'Trà ô long, vải ngâm, hạt é, vị thanh mát.', 39000,
    '/menu-images/tra-vai-hong-ngoc.jpg', true, 2),
  ((select id from categories where name = 'Trà & Đá xay'),
    'Matcha đá xay', 'Bột matcha Nhật xay cùng đá và sữa, phủ kem béo.', 49000,
    '/menu-images/matcha-da-xay.jpg', true, 3),
  ((select id from categories where name = 'Trà & Đá xay'),
    'Socola đá xay', 'Socola nguyên chất xay đá, phủ kem tươi và sốt socola.', 49000,
    '/menu-images/socola-da-xay.jpg', true, 4),
  ((select id from categories where name = 'Bánh & Ăn nhẹ'),
    'Bánh croissant bơ', 'Vỏ bánh giòn xốp nhiều lớp, bơ Pháp thơm béo.', 35000,
    '/menu-images/croissant-bo.jpg', true, 1),
  ((select id from categories where name = 'Bánh & Ăn nhẹ'),
    'Bánh mì que pate', 'Bánh mì que giòn rụm kèm pate nhà làm và tương ớt.', 25000,
    '/menu-images/banh-mi-que-pate.jpg', true, 2),
  ((select id from categories where name = 'Bánh & Ăn nhẹ'),
    'Tiramisu ly', 'Tiramisu kiểu Ý, cà phê đậm, phô mai mascarpone mịn.', 42000,
    '/menu-images/tiramisu-ly.jpg', true, 3),
  ((select id from categories where name = 'Đồ uống khác'),
    'Nước ép cam tươi', 'Cam vắt nguyên chất, không thêm đường.', 35000,
    '/menu-images/nuoc-ep-cam.jpg', true, 1),
  ((select id from categories where name = 'Đồ uống khác'),
    'Soda việt quất', 'Soda lạnh vị việt quất chua ngọt, thêm lá bạc hà.', 39000,
    '/menu-images/soda-viet-quat.jpg', true, 2);

-- 5.3 Tai khoan Owner/Staff
-- Mat khau demo (chua hash o day, chi de ban nho khi dang nhap thu):
--   owner@quan.cf  / owner123   (Owner)
--   thao@quan.cf   / staff123   (Staff)
--   huy@quan.cf    / staff123   (Staff)
--   bao@quan.cf    / staff123   (Staff - tai khoan da bi khoa, de demo tinh nang khoa)
insert into users (name, username, password_hash, role, status, created_at) values
  ('Minh Anh', 'owner@quan.cf',
    '$2b$10$RIEPxuB3ncltmTHEwaXNJe08sGrATsceb8kGDu9int3TVgYNp3oT2',
    'owner', 'active', now() - interval '120 days'),
  ('Thảo Nguyên', 'thao@quan.cf',
    '$2b$10$gT4c54R9O9g8NNnFS3L4V.SRxVoRoRa2vvRm/bhvC9vIq7fLlj0cy',
    'staff', 'active', now() - interval '60 days'),
  ('Đức Huy', 'huy@quan.cf',
    '$2b$10$gT4c54R9O9g8NNnFS3L4V.SRxVoRoRa2vvRm/bhvC9vIq7fLlj0cy',
    'staff', 'active', now() - interval '30 days'),
  ('Gia Bảo', 'bao@quan.cf',
    '$2b$10$gT4c54R9O9g8NNnFS3L4V.SRxVoRoRa2vvRm/bhvC9vIq7fLlj0cy',
    'staff', 'locked', now() - interval '90 days');

-- 5.4 Don hang mau (7 don lich su cho bao cao doanh thu + 3 don "hom nay" cho
-- bang dieu khien van hanh, dung logic tinh ngay giong seed cu cua app: luon
-- tinh tuong doi theo thoi diem chay script, khong hardcode ngay co dinh).

-- Don 1: K7M4A - hoan tat, da thanh toan, 6 ngay truoc
insert into orders (code, customer_name, customer_phone, fulfillment_type, table_number,
  status, payment_status, payment_confirmed_by, total_amount, created_at, updated_at, payment_confirmed_at)
values (
  'K7M4A', 'Ngọc Hân', '0901234561', 'takeaway', null,
  'completed', 'paid',
  (select id from users where username = 'thao@quan.cf'),
  32000 * 2 + 35000,
  (current_date - 6) + time '08:15',
  (current_date - 6) + time '08:15' + interval '12 minutes',
  (current_date - 6) + time '08:15' + interval '12 minutes'
);
insert into order_items (order_id, menu_item_id, name, unit_price, quantity, note) values
  ((select id from orders where code = 'K7M4A'),
    (select id from menu_items where name = 'Cà phê sữa đá'), 'Cà phê sữa đá', 32000, 2, ''),
  ((select id from orders where code = 'K7M4A'),
    (select id from menu_items where name = 'Bánh croissant bơ'), 'Bánh croissant bơ', 35000, 1, '');

-- Don 2: P2X8Q - hoan tat, da thanh toan, 5 ngay truoc, dung tai quan ban 5
insert into orders (code, customer_name, customer_phone, fulfillment_type, table_number,
  status, payment_status, payment_confirmed_by, total_amount, created_at, updated_at, payment_confirmed_at)
values (
  'P2X8Q', 'Anh Tuấn', '0901234562', 'dine_in', '5',
  'completed', 'paid',
  (select id from users where username = 'huy@quan.cf'),
  49000 + 42000,
  (current_date - 5) + time '14:40',
  (current_date - 5) + time '14:40' + interval '12 minutes',
  (current_date - 5) + time '14:40' + interval '12 minutes'
);
insert into order_items (order_id, menu_item_id, name, unit_price, quantity, note) values
  ((select id from orders where code = 'P2X8Q'),
    (select id from menu_items where name = 'Matcha đá xay'), 'Matcha đá xay', 49000, 1, ''),
  ((select id from orders where code = 'P2X8Q'),
    (select id from menu_items where name = 'Tiramisu ly'), 'Tiramisu ly', 42000, 1, '');

-- Don 3: T9N3R - hoan tat, da thanh toan, 4 ngay truoc
insert into orders (code, customer_name, customer_phone, fulfillment_type, table_number,
  status, payment_status, payment_confirmed_by, total_amount, created_at, updated_at, payment_confirmed_at)
values (
  'T9N3R', 'Bích Ngọc', '0901234563', 'takeaway', null,
  'completed', 'paid',
  (select id from users where username = 'thao@quan.cf'),
  29000 * 3,
  (current_date - 4) + time '09:05',
  (current_date - 4) + time '09:05' + interval '12 minutes',
  (current_date - 4) + time '09:05' + interval '12 minutes'
);
insert into order_items (order_id, menu_item_id, name, unit_price, quantity, note) values
  ((select id from orders where code = 'T9N3R'),
    (select id from menu_items where name = 'Cà phê đen đá'), 'Cà phê đen đá', 29000, 3, '');

-- Don 4: V4L6D - hoan tat, da thanh toan, 3 ngay truoc, dung tai quan ban 2
insert into orders (code, customer_name, customer_phone, fulfillment_type, table_number,
  status, payment_status, payment_confirmed_by, total_amount, created_at, updated_at, payment_confirmed_at)
values (
  'V4L6D', 'Hữu Phát', '0901234564', 'dine_in', '2',
  'completed', 'paid',
  (select id from users where username = 'huy@quan.cf'),
  39000 * 2 + 25000 * 2,
  (current_date - 3) + time '16:20',
  (current_date - 3) + time '16:20' + interval '12 minutes',
  (current_date - 3) + time '16:20' + interval '12 minutes'
);
insert into order_items (order_id, menu_item_id, name, unit_price, quantity, note) values
  ((select id from orders where code = 'V4L6D'),
    (select id from menu_items where name = 'Trà đào cam sả'), 'Trà đào cam sả', 39000, 2, ''),
  ((select id from orders where code = 'V4L6D'),
    (select id from menu_items where name = 'Bánh mì que pate'), 'Bánh mì que pate', 25000, 2, '');

-- Don 5: Q8J2K - hoan tat, da thanh toan, 2 ngay truoc
insert into orders (code, customer_name, customer_phone, fulfillment_type, table_number,
  status, payment_status, payment_confirmed_by, total_amount, created_at, updated_at, payment_confirmed_at)
values (
  'Q8J2K', 'Thu Trang', '0901234565', 'takeaway', null,
  'completed', 'paid',
  (select id from users where username = 'thao@quan.cf'),
  32000 + 49000 + 35000,
  (current_date - 2) + time '10:50',
  (current_date - 2) + time '10:50' + interval '12 minutes',
  (current_date - 2) + time '10:50' + interval '12 minutes'
);
insert into order_items (order_id, menu_item_id, name, unit_price, quantity, note) values
  ((select id from orders where code = 'Q8J2K'),
    (select id from menu_items where name = 'Cà phê sữa đá'), 'Cà phê sữa đá', 32000, 1, ''),
  ((select id from orders where code = 'Q8J2K'),
    (select id from menu_items where name = 'Socola đá xay'), 'Socola đá xay', 49000, 1, ''),
  ((select id from orders where code = 'Q8J2K'),
    (select id from menu_items where name = 'Bánh croissant bơ'), 'Bánh croissant bơ', 35000, 1, '');

-- Don 6: H3W7Y - hoan tat, da thanh toan, hom qua
insert into orders (code, customer_name, customer_phone, fulfillment_type, table_number,
  status, payment_status, payment_confirmed_by, total_amount, created_at, updated_at, payment_confirmed_at)
values (
  'H3W7Y', 'Việt Anh', '0901234566', 'takeaway', null,
  'completed', 'paid',
  (select id from users where username = 'huy@quan.cf'),
  34000 * 2,
  (current_date - 1) + time '08:30',
  (current_date - 1) + time '08:30' + interval '12 minutes',
  (current_date - 1) + time '08:30' + interval '12 minutes'
);
insert into order_items (order_id, menu_item_id, name, unit_price, quantity, note) values
  ((select id from orders where code = 'H3W7Y'),
    (select id from menu_items where name = 'Bạc xỉu'), 'Bạc xỉu', 34000, 2, '');

-- Don 7: B5F1Z - da huy, chua thanh toan, hom qua, tai quan ban 8
-- (dung de kiem chung cong thuc doanh thu: don huy KHONG duoc tinh vao doanh thu)
insert into orders (code, customer_name, customer_phone, fulfillment_type, table_number,
  status, payment_status, total_amount, cancel_reason, created_at, updated_at)
values (
  'B5F1Z', 'Lan Phương', '0901234567', 'dine_in', '8',
  'cancelled', 'unpaid', 39000,
  'Khách đổi ý, không đến lấy món.',
  (current_date - 1) + time '17:10',
  (current_date - 1) + time '17:10'
);
insert into order_items (order_id, menu_item_id, name, unit_price, quantity, note) values
  ((select id from orders where code = 'B5F1Z'),
    (select id from menu_items where name = 'Trà vải hồng ngọc'), 'Trà vải hồng ngọc', 39000, 1, '');

-- Don 8: R6C9E - hom nay, cho xac nhan, chua thanh toan (dang trong hang doi)
insert into orders (code, customer_name, customer_phone, fulfillment_type, table_number,
  status, payment_status, total_amount, created_at, updated_at)
values (
  'R6C9E', 'Khánh Linh', '0909876541', 'takeaway', null,
  'pending', 'unpaid', 32000 + 35000,
  current_date + time '09:00',
  current_date + time '09:00'
);
insert into order_items (order_id, menu_item_id, name, unit_price, quantity, note) values
  ((select id from orders where code = 'R6C9E'),
    (select id from menu_items where name = 'Cà phê sữa đá'), 'Cà phê sữa đá', 32000, 1, 'Ít đá, ít đường'),
  ((select id from orders where code = 'R6C9E'),
    (select id from menu_items where name = 'Bánh croissant bơ'), 'Bánh croissant bơ', 35000, 1, '');

-- Don 9: M1D5G - hom nay, dang pha che, chua thanh toan, tai quan ban 3
insert into orders (code, customer_name, customer_phone, fulfillment_type, table_number,
  status, payment_status, total_amount, created_at, updated_at)
values (
  'M1D5G', 'Quốc Bảo', '0909876542', 'dine_in', '3',
  'preparing', 'unpaid', 49000 * 2,
  current_date + time '09:12',
  current_date + time '09:12'
);
insert into order_items (order_id, menu_item_id, name, unit_price, quantity, note) values
  ((select id from orders where code = 'M1D5G'),
    (select id from menu_items where name = 'Matcha đá xay'), 'Matcha đá xay', 49000, 2, '');

-- Don 10: S3T8U - hom nay, san sang lay mon, da thanh toan
insert into orders (code, customer_name, customer_phone, fulfillment_type, table_number,
  status, payment_status, payment_confirmed_by, total_amount, created_at, updated_at, payment_confirmed_at)
values (
  'S3T8U', 'Diệu Hiền', '0909876543', 'takeaway', null,
  'ready', 'paid',
  (select id from users where username = 'thao@quan.cf'),
  39000 + 42000,
  current_date + time '09:20',
  current_date + time '09:20' + interval '12 minutes',
  current_date + time '09:20' + interval '12 minutes'
);
insert into order_items (order_id, menu_item_id, name, unit_price, quantity, note) values
  ((select id from orders where code = 'S3T8U'),
    (select id from menu_items where name = 'Trà đào cam sả'), 'Trà đào cam sả', 39000, 1, ''),
  ((select id from orders where code = 'S3T8U'),
    (select id from menu_items where name = 'Tiramisu ly'), 'Tiramisu ly', 42000, 1, '');

-- 5.5 Cau hinh chatbot AI (mot dong duy nhat). provider_base_url/provider_api_key
-- de trong (NULL) - app se fallback ve COMMAND_CODE_API_URL/COMMAND_CODE_API_KEY
-- trong bien moi truong cho toi khi Owner tu cau hinh rieng o /admin/settings.
insert into chatbot_settings (
  is_enabled, provider_base_url, provider_api_key, model_id, model_name,
  system_prompt, max_output_tokens, context_window_tokens
) values (
  true, null, null, 'poolside/laguna-s-2.1-free', 'Laguna S 2.1 (Free)',
  'Bạn là trợ lý ảo của quán Rang Mộc Coffee, đóng vai một nhân viên thực thụ: thân thiện, nhiệt tình, xưng "em" và gọi khách là "anh/chị". Nhiệm vụ của bạn: giới thiệu thực đơn, gợi ý món phù hợp theo khẩu vị/thời tiết/nhu cầu, xác nhận một món khách hỏi có đang bán hay không, và tra cứu trạng thái đơn hàng khi khách cung cấp mã đơn hoặc số điện thoại. Chỉ trả lời dựa trên dữ liệu được cung cấp trong ngữ cảnh cuộc trò chuyện, tuyệt đối không bịa đặt món ăn, giá cả hay trạng thái đơn hàng không có trong dữ liệu đó. Nếu không chắc chắn, hãy đề nghị khách liên hệ trực tiếp quán hoặc nhân viên tại quầy.',
  512, 8000
);

-- =============================================================================
-- Xong. Kiem tra nhanh:
--   select count(*) from categories;        -- 4
--   select count(*) from menu_items;        -- 13
--   select count(*) from users;             -- 4
--   select count(*) from orders;            -- 10
--   select count(*) from order_items;       -- 17
--   select count(*) from chatbot_settings;  -- 1
-- =============================================================================
