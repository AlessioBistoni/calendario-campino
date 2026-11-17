import { db } from "./db";
import type { BookingKind, EventType } from "./reservations";

export type Booking = {
  id: string;
  day: string;
  name: string;
  amount_cents: number;
  paid: boolean;
  event_type: EventType | null;
};

export async function getBookings(month?: string, kind: BookingKind = "campino") {
  const table = kind === "eventi" ? "events" : "bookings";
  const columns = kind === "eventi"
    ? "id, booked_date::text AS day, name, event_type, 0 AS amount_cents, false AS paid"
    : "id, booked_date::text AS day, name, NULL AS event_type, amount_cents, paid_at IS NOT NULL AS paid";
  const result = month
    ? await db().query<Booking>(
        `SELECT ${columns} FROM ${table}
         WHERE booked_date >= $1::date AND booked_date < $1::date + interval '1 month' ORDER BY booked_date`,
        [`${month}-01`],
      )
    : await db().query<Booking>(`SELECT ${columns} FROM ${table} ORDER BY booked_date`);
  return result.rows;
}

export function totals(bookings: Booking[]) {
  return bookings.reduce((sum, booking) => {
    sum.expected += booking.amount_cents;
    if (booking.paid) sum.paid += booking.amount_cents;
    return sum;
  }, { expected: 0, paid: 0 });
}
