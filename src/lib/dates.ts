export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function formatISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function todayISO(): string {
  return formatISODate(new Date());
}

export function addDaysISO(from: string, days: number): string {
  const date = parseISODate(from);
  date.setDate(date.getDate() + days);
  return formatISODate(date);
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function startOfDayMs(iso: string): number {
  return parseISODate(iso).getTime();
}

export function daysUntil(iso: string, from = todayISO()): number {
  const delta = startOfDayMs(iso) - startOfDayMs(from);
  return Math.round(delta / 86_400_000);
}

export function formatShortDate(iso: string): string {
  const date = parseISODate(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
