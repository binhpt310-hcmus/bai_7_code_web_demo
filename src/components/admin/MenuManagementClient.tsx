"use client";

import Image from "next/image";
import { useState } from "react";
import { PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatVND } from "@/lib/format";
import { MenuItemFormModal } from "./MenuItemFormModal";
import type { Category, MenuItem, Role } from "@/lib/types";

export function MenuManagementClient({
  role,
  initialCategories,
  initialItems,
}: {
  role: Role;
  initialCategories: Category[];
  initialItems: MenuItem[];
}) {
  const isOwner = role === "owner";
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<MenuItem | null | "new">(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const visibleItems =
    activeCategory === "all" ? items : items.filter((i) => i.categoryId === activeCategory);

  async function toggleAvailability(item: MenuItem) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, available: !i.available } : i))
    );
    await fetch(`/api/admin/menu-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setPendingDeleteId(null);
    await fetch(`/api/admin/menu-items/${id}`, { method: "DELETE" });
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories((prev) => [...prev, data.category]);
      setNewCategoryName("");
      setAddingCategory(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-surface px-5 py-4 md:px-7">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Thực đơn</h1>
          <p className="text-sm text-muted">
            {isOwner
              ? "Thêm, sửa, xóa món và quản lý danh mục."
              : "Xem thực đơn hiện tại và bật/tắt trạng thái còn hàng."}
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setEditingItem("new")}>
            <PlusIcon size={16} weight="bold" />
            Thêm món mới
          </Button>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-5 py-3 md:px-7">
        <button
          onClick={() => setActiveCategory("all")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors active:scale-[0.98] ${
            activeCategory === "all" ? "bg-ink text-white" : "bg-ink/6 text-muted hover:text-ink"
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors active:scale-[0.98] ${
              activeCategory === cat.id ? "bg-ink text-white" : "bg-ink/6 text-muted hover:text-ink"
            }`}
          >
            {cat.name}
          </button>
        ))}
        {isOwner &&
          (addingCategory ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="Tên danh mục"
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
              />
              <Button size="sm" onClick={handleAddCategory}>
                Lưu
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingCategory(false)}>
                Hủy
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCategory(true)}
              className="shrink-0 rounded-full border border-dashed border-border px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:border-ink/30 hover:text-ink"
            >
              + Danh mục
            </button>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-7">
        {visibleItems.length === 0 ? (
          <EmptyState title="Chưa có món nào trong danh mục này" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-xl bg-surface p-3 shadow-soft"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className={`object-cover ${item.available ? "" : "opacity-40 grayscale"}`}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                    {isOwner && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => setEditingItem(item)}
                          aria-label={`Sửa ${item.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/6 hover:text-ink"
                        >
                          <PencilSimpleIcon size={14} weight="bold" />
                        </button>
                        <button
                          onClick={() => setPendingDeleteId(item.id)}
                          aria-label={`Xóa ${item.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                        >
                          <TrashIcon size={14} weight="bold" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {categories.find((c) => c.id === item.categoryId)?.name}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="text-sm font-semibold text-accent">
                      {formatVND(item.price)}
                    </span>
                    <button
                      role="switch"
                      aria-checked={item.available}
                      onClick={() => toggleAvailability(item)}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                        item.available ? "bg-success" : "bg-ink/15"
                      }`}
                      aria-label={item.available ? "Đánh dấu hết hàng" : "Đánh dấu còn hàng"}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          item.available ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  {pendingDeleteId === item.id && (
                    <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-danger-bg p-2">
                      <span className="text-xs text-danger">Xóa món này?</span>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
                        Xóa
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setPendingDeleteId(null)}>
                        Hủy
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingItem && (
        <MenuItemFormModal
          categories={categories}
          item={editingItem === "new" ? null : editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={(saved) => {
            setItems((prev) => {
              const exists = prev.some((i) => i.id === saved.id);
              return exists ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved];
            });
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
