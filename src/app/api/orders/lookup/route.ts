import { NextRequest, NextResponse } from "next/server";
import { findOrdersForTracking } from "@/lib/repo";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? undefined;
  const phone = req.nextUrl.searchParams.get("phone") ?? undefined;

  if (!code && !phone) {
    return NextResponse.json(
      { message: "Nhập mã đơn hoặc số điện thoại để tra cứu." },
      { status: 400 }
    );
  }

  const orders = findOrdersForTracking(code, phone);
  return NextResponse.json({ orders });
}
