"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartLineUpIcon,
  ForkKnifeIcon,
  RobotIcon,
  SignOutIcon,
  SquaresFourIcon,
  UsersIcon,
} from "@phosphor-icons/react/ssr";
import type { SessionPayload } from "@/lib/types";
import { ChatWidget } from "@/components/shared/ChatWidget";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/orders", label: "Đơn hàng", icon: <SquaresFourIcon size={19} weight="bold" /> },
  { href: "/admin/menu", label: "Thực đơn", icon: <ForkKnifeIcon size={19} weight="bold" /> },
  {
    href: "/admin/staff",
    label: "Nhân viên",
    icon: <UsersIcon size={19} weight="bold" />,
    ownerOnly: true,
  },
  {
    href: "/admin/reports",
    label: "Báo cáo doanh thu",
    icon: <ChartLineUpIcon size={19} weight="bold" />,
    ownerOnly: true,
  },
  {
    href: "/admin/settings",
    label: "Trợ lý AI",
    icon: <RobotIcon size={19} weight="bold" />,
    ownerOnly: true,
  },
];

export function AdminShell({
  session,
  children,
}: {
  session: SessionPayload | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const items = NAV_ITEMS.filter((item) => !item.ownerOnly || session?.role === "owner");

  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col justify-between bg-slate px-4 py-5 md:h-[100dvh] md:w-60 md:sticky md:top-0">
        <div>
          <div className="flex items-center gap-2 px-2 pb-6">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-ink">
              RM
            </span>
            <span className="text-sm font-semibold text-white">Rang Mộc - Vận hành</span>
          </div>
          <nav className="flex gap-1.5 overflow-x-auto md:flex-col md:overflow-visible">
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden flex-col gap-3 border-t border-white/10 pt-4 md:flex">
          <div className="px-2">
            <p className="text-sm font-medium text-white">{session?.name}</p>
            <p className="text-xs text-white/50">
              {session?.role === "owner" ? "Chủ quán" : "Nhân viên"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <SignOutIcon size={19} weight="bold" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-bg">{children}</main>

      {session && (
        <ChatWidget
          storageKey={`rang-moc-chat-${session.role}-${session.userId}`}
          title={session.role === "owner" ? "Trợ lý AI (Chủ quán)" : "Trợ lý AI (Nhân viên)"}
          greeting="Chào bạn! Mình có thể hỗ trợ tra cứu thực đơn, đơn hàng và các câu hỏi vận hành. Bạn cần gì?"
          positionClassName="fixed bottom-5 right-4 z-30 sm:bottom-6 sm:right-6"
        />
      )}
    </div>
  );
}
