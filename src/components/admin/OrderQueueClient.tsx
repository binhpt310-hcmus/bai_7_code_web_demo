"use client";

import { useCallback, useEffect, useState } from "react";
import { TrayIcon, XIcon } from "@phosphor-icons/react/ssr";
import { OrderCard } from "./OrderCard";
import { OrderDetailModal } from "./OrderDetailModal";
import { OrderCardSkeleton } from "@/components/ui/Skeleton";
import type { OrderWithItems, OrderStatus, Role } from "@/lib/types";

const COLUMNS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Chờ xác nhận" },
  { key: "preparing", label: "Đang pha chế" },
  { key: "ready", label: "Sẵn sàng lấy món" },
  { key: "completed", label: "Hoàn tất" },
  { key: "cancelled", label: "Đã hủy" },
];

const POLL_MS = 4000;

export function OrderQueueClient({ role, denied }: { role: Role; denied?: boolean }) {
  const [orders, setOrders] = useState<OrderWithItems[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDenied, setShowDenied] = useState(!!denied);

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (!res.ok) return;
    const data = await res.json();
    setOrders(data.orders);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const selectedOrder = orders?.find((o) => o.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/70 bg-surface px-5 py-4 md:px-7">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Bảng điều khiển đơn hàng</h1>
        <p className="text-sm text-muted">
          {role === "owner" ? "Toàn bộ đơn hàng của quán." : "Đơn hàng đang xử lý và gần đây."}
        </p>
      </header>

      {showDenied && (
        <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-lg bg-warning-bg px-4 py-2.5 text-sm text-warning md:mx-7">
          <span>Tài khoản của bạn không có quyền truy cập trang đó.</span>
          <button
            onClick={() => setShowDenied(false)}
            aria-label="Đóng thông báo"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-warning/15"
          >
            <XIcon size={14} weight="bold" />
          </button>
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-3.5 overflow-x-auto p-4 sm:grid-cols-2 md:p-5 lg:grid-cols-5 lg:gap-4">
        {COLUMNS.map((col) => {
          const items = orders?.filter((o) => o.status === col.key) ?? null;
          return (
            <div key={col.key} className="flex min-w-0 flex-col gap-2.5 rounded-2xl bg-ink/[0.03] p-2.5">
              <div className="flex items-center justify-between px-1.5 pt-1">
                <h2 className="text-sm font-semibold text-ink">{col.label}</h2>
                <span className="rounded-full bg-ink/8 px-2 py-0.5 text-xs font-medium text-muted">
                  {items?.length ?? "-"}
                </span>
              </div>
              <div className="flex max-h-[calc(100dvh-13rem)] flex-col gap-2.5 overflow-y-auto pb-1">
                {items === null &&
                  Array.from({ length: 2 }).map((_, i) => <OrderCardSkeleton key={i} />)}
                {items?.length === 0 && (
                  <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border py-8 text-center">
                    <TrayIcon size={22} weight="light" className="text-muted/50" />
                    <p className="text-xs text-muted">Chưa có đơn</p>
                  </div>
                )}
                {items?.map((order) => (
                  <OrderCard key={order.id} order={order} onClick={() => setSelectedId(order.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedId(null)}
        onUpdated={(updated) => {
          setOrders((prev) => prev?.map((o) => (o.id === updated.id ? updated : o)) ?? prev);
        }}
      />
    </div>
  );
}
