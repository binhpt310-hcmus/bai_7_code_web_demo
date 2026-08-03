"use client";

import { useState } from "react";
import { KeyIcon, LockIcon, LockOpenIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TextField } from "@/components/ui/Field";
import { formatDateShort } from "@/lib/format";
import type { SafeUser } from "@/lib/types";

export function StaffManagementClient({ initialUsers }: { initialUsers: SafeUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function handleAdd() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Nhập họ tên nhân viên.";
    if (!username.trim()) nextErrors.username = "Nhập email hoặc số điện thoại.";
    if (!password || password.length < 6) nextErrors.password = "Mật khẩu tối thiểu 6 ký tự.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), username: username.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrors({ username: data.message });
      return;
    }
    setUsers((prev) => [...prev, data.user]);
    setName("");
    setUsername("");
    setPassword("");
    setShowAddForm(false);
  }

  async function toggleStatus(user: SafeUser) {
    const nextStatus = user.status === "active" ? "locked" : "active";
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
    await fetch(`/api/admin/staff/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setStatus", status: nextStatus }),
    });
  }

  async function handleResetPassword(userId: string) {
    if (newPassword.length < 6) return;
    await fetch(`/api/admin/staff/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resetPassword", newPassword }),
    });
    setResetTargetId(null);
    setNewPassword("");
  }

  async function handleDelete(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setPendingDeleteId(null);
    await fetch(`/api/admin/staff/${userId}`, { method: "DELETE" });
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-surface px-5 py-4 md:px-7">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Quản lý nhân viên</h1>
          <p className="text-sm text-muted">Tạo tài khoản mới và thu hồi quyền truy cập khi cần.</p>
        </div>
        <Button onClick={() => setShowAddForm((v) => !v)}>
          <PlusIcon size={16} weight="bold" />
          Thêm nhân viên
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-5 md:p-7">
        {showAddForm && (
          <div className="mb-5 flex flex-col gap-4 rounded-2xl bg-surface p-5 shadow-soft sm:flex-row sm:items-end">
            <div className="flex-1">
              <TextField
                label="Họ tên"
                id="staffName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                placeholder="Trần Thị B"
              />
            </div>
            <div className="flex-1">
              <TextField
                label="Email / số điện thoại"
                id="staffUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={errors.username}
                placeholder="ten@quan.cf"
              />
            </div>
            <div className="flex-1">
              <TextField
                label="Mật khẩu tạm thời"
                id="staffPassword"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            <Button onClick={handleAdd}>Tạo tài khoản</Button>
          </div>
        )}

        <div className="flex flex-col divide-y divide-border rounded-2xl bg-surface shadow-soft">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/6 text-sm font-semibold text-ink">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{user.name}</p>
                  <p className="text-xs text-muted">{user.username}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{user.role === "owner" ? "Chủ quán" : "Nhân viên"}</Badge>
                <Badge tone={user.status === "active" ? "success" : "danger"}>
                  {user.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                </Badge>
                <span className="hidden text-xs text-muted sm:inline">
                  Từ {formatDateShort(user.createdAt)}
                </span>

                {user.role !== "owner" && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleStatus(user)}
                      aria-label={user.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/6 hover:text-ink"
                    >
                      {user.status === "active" ? (
                        <LockIcon size={16} weight="bold" />
                      ) : (
                        <LockOpenIcon size={16} weight="bold" />
                      )}
                    </button>
                    <button
                      onClick={() => setResetTargetId(resetTargetId === user.id ? null : user.id)}
                      aria-label="Đặt lại mật khẩu"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/6 hover:text-ink"
                    >
                      <KeyIcon size={16} weight="bold" />
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(user.id)}
                      aria-label="Xóa tài khoản"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                    >
                      <TrashIcon size={16} weight="bold" />
                    </button>
                  </div>
                )}
              </div>

              {resetTargetId === user.id && (
                <div className="flex items-center gap-2 sm:basis-full">
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                    className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  <Button size="sm" onClick={() => handleResetPassword(user.id)}>
                    Lưu
                  </Button>
                </div>
              )}
              {pendingDeleteId === user.id && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-bg p-2 sm:basis-full">
                  <span className="text-xs text-danger">Xóa tài khoản {user.name}?</span>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(user.id)}>
                    Xóa
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingDeleteId(null)}>
                    Hủy
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
