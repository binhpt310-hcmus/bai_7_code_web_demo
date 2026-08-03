"use client";

import type { Category } from "@/lib/types";

export function CategoryTabs({
  categories,
  activeId,
  onChange,
}: {
  categories: Category[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="sticky top-16 z-30 border-b border-border/70 bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 [scrollbar-width:none]">
        {categories.map((cat) => {
          const active = cat.id === activeId;
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
                active
                  ? "bg-ink text-white"
                  : "bg-surface text-muted hover:text-ink border border-border"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
