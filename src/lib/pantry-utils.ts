export type ZoneStatus = "fresh" | "golden" | "past" | "expired";

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export interface CountdownInfo {
  daysSincePurchase: number;
  daysRemaining: number;
  totalDays: number;
  optimalStart: number;
  optimalEnd: number;
  pctElapsed: number;
  pctRemaining: number;
  goldenStartPct: number;
  goldenEndPct: number;
  status: ZoneStatus;
}

export function computeCountdown(args: {
  purchaseDate: string | Date;
  shelfLifeDays: number;
  optimalStart: number;
  optimalEnd: number;
  now?: Date;
}): CountdownInfo {
  const now = args.now ?? new Date();
  const purchase = typeof args.purchaseDate === "string" ? new Date(args.purchaseDate) : args.purchaseDate;
  const totalDays = Math.max(1, args.shelfLifeDays);
  const daysSincePurchase = Math.max(0, daysBetween(purchase, now));
  const daysRemaining = totalDays - daysSincePurchase;

  const pctElapsed = Math.min(100, (daysSincePurchase / totalDays) * 100);
  const pctRemaining = Math.max(0, 100 - pctElapsed);
  const goldenStartPct = Math.min(100, (args.optimalStart / totalDays) * 100);
  const goldenEndPct = Math.min(100, (args.optimalEnd / totalDays) * 100);

  let status: ZoneStatus;
  if (daysRemaining <= 0) status = "expired";
  else if (daysRemaining <= Math.max(1, Math.round(totalDays * 0.15))) status = "past";
  else if (daysSincePurchase >= args.optimalStart && daysSincePurchase <= args.optimalEnd) status = "golden";
  else status = "fresh";

  return {
    daysSincePurchase,
    daysRemaining,
    totalDays,
    optimalStart: args.optimalStart,
    optimalEnd: args.optimalEnd,
    pctElapsed,
    pctRemaining,
    goldenStartPct,
    goldenEndPct,
    status,
  };
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}