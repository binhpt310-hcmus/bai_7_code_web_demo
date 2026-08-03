"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { UploadSimpleIcon, XIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { formatVND } from "@/lib/format";
import type { Category, MenuItem } from "@/lib/types";

const PLACEHOLDER_IMAGE = "/menu-images/hero-cafe.jpg";

export function MenuItemFormModal({
  categories,
  item,
  onClose,
  onSaved,
}: {
  categories: Category[];
  item: MenuItem | null;
  onClose: () => void;
  onSaved: (item: MenuItem) => void;
}) {
  const isEdit = !!item;
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? "");
  const [image, setImage] = useState(item?.image ?? "");
  const [available, setAvailable] = useState(item?.available ?? true);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setSubmitError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message ?? "Tải ảnh thất bại.");
        return;
      }
      setImage(data.url);
    } catch {
      setSubmitError("Không thể kết nối máy chủ khi tải ảnh.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Tên món không được để trống.";
    if (!categoryId) nextErrors.categoryId = "Chọn một danh mục.";
    const priceNumber = Number(price);
    if (!price || Number.isNaN(priceNumber) || priceNumber <= 0) {
      nextErrors.price = "Giá món phải là số lớn hơn 0.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSubmitError("");
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        price: priceNumber,
        categoryId,
        image: image.trim() || PLACEHOLDER_IMAGE,
        available,
      };
      const res = await fetch(
        isEdit ? `/api/admin/menu-items/${item!.id}` : "/api/admin/menu-items",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message ?? "Có lỗi xảy ra.");
        return;
      }
      onSaved(data.item);
    } catch {
      setSubmitError("Không thể kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  }

  const previewPrice = Number(price) || 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        <motion.div
          className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-surface sm:rounded-2xl"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-ink">
              {isEdit ? "Sửa món" : "Thêm món mới"}
            </h2>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/6 hover:text-ink"
            >
              <XIcon size={18} weight="bold" />
            </button>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-5 md:grid-cols-[1fr_220px]">
            <div className="flex flex-col gap-4">
              <TextField
                label="Tên món"
                id="itemName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                placeholder="Ví dụ: Bạc xỉu"
              />
              <TextAreaField
                label="Mô tả"
                id="itemDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về món (nguyên liệu, hương vị...)"
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="Giá (VNĐ)"
                  id="itemPrice"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  error={errors.price}
                  inputMode="numeric"
                  placeholder="35000"
                />
                <SelectField
                  label="Danh mục"
                  id="itemCategory"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  error={errors.categoryId}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Ảnh món</span>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/30 disabled:opacity-50"
                  >
                    <UploadSimpleIcon size={16} weight="bold" />
                    {uploading ? "Đang tải..." : "Tải ảnh lên"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  <span className="text-xs text-muted">hoặc dán URL ảnh bên dưới</span>
                </div>
                <input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                />
              </div>

              <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
                <button
                  type="button"
                  role="switch"
                  aria-checked={available}
                  onClick={() => setAvailable((v) => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    available ? "bg-success" : "bg-ink/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      available ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                Còn hàng
              </label>

              {submitError && <p className="text-sm text-danger">{submitError}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Xem trước cho khách
              </span>
              <div className="overflow-hidden rounded-2xl bg-bg shadow-soft">
                <div className="relative aspect-square w-full bg-ink/5">
                  <Image
                    src={image.trim() || PLACEHOLDER_IMAGE}
                    alt={name || "Món mới"}
                    fill
                    sizes="220px"
                    className={`object-cover ${available ? "" : "opacity-40 grayscale"}`}
                    unoptimized={image.startsWith("/uploads/")}
                  />
                  {!available && (
                    <span className="absolute left-2 top-2 rounded-full bg-slate px-2.5 py-1 text-[11px] font-medium text-white">
                      Hết hàng
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-ink line-clamp-2">
                    {name || "Tên món"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-accent">
                    {formatVND(previewPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-border p-5">
            <Button variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button disabled={saving || uploading} onClick={handleSubmit}>
              {saving ? "Đang lưu..." : "Lưu món"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
