"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, SmileyMehIcon } from "@phosphor-icons/react/ssr";
import type { Category, MenuItem } from "@/lib/types";
import { SiteHeader } from "./SiteHeader";
import { CategoryTabs } from "./CategoryTabs";
import { ProductCard } from "./ProductCard";
import { ProductDetailModal } from "./ProductDetailModal";
import { CartDrawer } from "./CartDrawer";
import { WeatherMapSection } from "./WeatherMapSection";
import { RecommendWidget } from "./RecommendWidget";
import { EmptyState } from "@/components/ui/EmptyState";

export function ClientHome({
  categories,
  items,
}: {
  categories: Category[];
  items: MenuItem[];
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MenuItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = q ? true : item.categoryId === activeCategory;
      const matchesQuery = q ? item.name.toLowerCase().includes(q) : true;
      return matchesCategory && matchesQuery;
    });
  }, [items, activeCategory, query]);

  return (
    <>
      <SiteHeader />

      <section className="relative flex min-h-[70dvh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center sm:px-6">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-[0.14]"
          style={{ backgroundImage: "url(/menu-images/hero-cafe.jpg)" }}
        />
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-accent">
          Rang Mộc Coffee
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Cà phê rang mộc, pha mỗi ngày cho bạn
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
          Chọn món yêu thích, đặt trước và ra quầy nhận, không cần chờ đợi.
        </p>
        <a
          href="#menu"
          className="mt-7 inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-base font-medium text-accent-ink transition-transform active:scale-[0.98]"
        >
          Xem thực đơn
        </a>
      </section>

      <div id="menu">
        <CategoryTabs
          categories={categories}
          activeId={activeCategory}
          onChange={(id) => {
            setActiveCategory(id);
            setQuery("");
          }}
        />
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <div className="relative mb-5 max-w-sm">
          <MagnifyingGlassIcon
            size={17}
            weight="bold"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm món (vd: matcha, bánh...)"
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<SmileyMehIcon size={40} weight="light" />}
            title="Không tìm thấy món phù hợp"
            description="Thử tìm với từ khóa khác hoặc chọn danh mục khác."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item) => (
              <ProductCard key={item.id} item={item} onOpen={() => setSelected(item)} />
            ))}
          </div>
        )}
      </main>

      <WeatherMapSection />

      <footer className="border-t border-border/70 py-8 text-center text-sm text-muted">
        <p>Rang Mộc Coffee - 24 Nguyễn Huệ, Quận 1, TP.HCM</p>
        <p className="mt-1">Mở cửa 07:00 - 22:00 hằng ngày</p>
      </footer>

      <ProductDetailModal item={selected} onClose={() => setSelected(null)} />
      <CartDrawer />
      <RecommendWidget items={items} categories={categories} onSelectItem={setSelected} />
    </>
  );
}
