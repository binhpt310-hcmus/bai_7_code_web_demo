import type { Category, MenuItem } from "@/lib/types";

// Bo quy tac goi y mon theo tu khoa (rule-based, khong goi API/LLM nao ca).
// Moi preset chi la mot danh sach tu khoa duoc so khop (substring, khong phan
// biet hoa/thuong) voi ten mon + mo ta mon + ten danh muc cua mon do. Logic
// hoan toan chay o client, khong doi schema du lieu.
export interface RecommendPreset {
  id: string;
  label: string;
  icon: "leaf" | "snowflake" | "fire" | "forkKnife" | "coffee";
  keywords: string[];
}

export const RECOMMEND_PRESETS: RecommendPreset[] = [
  {
    id: "less-sweet",
    label: "Ít ngọt",
    icon: "coffee",
    keywords: ["đậm vị", "vị đắng", "không thêm đường", "cà phê đen"],
  },
  {
    id: "healthy",
    label: "Healthy / Ít calo",
    icon: "leaf",
    keywords: ["không thêm đường", "cam tươi", "vị thanh mát", "cam vắt"],
  },
  {
    id: "cool-down",
    label: "Giải nhiệt",
    icon: "snowflake",
    keywords: ["đá xay", "soda", "trà", "đá lạnh"],
  },
  {
    id: "energy",
    label: "Cần năng lượng",
    icon: "fire",
    keywords: ["cà phê", "espresso", "cappuccino"],
  },
  {
    id: "hungry",
    label: "Đói bụng / ăn nhẹ",
    icon: "forkKnife",
    keywords: ["bánh", "ăn nhẹ"],
  },
];

const MAX_RESULTS = 4;

export function getRecommendations(
  preset: RecommendPreset,
  items: MenuItem[],
  categories: Category[]
): MenuItem[] {
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
  const keywords = preset.keywords.map((k) => k.toLowerCase());

  const matches = items.filter((item) => {
    if (!item.available) return false;
    const haystack = `${item.name} ${item.description} ${categoryNameById.get(item.categoryId) ?? ""}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });

  return matches.slice(0, MAX_RESULTS);
}
