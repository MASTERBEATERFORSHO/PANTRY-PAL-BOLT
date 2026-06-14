import { useSyncExternalStore } from "react";
import { addDays, toISODate } from "@/lib/pantry-utils";
import { INGREDIENTS, type Ingredient } from "@/lib/ingredients-data";

export interface PantryItem {
  id: string;
  ingredient_id: string | null;
  custom_name?: string | null;
  display_name: string;
  emoji: string;
  quantity: string;
  purchase_date: string;
  ripeness?: string | null;
  shelf_life_days: number;
  optimal_window_start_day: number;
  optimal_window_end_day: number;
  expiry_date: string;
  storage_tips?: string | null;
  category?: string | null;
  created_at: string;
}

const KEY = "pantrypal:items:v1";
const listeners = new Set<() => void>();
let cache: PantryItem[] = [];
let hydrated = false;

function read(): PantryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PantryItem[]) : [];
  } catch {
    return [];
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  cache = read();
  hydrated = true;
}

function write(next: PantryItem[]) {
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  ensureHydrated();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot() {
  ensureHydrated();
  return cache;
}

const emptySnapshot: PantryItem[] = [];

export function usePantry(): PantryItem[] {
  return useSyncExternalStore(subscribe, snapshot, () => emptySnapshot);
}

export function getPantry(): PantryItem[] {
  ensureHydrated();
  return cache;
}

function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export type ManualCategory = "produce" | "dairy" | "meat" | "pantry" | "cooked";

export const MANUAL_CATEGORY_PRESETS: Record<
  ManualCategory,
  { label: string; emoji: string; shelf: number; goldenStart: number; goldenEnd: number; tip: string }
> = {
  produce: { label: "Fresh produce", emoji: "🥬", shelf: 5, goldenStart: 1, goldenEnd: 3, tip: "Store in the fridge crisper drawer." },
  dairy:   { label: "Dairy",         emoji: "🧀", shelf: 7, goldenStart: 1, goldenEnd: 5, tip: "Keep refrigerated, sealed tightly." },
  meat:    { label: "Meat / Fish",   emoji: "🍖", shelf: 3, goldenStart: 1, goldenEnd: 2, tip: "Refrigerate below 4°C; cook promptly." },
  pantry:  { label: "Dry / Pantry",  emoji: "🌾", shelf: 180, goldenStart: 0, goldenEnd: 0, tip: "Store in a cool, dry place, sealed." },
  cooked:  { label: "Cooked / Leftovers", emoji: "🍱", shelf: 3, goldenStart: 0, goldenEnd: 1, tip: "Cool quickly, refrigerate within 2 hours." },
};

export type AddPayload =
  | {
      kind: "ingredient";
      ingredient: Ingredient;
      quantity: string;
      purchaseDate: string;
      ripeness?: string | null;
    }
  | {
      kind: "custom";
      name: string;
      category: ManualCategory;
      quantity: string;
      purchaseDate: string;
    };

export function addPantryItem(p: AddPayload) {
  ensureHydrated();
  let item: PantryItem;
  if (p.kind === "custom") {
    const preset = MANUAL_CATEGORY_PRESETS[p.category];
    const shelf = preset.shelf;
    item = {
      id: uid(),
      ingredient_id: null,
      custom_name: p.name,
      display_name: p.name,
      emoji: preset.emoji,
      quantity: p.quantity,
      purchase_date: p.purchaseDate,
      shelf_life_days: shelf,
      optimal_window_start_day: preset.goldenStart,
      optimal_window_end_day: preset.goldenEnd,
      expiry_date: toISODate(addDays(new Date(p.purchaseDate), shelf)),
      storage_tips: preset.tip,
      category: preset.label,
      created_at: new Date().toISOString(),
    };
  } else {
    const i = p.ingredient;
    let shelf = i.base_shelf_life_days;
    let startW = i.optimal_window_start_day;
    let endW = i.optimal_window_end_day;
    if (i.ripeness_applicable) {
      if (p.ripeness === "Unripe") {
        // +2-3 days, shift golden window later
        const bump = shelf >= 14 ? 3 : 2;
        shelf = shelf + bump;
        startW = startW + bump;
        endW = Math.min(shelf - 1, endW + bump);
      } else if (p.ripeness === "Overripe") {
        // -2 days, golden zone immediate (day 1-2)
        shelf = Math.max(2, shelf - 2);
        startW = 0;
        endW = Math.min(shelf - 1, 2);
      }
      // Ripe: leave as-is
    }
    item = {
      id: uid(),
      ingredient_id: i.id,
      display_name: i.variant_name,
      emoji: i.emoji,
      quantity: p.quantity,
      purchase_date: p.purchaseDate,
      ripeness: i.ripeness_applicable ? p.ripeness ?? null : null,
      shelf_life_days: shelf,
      optimal_window_start_day: Math.max(0, Math.min(startW, shelf - 1)),
      optimal_window_end_day: Math.max(0, Math.min(endW, shelf)),
      expiry_date: toISODate(addDays(new Date(p.purchaseDate), shelf)),
      storage_tips: i.storage_tips,
      category: i.category,
      created_at: new Date().toISOString(),
    };
  }
  const next = [...cache, item].sort((a, b) =>
    a.expiry_date.localeCompare(b.expiry_date),
  );
  write(next);
}

export function removePantryItem(id: string) {
  ensureHydrated();
  write(cache.filter((x) => x.id !== id));
}

export function searchIngredients(q: string): Ingredient[] {
  if (!q.trim()) return [];
  const s = q.toLowerCase();
  return INGREDIENTS.filter(
    (i) =>
      i.name.toLowerCase().includes(s) ||
      i.variant_name.toLowerCase().includes(s),
  );
}