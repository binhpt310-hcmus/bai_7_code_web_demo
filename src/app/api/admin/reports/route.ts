import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { getRevenueReport } from "@/lib/repo";

export async function GET(req: NextRequest) {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ message: "Thiếu khoảng thời gian." }, { status: 400 });
  }

  const report = getRevenueReport(from, to);
  return NextResponse.json({ report });
}
