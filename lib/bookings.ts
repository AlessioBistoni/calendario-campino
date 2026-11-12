import { db } from "./db";

export type Booking = {
  id: string;
  day: string;
  name: string;
  amount_cents: number;
  paid: boolean;
};

export async function getBookings(month?: string) {
  const columns = "id, booked_date::text AS day, name, amount_cents, paid_at IS NOT NULL AS paid";
  const result = month
    ? await db().query<Booking>(
        `SELECT ${columns} FROM bookings
         WHERE booked_date >= $1::date AND booked_date < $1::date + interval '1 month' ORDER BY booked_date`,
        [`${month}-01`],
      )
    : await db().query<Booking>(`SELECT ${columns} FROM bookings ORDER BY booked_date`);
  return result.rows;
}

export function totals(bookings: Booking[]) {
  return bookings.reduce((sum, booking) => {
    sum.expected += booking.amount_cents;
    if (booking.paid) sum.paid += booking.amount_cents;
    return sum;
  }, { expected: 0, paid: 0 });
}
