import { requireAccount } from "@/lib/auth";
import { getBookings } from "@/lib/bookings";
import { calendarImage } from "@/lib/calendar-image";
import { todayInRome, validMonth } from "@/lib/dates";

export async function GET(request: Request) {
  await requireAccount();
  const month = new URL(request.url).searchParams.get("mese") ?? todayInRome().slice(0, 7);
  if (!validMonth(month)) return new Response("Mese non valido.", { status: 400 });
  return calendarImage(month, await getBookings(month));
}
