import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { deleteCategory, updateCategory } from "@/lib/repo";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const { name } = (await req.json()) as { name?: string };
  if (!name?.trim()) {
    return NextResponse.json({ message: "Tên danh mục không được để trống." }, { status: 400 });
  }
  const category = updateCategory(id, name.trim());
  if (!category) return NextResponse.json({ message: "Không tìm thấy danh mục." }, { status: 404 });
  return NextResponse.json({ category });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const result = deleteCategory(id);
  if (!result.ok) {
    return NextResponse.json({ message: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
