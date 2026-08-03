"use client";

import Link from "next/link";
import { ShoppingBagIcon, ReceiptIcon } from "@phosphor-icons/react/ssr";
import { useCart } from "@/lib/cart-context";

export function SiteHeader() {
  const cart = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink">
            RM
          </span>
          <span className="text-lg font-semibold tracking-tight">Rang Mộc</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link
            href="/track"
            className="hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-ink/5 hover:text-ink sm:inline-flex"
          >
            <ReceiptIcon size={18} weight="bold" />
            Theo dõi đơn hàng
          </Link>
          <Link
            href="/track"
            className="inline-flex items-center justify-center rounded-full p-2.5 text-muted transition-colors hover:bg-ink/5 hover:text-ink sm:hidden"
            aria-label="Theo dõi đơn hàng"
          >
            <ReceiptIcon size={20} weight="bold" />
          </Link>
          <button
            onClick={cart.open}
            className="relative inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition-transform active:scale-[0.98]"
            aria-label="Mở giỏ hàng"
          >
            <ShoppingBagIcon size={18} weight="bold" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {cart.totalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-ink">
                {cart.totalQuantity}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
