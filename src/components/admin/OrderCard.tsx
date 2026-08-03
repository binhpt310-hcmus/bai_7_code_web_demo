"use client";

import { Badge } from "@/components/ui/Badge";
import { FULFILLMENT_LABEL, formatTime, formatVND } from "@/lib/format";
import type { OrderWithItems } from "@/lib/types";

export function OrderCard({
  order,
  onClick,
}: {
  order: OrderWithItems;
  onClick: () => void;
}) {
  const summary = order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ");

  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-1.5 rounded-xl bg-surface p-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">#{order.code}</span>
        <span className="text-xs text-muted">{formatTime(order.createdAt)}</span>
      </div>
      <p className="line-clamp-2 text-xs leading-relaxed text-muted">{summary}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <Badge tone="neutral">
          {FULFILLMENT_LABEL[order.fulfillmentType]}
          {order.tableNumber ? ` · Bàn ${order.tableNumber}` : ""}
        </Badge>
        <span className="text-xs font-semibold text-ink">{formatVND(order.totalAmount)}</span>
      </div>
      <Badge tone={order.paymentStatus === "paid" ? "success" : "neutral"} className="self-start">
        {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
      </Badge>
    </button>
  );
}
