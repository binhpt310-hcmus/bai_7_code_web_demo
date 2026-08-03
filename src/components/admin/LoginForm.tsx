"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const denied = searchParams.get("denied") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Đăng nhập thất bại.");
        setLoading(false);
        return;
      }
      const next = searchParams.get("next") || "/admin/orders";
      router.push(next);
      router.refresh();
    } catch {
      setError("Không thể kết nối máy chủ.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-surface p-6 shadow-soft-lg"
    >
      {denied && (
        <p className="rounded-lg bg-warning-bg px-3.5 py-2.5 text-sm text-warning">
          Tài khoản của bạn không có quyền truy cập trang đó.
        </p>
      )}
      <TextField
        label="Tài khoản (email/số điện thoại)"
        id="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
      />
      <TextField
        label="Mật khẩu"
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
      <div className="rounded-lg bg-bg px-3.5 py-3 text-xs leading-relaxed text-muted">
        <p className="font-medium text-ink">Tài khoản demo</p>
        <p>Chủ quán: owner@quan.cf / owner123</p>
        <p>Nhân viên: thao@quan.cf / staff123</p>
      </div>
    </form>
  );
}
