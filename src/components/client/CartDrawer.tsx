"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeftIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagOpenIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react/ssr";
import { useCart } from "@/lib/cart-context";
import { formatVND } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextField } from "@/components/ui/Field";
import type { FulfillmentType } from "@/lib/types";

export function CartDrawer() {
  const cart = useCart();
  const router = useRouter();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("takeaway");
  const [tableNumber, setTableNumber] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function close() {
    cart.close();
    window.setTimeout(() => setStep("cart"), 250);
  }

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Vui lòng nhập tên của bạn.";
    if (!phone.trim()) nextErrors.phone = "Vui lòng nhập số điện thoại.";
    else if (!/^[0-9]{9,11}$/.test(phone.trim())) nextErrors.phone = "Số điện thoại không hợp lệ.";
    if (fulfillmentType === "dine_in" && !tableNumber.trim()) {
      nextErrors.tableNumber = "Vui lòng nhập số bàn.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          fulfillmentType,
          tableNumber: fulfillmentType === "dine_in" ? tableNumber.trim() : null,
          note: orderNote.trim(),
          items: cart.lines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
            note: l.note,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message ?? "Có lỗi xảy ra, vui lòng thử lại.");
        setSubmitting(false);
        return;
      }
      cart.clear();
      close();
      router.push(`/track?code=${data.order.code}`);
    } catch {
      setSubmitError("Không thể kết nối máy chủ. Vui lòng thử lại.");
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {cart.isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-soft-lg"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              {step === "checkout" && (
                <button
                  onClick={() => setStep("cart")}
                  aria-label="Quay lại giỏ hàng"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/6"
                >
                  <ArrowLeftIcon size={18} weight="bold" />
                </button>
              )}
              <h2 className="text-base font-semibold text-ink">
                {step === "cart" ? "Giỏ hàng của bạn" : "Xác nhận đặt hàng"}
              </h2>
              <button
                onClick={close}
                aria-label="Đóng giỏ hàng"
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/6 hover:text-ink"
              >
                <XIcon size={18} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {step === "cart" ? (
                cart.lines.length === 0 ? (
                  <EmptyState
                    icon={<ShoppingBagOpenIcon size={40} weight="light" />}
                    title="Giỏ hàng đang trống"
                    description="Xem thực đơn và thêm món yêu thích của bạn."
                    action={
                      <Button variant="secondary" onClick={close}>
                        Xem thực đơn
                      </Button>
                    }
                  />
                ) : (
                  <ul className="flex flex-col gap-4">
                    {cart.lines.map((line) => (
                      <li key={line.menuItemId} className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                          <Image src={line.image} alt={line.name} fill sizes="64px" className="object-cover" />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-ink">{line.name}</p>
                            <button
                              onClick={() => cart.removeItem(line.menuItemId)}
                              aria-label={`Xóa ${line.name}`}
                              className="text-muted transition-colors hover:text-danger"
                            >
                              <TrashIcon size={16} weight="bold" />
                            </button>
                          </div>
                          <input
                            value={line.note}
                            onChange={(e) => cart.setNote(line.menuItemId, e.target.value)}
                            placeholder="Ghi chú (ít đá, không đường...)"
                            className="rounded-md border border-border bg-bg px-2 py-1 text-xs text-ink outline-none placeholder:text-muted/70 focus:border-accent"
                          />
                          <div className="mt-1 flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
                              <button
                                onClick={() => cart.setQuantity(line.menuItemId, line.quantity - 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-ink/6 active:scale-90"
                                aria-label="Giảm số lượng"
                              >
                                <MinusIcon size={12} weight="bold" />
                              </button>
                              <span className="w-5 text-center text-xs font-medium">{line.quantity}</span>
                              <button
                                onClick={() => cart.setQuantity(line.menuItemId, line.quantity + 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-ink/6 active:scale-90"
                                aria-label="Tăng số lượng"
                              >
                                <PlusIcon size={12} weight="bold" />
                              </button>
                            </div>
                            <span className="text-sm font-semibold text-accent">
                              {formatVND(line.price * line.quantity)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-ink">Hình thức nhận món</span>
                    <div className="grid grid-cols-2 gap-2 rounded-full bg-ink/5 p-1">
                      {(["takeaway", "dine_in"] as FulfillmentType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFulfillmentType(type)}
                          className={`rounded-full py-2 text-sm font-medium transition-all active:scale-[0.98] ${
                            fulfillmentType === type ? "bg-surface text-ink shadow-soft" : "text-muted"
                          }`}
                        >
                          {type === "takeaway" ? "Mang đi" : "Tại quán"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {fulfillmentType === "dine_in" && (
                    <TextField
                      label="Số bàn"
                      id="tableNumber"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      error={errors.tableNumber}
                      placeholder="Ví dụ: 5"
                    />
                  )}

                  <TextField
                    label="Họ tên"
                    id="customerName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    placeholder="Nguyễn Văn A"
                  />
                  <TextField
                    label="Số điện thoại liên hệ"
                    id="customerPhone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={errors.phone}
                    placeholder="09xxxxxxxx"
                    inputMode="numeric"
                  />
                  <TextField
                    label="Ghi chú cho đơn hàng (không bắt buộc)"
                    id="orderNote"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Ví dụ: giao ra cửa trước"
                  />

                  <div className="rounded-xl bg-bg p-4">
                    <div className="flex items-center justify-between text-sm text-muted">
                      <span>{cart.totalQuantity} món</span>
                      <span className="text-base font-semibold text-ink">
                        {formatVND(cart.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {submitError && <p className="text-sm text-danger">{submitError}</p>}
                </div>
              )}
            </div>

            {cart.lines.length > 0 && (
              <div className="border-t border-border p-5">
                {step === "cart" ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm text-muted">
                      <span>Tạm tính</span>
                      <span className="text-base font-semibold text-ink">
                        {formatVND(cart.totalAmount)}
                      </span>
                    </div>
                    <Button size="lg" onClick={() => setStep("checkout")}>
                      Tiến hành đặt hàng
                    </Button>
                  </div>
                ) : (
                  <Button size="lg" disabled={submitting} onClick={handleSubmit}>
                    {submitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
                  </Button>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
