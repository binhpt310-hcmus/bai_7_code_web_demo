-- =============================================================================
-- Rang Moc Coffee - Migration 002: chatbot_settings
-- =============================================================================
-- Day la migration RIENG, CHI them bang moi - khong dung lai toan bo
-- supabase/schema.sql (file do se DROP va tao lai TAT CA bang, xoa het don
-- hang/nguoi dung hien co). Paste FILE NAY vao Supabase Dashboard > SQL
-- Editor > New query > Run tren project dang chay, se khong anh huong du
-- lieu hien co (users, categories, menu_items, orders, order_items).
-- =============================================================================

create table if not exists chatbot_settings (
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
comment on table chatbot_settings is 'Cau hinh trung tam cho tro ly AI (mot dong duy nhat). Chua provider_api_key (bi mat) nen KHONG duoc phep co RLS policy cong khai - chi Next.js server (service role key) duoc doc/ghi bang nay.';

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_chatbot_settings_set_updated_at on chatbot_settings;
create trigger trg_chatbot_settings_set_updated_at
  before update on chatbot_settings
  for each row
  execute function set_updated_at();

alter table chatbot_settings enable row level security;
-- Co chu y: KHONG tao policy cho anon/authenticated (bang nay chua API key).
-- Chi Next.js server (service role key trong SUPABASE_SECRET_KEY) doc/ghi duoc.

-- Seed 1 dong cau hinh mac dinh, chi khi bang dang trong (an toan de chay lai
-- nhieu lan - se khong tao dong thu 2 neu ban da tung chay migration nay).
insert into chatbot_settings (
  is_enabled, provider_base_url, provider_api_key, model_id, model_name,
  system_prompt, max_output_tokens, context_window_tokens
)
select
  true, null, null, 'poolside/laguna-s-2.1-free', 'Laguna S 2.1 (Free)',
  'Bạn là trợ lý ảo của quán Rang Mộc Coffee, đóng vai một nhân viên thực thụ: thân thiện, nhiệt tình, xưng "em" và gọi khách là "anh/chị". Nhiệm vụ của bạn: giới thiệu thực đơn, gợi ý món phù hợp theo khẩu vị/thời tiết/nhu cầu, xác nhận một món khách hỏi có đang bán hay không, và tra cứu trạng thái đơn hàng khi khách cung cấp mã đơn hoặc số điện thoại. Chỉ trả lời dựa trên dữ liệu được cung cấp trong ngữ cảnh cuộc trò chuyện, tuyệt đối không bịa đặt món ăn, giá cả hay trạng thái đơn hàng không có trong dữ liệu đó. Nếu không chắc chắn, hãy đề nghị khách liên hệ trực tiếp quán hoặc nhân viên tại quầy.',
  512, 8000
where not exists (select 1 from chatbot_settings);

-- =============================================================================
-- Kiem tra nhanh: select * from chatbot_settings;  -- phai co 1 dong
-- =============================================================================
