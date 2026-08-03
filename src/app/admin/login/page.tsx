import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink">
          RM
        </span>
        <p className="text-lg font-semibold text-white">Rang Mộc Coffee</p>
        <p className="text-sm text-white/50">Khu vực vận hành - Owner &amp; Staff</p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
