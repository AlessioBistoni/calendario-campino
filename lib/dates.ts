const italianDate = new Intl.DateTimeFormat("it-IT", {
  timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric",
});
const italianMonth = new Intl.DateTimeFormat("it-IT", {
  timeZone: "UTC", month: "long", year: "numeric",
});
const italianEuro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export const weekdays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export function todayInRome() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts();
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1000-01-01") return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
}

export function validMonth(value: string) {
  return validDate(`${value}-01`);
}

export function shiftMonth(month: string, offset: number) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

export function calendarDays(month: string) {
  const first = new Date(`${month}-01T00:00:00Z`);
  const leading = (first.getUTCDay() + 6) % 7;
  const end = new Date(first);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  return Array.from({ length: Math.ceil((leading + end.getUTCDate()) / 7) * 7 }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(index - leading + 1);
    return { date: date.toISOString().split("T")[0], day: date.getUTCDate() };
  });
}

export function formatDay(date: string) {
  return italianDate.format(new Date(`${date}T00:00:00Z`));
}

export function formatMonth(month: string) {
  return italianMonth.format(new Date(`${month}-01T00:00:00Z`));
}

export function euro(cents: number) {
  return italianEuro.format(cents / 100);
}
