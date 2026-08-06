import { getChatbotConfig } from "@/lib/repo";
import { ChatbotSettingsClient } from "@/components/admin/ChatbotSettingsClient";

export default async function AdminSettingsPage() {
  try {
    const config = await getChatbotConfig();
    return <ChatbotSettingsClient initialConfig={config} />;
  } catch {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl bg-danger-bg p-6">
          <p className="text-sm font-medium text-danger">Chưa thể tải cấu hình trợ lý AI.</p>
          <p className="mt-1.5 text-sm text-danger/80">
            Bảng <code>chatbot_settings</code> có thể chưa tồn tại trong cơ sở dữ liệu. Hãy chạy
            file <code>supabase/migrations/002_chatbot_settings.sql</code> trong Supabase SQL
            Editor rồi tải lại trang này.
          </p>
        </div>
      </div>
    );
  }
}
