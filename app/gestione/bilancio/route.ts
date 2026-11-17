import { requireAccount } from "@/lib/auth";
import { getBookings, totals } from "@/lib/bookings";
import { todayInRome } from "@/lib/dates";

import { csvText } from "@/lib/csv";

function decimal(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export async function GET() {
  await requireAccount();
  const bookings = await getBookings();
  const sum = totals(bookings);
  const rows = [
    ["Data partita", "Prenotato da", "Stato", "Previsto (EUR)", "Incassato (EUR)", "Da incassare (EUR)"],
    ...bookings.map((booking) => [
      booking.day.split("-").reverse().join("/"),
      csvText(booking.name),
      booking.paid ? "Pagato" : "Da pagare",
      decimal(booking.amount_cents),
      decimal(booking.paid ? booking.amount_cents : 0),
      decimal(booking.paid ? 0 : booking.amount_cents),
    ]),
    ["TOTALE", "", "", decimal(sum.expected), decimal(sum.paid), decimal(sum.expected - sum.paid)],
  ];
  return new Response(`\uFEFF${rows.map((row) => row.join(";")).join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="incassi-campino-${todayInRome()}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
