"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircleIcon, XIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  FULFILLMENT_LABEL,
  ORDER_STATUS_LABEL,
  formatDateTime,
  formatTime,
  formatVND,
} from "@/lib/format";
import type { OrderStatus, OrderWithItems } from "@/lib/types";

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  pending: { next: "preparing", label: "Xác nhận, bắt đầu pha chế" },
  preparing: { next: "ready", label: "Món đã sẵn sàng" },
  ready: { next: "completed", label: "Khách đã nhận (Hoàn tất)" },
};

export function OrderDetailModal({
  order,
  onClose,
  onUpdated,
}: {
  order: OrderWithItems | null;
  onClose: () => void;
  onUpdated: (order: OrderWithItems) => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!order) return null;

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Có lỗi xảy ra.");
        return;
      }
      onUpdated(data.order);
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setBusy(false);
    }
  }

  const nextAction = NEXT_STATUS[order.status];
  const canCancel = order.status === "pending" || order.status === "preparing" || order.status === "ready";

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
          className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface sm:rounded-2xl"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <p className="text-lg font-semibold text-ink">#{order.code}</p>
              <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/6 hover:text-ink"
            >
              <XIcon size={18} weight="bold" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">{ORDER_STATUS_LABEL[order.status]}</Badge>
              <Badge tone={order.paymentStatus === "paid" ? "success" : "neutral"}>
                {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
              </Badge>
              <Badge tone="neutral">
                {FULFILLMENT_LABEL[order.fulfillmentType]}
                {order.tableNumber ? ` · Bàn ${order.tableNumber}` : ""}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted">Khách hàng</p>
                <p className="font-medium text-ink">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Số điện thoại</p>
                <p className="font-medium text-ink">{order.customerPhone}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 rounded-xl bg-bg p-3.5">
              {order.items.map((line) => (
                <div key={line.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="text-ink">
                      {line.quantity}x {line.name}
                    </p>
                    {line.note && <p className="text-xs text-muted">Ghi chú: {line.note}</p>}
                  </div>
                  <span className="shrink-0 text-muted">{formatVND(line.unitPrice * line.quantity)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-2.5 text-sm font-semibold">
                <span>Tổng cộng</span>
                <span className="text-accent">{formatVND(order.totalAmount)}</span>
              </div>
            </div>

            {order.note && (
              <p className="mt-3 rounded-lg bg-bg px-3.5 py-2.5 text-sm text-muted">
                Ghi chú đơn: {order.note}
              </p>
            )}
            {order.status === "cancelled" && order.cancelReason && (
              <p className="mt-3 rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
                Lý do hủy: {order.cancelReason}
              </p>
            )}

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}

            {cancelling && (
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-danger/30 bg-danger-bg p-3.5">
                <label htmlFor="cancelReason" className="text-sm font-medium text-danger">
                  Lý do hủy đơn
                </label>
                <input
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Khách không đến lấy món..."
                  className="rounded-lg border border-danger/30 bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-danger/20"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setCancelling(false)}>
                    Bỏ qua
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={busy || !cancelReason.trim()}
                    onClick={() => patch({ action: "status", status: "cancelled", cancelReason })}
                  >
                    Xác nhận hủy đơn
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 border-t border-border p-5">
            {order.paymentStatus === "paid" ? (
              <Button variant="secondary" size="lg" disabled className="gap-2">
                <CheckCircleIcon size={18} weight="fill" className="text-success" />
                Đã thu tiền lúc {order.paymentConfirmedAt ? formatTime(order.paymentConfirmedAt) : ""}
              </Button>
            ) : (
              order.status !== "cancelled" && (
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={busy}
                  onClick={() => patch({ action: "confirmPayment" })}
                >
                  Xác nhận thanh toán
                </Button>
              )
            )}

            {nextAction && (
              <Button size="lg" disabled={busy} onClick={() => patch({ action: "status", status: nextAction.next })}>
                {nextAction.label}
              </Button>
            )}

            {canCancel && !cancelling && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => setCancelling(true)}>
                Hủy đơn hàng
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
