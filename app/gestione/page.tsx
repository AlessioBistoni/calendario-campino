import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, KeyRound } from "lucide-react";
import { DeleteBookingForm } from "@/components/forms";
import { Header } from "@/components/header";
import { requireAccount } from "@/lib/auth";
import { getBookings, totals, type Booking } from "@/lib/bookings";
import { calendarDays, euro, formatDay, formatMonth, shiftMonth, todayInRome, validMonth, weekdays } from "@/lib/dates";
import { setPayment } from "../actions";

export const metadata: Metadata = { title: "Gestione", robots: { index: false } };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ mese?: string }> }) {
  await requireAccount();
  const { mese } = await searchParams;
  const today = todayInRome();
  const currentMonth = today.slice(0, 7);
  const month = typeof mese === "string" && validMonth(mese) ? mese : currentMonth;
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const bookings = await getBookings(month);
  const byDay = new Map(bookings.map((booking) => [booking.day, booking]));
  const sum = totals(bookings);
  const label = formatMonth(month);

  return (
    <>
      <Header admin />
      <main className="dashboard">
        <div className="dashboard-heading">
          <h1>Gestione campino</h1>
          <div className="dashboard-actions">
            <a className="button primary" href="/gestione/bilancio"><Download size={17} aria-hidden /> Scarica incassi</a>
            <Link className="button secondary" href="/gestione/credenziali"><KeyRound size={16} aria-hidden /> Account</Link>
          </div>
        </div>
        <div className="stats" aria-label="Riepilogo del mese">
          <div className="stat"><span>Prenotazioni del mese</span><strong>{bookings.length}</strong></div>
          <div className="stat"><span>Incassato</span><strong>{euro(sum.paid)}</strong></div>
          <div className="stat"><span>Da incassare</span><strong>{euro(sum.expected - sum.paid)}</strong></div>
        </div>
        <section className="calendar panel" aria-labelledby="calendar-heading">
          <div className="panel-heading">
            <h2 id="calendar-heading">{label}</h2>
            <nav className="month-nav" aria-label="Navigazione del calendario">
              {month !== currentMonth && <Link className="button secondary" href="/gestione">Oggi</Link>}
              {validMonth(previous) && <Link className="button secondary square" href={`?mese=${previous}`} aria-label="Mese precedente"><ChevronLeft size={19} aria-hidden /></Link>}
              {validMonth(next) && <Link className="button secondary square" href={`?mese=${next}`} aria-label="Mese successivo"><ChevronRight size={19} aria-hidden /></Link>}
            </nav>
          </div>
          <div className="calendar-grid">
            {weekdays.map((day) => <span className="weekday" key={day}>{day}</span>)}
            {calendarDays(month).map(({ date, day }) => {
              const booking = byDay.get(date);
              const inMonth = date.slice(0, 7) === month;
              return (
                <div className={`calendar-cell${inMonth ? "" : " outside"}${date === today ? " today" : ""}`} key={date}>
                  <time dateTime={date} aria-current={date === today ? "date" : undefined}>{day}</time>
                  {booking && (
                    <a className={`calendar-booking ${booking.paid ? "paid" : "unpaid"}`} href={`#partita-${booking.id}`} aria-label={`${formatDay(date)}, ${booking.name}, ${booking.paid ? "pagato" : "da pagare"}`}>
                      <span className="dot" aria-hidden /><span>{booking.name}</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          <div className="calendar-export">
            <a className="button secondary" href={`/gestione/calendario.png?mese=${month}`} download={`calendario-campino-${month}.png`}><Download size={17} aria-hidden /> Scarica calendario PNG</a>
          </div>
          <div className="legend">
            <span className="paid"><span className="dot" /> Pagato</span>
            <span className="unpaid"><span className="dot" /> Da pagare</span>
          </div>
        </section>
        <section className="panel list-panel" aria-labelledby="bookings-heading">
          <div className="panel-heading"><h2 id="bookings-heading">Prenotazioni del mese</h2></div>
          {bookings.length ? <ul className="booking-list">{bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)}</ul>
            : <p className="empty-state">Nessuna prenotazione per questo mese.</p>}
        </section>
      </main>
    </>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  return (
    <li id={`partita-${booking.id}`}>
      <div className="booking-person">
        <strong>{booking.name}</strong>
        <time dateTime={booking.day}>{formatDay(booking.day)}</time>
      </div>
      <span className="booking-amount">{euro(booking.amount_cents)}</span>
      <span className={`payment-label ${booking.paid ? "paid" : "unpaid"}`}><span className="dot" />{booking.paid ? "Pagato" : "Da pagare"}</span>
      <div className="booking-controls">
      <form action={setPayment.bind(null, booking.id, !booking.paid)}>
        <button className="button secondary" aria-label={`${booking.paid ? "Annulla pagamento" : "Segna come pagato"} per ${booking.name}`}>
          {booking.paid ? "Annulla pagamento" : "Segna come pagato"}
        </button>
      </form>
      <DeleteBookingForm id={booking.id} name={booking.name} day={booking.day} />
      </div>
    </li>
  );
}
