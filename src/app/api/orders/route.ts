import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/repo";
import type { CreateOrderInput } from "@/lib/repo";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<CreateOrderInput>;

  if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
    return NextResponse.json(
      { message: "Vui lòng nhập tên và số điện thoại liên hệ." },
      { status: 400 }
    );
  }
  if (!body.fulfillmentType || !["takeaway", "dine_in"].includes(body.fulfillmentType)) {
    return NextResponse.json({ message: "Hình thức nhận món không hợp lệ." }, { status: 400 });
  }
  if (body.fulfillmentType === "dine_in" && !body.tableNumber?.trim()) {
    return NextResponse.json({ message: "Vui lòng nhập số bàn." }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ message: "Giỏ hàng đang trống." }, { status: 400 });
  }

  const result = createOrder({
    customerName: body.customerName.trim(),
    customerPhone: body.customerPhone.trim(),
    fulfillmentType: body.fulfillmentType,
    tableNumber: body.tableNumber ?? null,
    note: body.note ?? "",
    items: body.items,
  });

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }

  return NextResponse.json({ order: result }, { status: 201 });
}
