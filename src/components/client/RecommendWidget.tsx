"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CoffeeIcon,
  FireIcon,
  ForkKnifeIcon,
  LeafIcon,
  SnowflakeIcon,
  SparkleIcon,
  XIcon,
} from "@phosphor-icons/react/ssr";
import type { Category, MenuItem } from "@/lib/types";
import { formatVND } from "@/lib/format";
import { RECOMMEND_PRESETS, getRecommendations, type RecommendPreset } from "@/lib/recommend";

const PRESET_ICONS: Record<RecommendPreset["icon"], typeof CoffeeIcon> = {
  leaf: LeafIcon,
  snowflake: SnowflakeIcon,
  fire: FireIcon,
  forkKnife: ForkKnifeIcon,
  coffee: CoffeeIcon,
};

export function RecommendWidget({
  items,
  categories,
  onSelectItem,
}: {
  items: MenuItem[];
  categories: Category[];
  onSelectItem: (item: MenuItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<RecommendPreset | null>(null);

  const results = useMemo(() => {
    if (!activePreset) return [];
    return getRecommendations(activePreset, items, categories);
  }, [activePreset, items, categories]);

  function handlePresetClick(preset: RecommendPreset) {
    setActivePreset(preset);
  }

  function handleClose() {
    setOpen(false);
    setActivePreset(null);
  }

  return (
    <div className="fixed bottom-5 right-4 z-30 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex max-h-[70dvh] w-[88vw] max-w-sm flex-col overflow-hidden rounded-2xl bg-surface shadow-soft-lg"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/12 text-accent">
                  <SparkleIcon size={16} weight="fill" />
                </span>
                <p className="text-sm font-semibold text-ink">Trợ lý gợi ý món</p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Đóng trợ lý gợi ý"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/6 hover:text-ink"
              >
                <XIcon size={16} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <p className="mb-3 text-sm text-muted">
                Bạn đang muốn gì hôm nay? Chọn nhanh một gợi ý bên dưới.
              </p>

              <div className="flex flex-wrap gap-2">
                {RECOMMEND_PRESETS.map((preset) => {
                  const PresetIcon = PRESET_ICONS[preset.icon];
                  const active = activePreset?.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetClick(preset)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-accent bg-accent text-accent-ink"
                          : "border-border bg-bg text-ink hover:border-ink/30"
                      }`}
                    >
                      <PresetIcon size={15} weight="bold" />
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {activePreset && (
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  {results.length === 0 ? (
                    <p className="text-sm text-muted">
                      Hiện chưa có món phù hợp cho lựa chọn này, bạn thử gợi ý khác nhé.
                    </p>
                  ) : (
                    results.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectItem(item);
                          handleClose();
                        }}
                        className="flex items-center gap-3 rounded-xl border border-border p-2.5 text-left transition-colors hover:border-accent/50 hover:bg-accent/5"
                      >
                        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                          <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-medium text-ink">{item.name}</span>
                          <span className="block text-sm text-accent">{formatVND(item.price)}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.92 }}
        aria-label={open ? "Đóng trợ lý gợi ý món" : "Mở trợ lý gợi ý món"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-soft-lg transition-transform"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <XIcon size={22} weight="bold" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SparkleIcon size={22} weight="fill" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
