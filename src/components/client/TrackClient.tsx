"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ReceiptIcon,
  XCircleIcon,
} from "@phosphor-icons/react/ssr";
import { SiteHeader } from "./SiteHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FULFILLMENT_LABEL,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  formatDateTime,
  formatVND,
} from "@/lib/format";
import type { OrderWithItems } from "@/lib/types";

const STEPS: { key: string; label: string }[] = [
  { key: "pending", label: "Chờ xác nhận" },
  { key: "preparing", label: "Đang pha chế" },
  { key: "ready", label: "Sẵn sàng" },
  { key: "completed", label: "Hoàn tất" },
];

const POLL_MS = 4000;

export function TrackClient({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lookup = useCallback(async (silent = false) => {
    if (!code.trim() && !phone.trim()) return;
    if (!silent) setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (code.trim()) params.set("code", code.trim());
      if (phone.trim()) params.set("phone", phone.trim());
      const res = await fetch(`/api/orders/lookup?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Không tìm thấy đơn hàng.");
        setOrder(null);
      } else if (data.orders.length === 0) {
        setError("Không tìm thấy đơn hàng phù hợp. Kiểm tra lại mã đơn hoặc số điện thoại.");
        setOrder(null);
      } else {
        setOrder(data.orders[0]);
      }
    } catch {
      if (!silent) setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      if (!silent) setLoading(false);
      setSearched(true);
    }
  }, [code, phone]);

  useEffect(() => {
    if (initialCode) {
      lookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!order || order.status === "completed" || order.status === "cancelled") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => lookup(true), POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status, order?.id]);

  const activeStepIndex = order ? STEPS.findIndex((s) => s.key === order.status) : -1;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Theo dõi đơn hàng</h1>
        <p className="mt-1.5 text-sm text-muted">
          Nhập mã đơn hoặc số điện thoại bạn đã dùng khi đặt món.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup();
          }}
          className="mt-6 flex flex-col gap-4 rounded-2xl bg-surface p-5 shadow-soft sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <TextField
              label="Mã đơn hàng"
              id="lookupCode"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ví dụ: K7M4A"
            />
          </div>
          <div className="flex-1">
            <TextField
              label="Hoặc số điện thoại"
              id="lookupPhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxx"
            />
          </div>
          <Button type="submit" size="md" disabled={loading} className="sm:w-auto">
            <MagnifyingGlassIcon size={16} weight="bold" />
            {loading ? "Đang tìm..." : "Tra cứu"}
          </Button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger">{error}</p>
        )}

        {!order && !searched && (
          <div className="mt-8">
            <EmptyState
              icon={<ReceiptIcon size={40} weight="light" />}
              title="Chưa có đơn hàng nào được tra cứu"
              description="Nhập mã đơn hoặc số điện thoại phía trên để xem trạng thái."
            />
          </div>
        )}

        {order && (
          <div className="mt-8 flex flex-col gap-6 rounded-2xl bg-surface p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Mã đơn hàng</p>
                <p className="text-3xl font-bold tracking-tight text-ink">{order.code}</p>
              </div>
              <div className="flex gap-2">
                <Badge tone={order.paymentStatus === "paid" ? "success" : "neutral"}>
                  {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                </Badge>
                <Badge tone="accent">{FULFILLMENT_LABEL[order.fulfillmentType]}</Badge>
              </div>
            </div>

            {order.status === "cancelled" ? (
              <div className="flex items-start gap-3 rounded-xl bg-danger-bg p-4">
                <XCircleIcon size={22} weight="fill" className="mt-0.5 shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-medium text-danger">Đơn hàng đã bị hủy</p>
                  {order.cancelReason && (
                    <p className="mt-0.5 text-sm text-danger/80">{order.cancelReason}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {STEPS.map((step, idx) => {
                  const done = idx < activeStepIndex;
                  const active = idx === activeStepIndex;
                  return (
                    <div key={step.key} className="flex flex-1 flex-col items-center gap-2 last:flex-none">
                      <div className="flex w-full items-center">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300 ${
                            done || active
                              ? "bg-accent text-accent-ink"
                              : "bg-ink/8 text-muted"
                          }`}
                        >
                          {done ? <CheckCircleIcon size={18} weight="fill" /> : idx + 1}
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div
                            className={`h-0.5 flex-1 transition-colors duration-500 ${
                              done ? "bg-accent" : "bg-ink/8"
                            }`}
                          />
                        )}
                      </div>
                      <span
                        className={`text-center text-xs font-medium ${
                          active ? "text-accent" : done ? "text-ink" : "text-muted"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              {order.items.map((line) => (
                <div key={line.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">
                    {line.quantity}x {line.name}
                    {line.note && <span className="text-muted"> ({line.note})</span>}
                  </span>
                  <span className="text-muted">{formatVND(line.unitPrice * line.quantity)}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Tổng cộng</span>
                <span className="text-accent">{formatVND(order.totalAmount)}</span>
              </div>
            </div>

            <p className="text-xs text-muted">
              Đặt lúc {formatDateTime(order.createdAt)} · Trạng thái xử lý:{" "}
              {ORDER_STATUS_LABEL[order.status]}
            </p>
          </div>
        )}
      </main>
    </>
  );
}
