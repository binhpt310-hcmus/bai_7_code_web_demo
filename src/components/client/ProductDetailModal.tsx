"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MinusIcon, PlusIcon, XIcon } from "@phosphor-icons/react/ssr";
import type { MenuItem } from "@/lib/types";
import { formatVND } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/Button";

export function ProductDetailModal({
  item,
  onClose,
}: {
  item: MenuItem | null;
  onClose: () => void;
}) {
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    setQuantity(1);
    setNote("");
  }, [item]);

  useEffect(() => {
    if (!item) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [item]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface sm:rounded-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] w-full shrink-0 bg-ink/5">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="512px"
                className={`object-cover ${item.available ? "" : "opacity-40 grayscale"}`}
              />
              <button
                onClick={onClose}
                aria-label="Đóng"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink shadow-soft transition-transform active:scale-90"
              >
                <XIcon size={18} weight="bold" />
              </button>
              {!item.available && (
                <span className="absolute left-3 top-3 rounded-full bg-slate px-3 py-1 text-xs font-medium text-white">
                  Hết hàng
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-ink">{item.name}</h2>
                <p className="mt-1.5 max-w-[65ch] text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="item-note" className="text-sm font-medium text-ink">
                  Ghi chú riêng cho món (không bắt buộc)
                </label>
                <input
                  id="item-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: ít đá, không đường..."
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                />
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="text-lg font-semibold text-accent">
                  {formatVND(item.price * quantity)}
                </span>
                <div className="flex items-center gap-1 rounded-full border border-border p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/6 active:scale-90"
                    aria-label="Giảm số lượng"
                  >
                    <MinusIcon size={15} weight="bold" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/6 active:scale-90"
                    aria-label="Tăng số lượng"
                  >
                    <PlusIcon size={15} weight="bold" />
                  </button>
                </div>
              </div>

              <Button
                size="lg"
                disabled={!item.available}
                onClick={() => {
                  cart.addItem(
                    { menuItemId: item.id, name: item.name, price: item.price, image: item.image },
                    quantity,
                    note
                  );
                  onClose();
                }}
              >
                {item.available ? "Thêm vào giỏ hàng" : "Món đã hết hàng"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
