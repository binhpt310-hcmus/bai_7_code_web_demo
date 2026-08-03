import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { deleteStaffUser, resetUserPassword, setUserStatus } from "@/lib/repo";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const body = (await req.json()) as {
    action: "setStatus" | "resetPassword";
    status?: "active" | "locked";
    newPassword?: string;
  };

  if (body.action === "setStatus") {
    if (body.status !== "active" && body.status !== "locked") {
      return NextResponse.json({ message: "Trạng thái không hợp lệ." }, { status: 400 });
    }
    const user = setUserStatus(id, body.status);
    if (!user) {
      return NextResponse.json(
        { message: "Không thể khóa/mở khóa tài khoản này." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "resetPassword") {
    if (!body.newPassword || body.newPassword.length < 6) {
      return NextResponse.json(
        { message: "Mật khẩu mới phải có ít nhất 6 ký tự." },
        { status: 400 }
      );
    }
    const user = resetUserPassword(id, body.newPassword);
    if (!user) return NextResponse.json({ message: "Không tìm thấy tài khoản." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ message: "Hành động không hợp lệ." }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const ok = deleteStaffUser(id);
  if (!ok) return NextResponse.json({ message: "Không thể xóa tài khoản này." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
