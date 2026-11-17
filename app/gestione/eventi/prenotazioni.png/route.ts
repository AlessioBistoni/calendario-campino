import { requireAccount } from "@/lib/auth";
import { getBookings } from "@/lib/bookings";
import { eventsReportImage } from "@/lib/events-report-image";

export async function GET() {
  await requireAccount();
  return eventsReportImage(await getBookings(undefined, "eventi"));
}
