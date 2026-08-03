import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { confirmOrderPayment, getOrderById, updateOrderStatus } from "@/lib/repo";
import type { OrderStatus } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSession(["owner", "staff"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ message: "Không tìm thấy đơn hàng." }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSession(["owner", "staff"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const body = (await req.json()) as {
    action: "status" | "confirmPayment";
    status?: OrderStatus;
    cancelReason?: string;
  };

  if (body.action === "confirmPayment") {
    const order = await confirmOrderPayment(id, guard.session.userId);
    if (!order) return NextResponse.json({ message: "Không tìm thấy đơn hàng." }, { status: 404 });
    return NextResponse.json({ order });
  }

  if (body.action === "status") {
    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ message: "Trạng thái không hợp lệ." }, { status: 400 });
    }
    if (body.status === "cancelled" && !body.cancelReason?.trim()) {
      return NextResponse.json({ message: "Vui lòng nhập lý do hủy đơn." }, { status: 400 });
    }
    const order = await updateOrderStatus(id, body.status, body.cancelReason);
    if (!order) return NextResponse.json({ message: "Không tìm thấy đơn hàng." }, { status: 404 });
    return NextResponse.json({ order });
  }

  return NextResponse.json({ message: "Hành động không hợp lệ." }, { status: 400 });
}
