"use client";

import { useState } from "react";
import { EyeIcon, EyeSlashIcon, RobotIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/Field";
import type { ChatbotConfig } from "@/lib/types";

export function ChatbotSettingsClient({ initialConfig }: { initialConfig: ChatbotConfig }) {
  const [form, setForm] = useState({
    isEnabled: initialConfig.isEnabled,
    providerBaseUrl: initialConfig.providerBaseUrl ?? "",
    providerApiKey: initialConfig.providerApiKey ?? "",
    modelId: initialConfig.modelId,
    modelName: initialConfig.modelName,
    systemPrompt: initialConfig.systemPrompt,
    maxOutputTokens: initialConfig.maxOutputTokens,
    contextWindowTokens: initialConfig.contextWindowTokens,
  });
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/chatbot-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.message ?? "Lưu thất bại." });
      } else {
        setMessage({ type: "success", text: "Đã lưu cấu hình trợ lý AI." });
      }
    } catch {
      setMessage({ type: "error", text: "Không thể kết nối máy chủ." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/12 text-accent">
          <RobotIcon size={20} weight="bold" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Trợ lý AI</h1>
          <p className="text-sm text-muted">
            Kết nối provider và tuỳ chỉnh cách chatbot trả lời khách hàng &amp; nhân viên.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl bg-surface p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
          <div>
            <p className="text-sm font-medium text-ink">Bật trợ lý AI</p>
            <p className="text-xs text-muted">Tắt để ẩn hoàn toàn chatbot trên toàn bộ trang web.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.isEnabled}
            onClick={() => setForm((f) => ({ ...f, isEnabled: !f.isEnabled }))}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              form.isEnabled ? "bg-success" : "bg-ink/15"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                form.isEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Base URL của provider"
            id="providerBaseUrl"
            value={form.providerBaseUrl}
            onChange={(e) => setForm((f) => ({ ...f, providerBaseUrl: e.target.value }))}
            placeholder="Để trống để dùng COMMAND_CODE_API_URL mặc định"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="providerApiKey" className="text-sm font-medium text-ink">
              API key
            </label>
            <div className="relative">
              <input
                id="providerApiKey"
                type={showKey ? "text" : "password"}
                value={form.providerApiKey}
                onChange={(e) => setForm((f) => ({ ...f, providerApiKey: e.target.value }))}
                placeholder="Để trống để dùng COMMAND_CODE_API_KEY mặc định"
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 pr-10 text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? "Ẩn API key" : "Hiện API key"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
              >
                {showKey ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>

          <TextField
            label="Tên model"
            id="modelName"
            value={form.modelName}
            onChange={(e) => setForm((f) => ({ ...f, modelName: e.target.value }))}
          />

          <TextField
            label="ID model"
            id="modelId"
            value={form.modelId}
            onChange={(e) => setForm((f) => ({ ...f, modelId: e.target.value }))}
            placeholder="poolside/laguna-s-2.1-free"
          />

          <TextField
            label="Giới hạn token đầu ra"
            id="maxOutputTokens"
            type="number"
            min={16}
            max={8000}
            value={form.maxOutputTokens}
            onChange={(e) =>
              setForm((f) => ({ ...f, maxOutputTokens: Number(e.target.value) }))
            }
            hint="Số token tối đa trong mỗi câu trả lời (16-8000)."
          />

          <TextField
            label="Giới hạn context window (token)"
            id="contextWindowTokens"
            type="number"
            min={500}
            max={200000}
            value={form.contextWindowTokens}
            onChange={(e) =>
              setForm((f) => ({ ...f, contextWindowTokens: Number(e.target.value) }))
            }
            hint="Giới hạn tổng dữ liệu + lịch sử hội thoại gửi cho AI (500-200000)."
          />
        </div>

        <TextAreaField
          label="Chỉ dẫn (instruction prompt) cho chatbot"
          id="systemPrompt"
          value={form.systemPrompt}
          onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
          className="min-h-40"
          hint="Mô tả cách chatbot nên xưng hô và phong cách trả lời khách như một nhân viên thực thụ."
        />

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>
      </div>
    </div>
  );
}
