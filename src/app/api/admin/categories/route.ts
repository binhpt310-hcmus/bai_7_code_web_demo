import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { createCategory, getCategories } from "@/lib/repo";

export async function GET() {
  const guard = await requireSession(["owner", "staff"]);
  if ("error" in guard) return guard.error;
  return NextResponse.json({ categories: getCategories() });
}

export async function POST(req: NextRequest) {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const { name } = (await req.json()) as { name?: string };
  if (!name?.trim()) {
    return NextResponse.json({ message: "Tên danh mục không được để trống." }, { status: 400 });
  }
  const category = createCategory(name.trim());
  return NextResponse.json({ category }, { status: 201 });
}
