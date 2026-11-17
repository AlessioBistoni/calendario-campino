import { requireAccount } from "@/lib/auth";
import { getBookings } from "@/lib/bookings";
import { csvText } from "@/lib/csv";
import { todayInRome } from "@/lib/dates";

export async function GET() {
  await requireAccount();
  const events = await getBookings(undefined, "eventi");
  const rows = [
    ["Data evento", "Prenotato da", "Tipologia"],
    ...events.map((event) => [
      event.day.split("-").reverse().join("/"),
      csvText(event.name),
      csvText(event.event_type ?? ""),
    ]),
  ];
  return new Response(`\uFEFF${rows.map((row) => row.join(";")).join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prenotazioni-eventi-${todayInRome()}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
