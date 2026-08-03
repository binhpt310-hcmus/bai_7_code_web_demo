"use client";

import Image from "next/image";
import { useState } from "react";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { motion } from "motion/react";
import type { MenuItem } from "@/lib/types";
import { formatVND } from "@/lib/format";
import { useCart } from "@/lib/cart-context";

export function ProductCard({ item, onOpen }: { item: MenuItem; onOpen: () => void }) {
  const cart = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (!item.available) return;
    cart.addItem(
      { menuItemId: item.id, name: item.name, price: item.price, image: item.image },
      1,
      ""
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 700);
  }

  return (
    <button
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-2xl bg-surface text-left shadow-soft transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-soft-lg"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-ink/5">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
            item.available ? "" : "opacity-40 grayscale"
          }`}
        />
        {!item.available && (
          <span className="absolute left-2 top-2 rounded-full bg-slate px-2.5 py-1 text-[11px] font-medium text-white">
            Hết hàng
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <h3 className="text-sm font-semibold leading-snug text-ink line-clamp-2">
          {item.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <span className="text-sm font-semibold text-accent">{formatVND(item.price)}</span>
          <motion.span
            role="button"
            aria-label={`Thêm ${item.name} vào giỏ`}
            onClick={handleAdd}
            whileTap={{ scale: 0.9 }}
            animate={justAdded ? { scale: [1, 1.25, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              item.available
                ? "bg-ink/6 text-ink hover:bg-accent hover:text-accent-ink"
                : "cursor-not-allowed bg-ink/5 text-muted/50"
            }`}
          >
            <PlusIcon size={16} weight="bold" />
          </motion.span>
        </div>
      </div>
    </button>
  );
}
