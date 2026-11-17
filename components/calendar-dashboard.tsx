import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, KeyRound } from "lucide-react";
import { DeleteBookingForm } from "@/components/forms";
import { Header } from "@/components/header";
import { requireAccount } from "@/lib/auth";
import { getBookings, totals, type Booking } from "@/lib/bookings";
import { calendarDays, euro, formatDay, formatMonth, shiftMonth, todayInRome, validMonth, weekdays } from "@/lib/dates";
import { setPayment } from "@/app/actions";
import { managementPath, type BookingKind } from "@/lib/reservations";

export async function CalendarDashboard({ monthQuery, kind = "campino" }: { monthQuery?: string; kind?: BookingKind }) {
  await requireAccount();
  const mese = monthQuery;
  const events = kind === "eventi";
  const path = managementPath(kind);
  const today = todayInRome();
  const currentMonth = today.slice(0, 7);
  const month = typeof mese === "string" && validMonth(mese) ? mese : currentMonth;
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const bookings = await getBookings(month, kind);
  const byDay = new Map(bookings.map((booking) => [booking.day, booking]));
  const sum = totals(bookings);
  const label = formatMonth(month);

  return (
    <div className={events ? "event-theme" : undefined}>
      <Header admin section={kind} />
      <main className="dashboard">
        <div className="dashboard-heading">
          <h1>{events ? "Gestione eventi" : "Gestione campino"}</h1>
          <div className="dashboard-actions">
            <a className="button primary" href={events ? `${path}/prenotazioni.csv` : "/gestione/bilancio"}><Download size={17} aria-hidden /> {events ? "Scarica prenotazioni" : "Scarica incassi"}</a>
            <Link className="button secondary" href="/gestione/credenziali"><KeyRound size={16} aria-hidden /> Account</Link>
          </div>
        </div>
        <div className={events ? "stats event-stats" : "stats"} aria-label="Riepilogo del mese">
          <div className="stat"><span>Prenotazioni del mese</span><strong>{bookings.length}</strong></div>
          {!events && (
            <>
              <div className="stat"><span>Incassato</span><strong>{euro(sum.paid)}</strong></div>
              <div className="stat"><span>Da incassare</span><strong>{euro(sum.expected - sum.paid)}</strong></div>
            </>
          )}
        </div>
        <section className="calendar panel" aria-labelledby="calendar-heading">
          <div className="panel-heading">
            <h2 id="calendar-heading">{label}</h2>
            <nav className="month-nav" aria-label="Navigazione del calendario">
              {month !== currentMonth && <Link className="button secondary" href={path}>Oggi</Link>}
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
                    <a className={`calendar-booking ${events ? "event-booking" : booking.paid ? "paid" : "unpaid"}`} href={`#partita-${booking.id}`} aria-label={`${formatDay(date)}, ${booking.name}, ${booking.event_type ?? (booking.paid ? "pagato" : "da pagare")}`}>
                      <span className="dot" aria-hidden /><span>{booking.name}{booking.event_type && <small>{booking.event_type}</small>}</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          <div className="calendar-export">
            <a className="button secondary" href={`${path}/calendario.png?mese=${month}`} download={`calendario-${kind}-${month}.png`}><Download size={17} aria-hidden /> Scarica calendario PNG</a>
          </div>
          {!events && <div className="legend">
            <span className="paid"><span className="dot" /> Pagato</span>
            <span className="unpaid"><span className="dot" /> Da pagare</span>
          </div>}
        </section>
        <section className="panel list-panel" aria-labelledby="bookings-heading">
          <div className="panel-heading"><h2 id="bookings-heading">Prenotazioni del mese</h2></div>
          {bookings.length ? <ul className={events ? "booking-list event-list" : "booking-list"}>{bookings.map((booking) => <BookingRow key={booking.id} booking={booking} kind={kind} />)}</ul>
            : <p className="empty-state">Nessuna prenotazione per questo mese.</p>}
        </section>
      </main>
    </div>
  );
}

function BookingRow({ booking, kind }: { booking: Booking; kind: BookingKind }) {
  return (
    <li id={`partita-${booking.id}`}>
      <div className="booking-person">
        <strong>{booking.name}</strong>
        {booking.event_type && <span className="event-type-label">{booking.event_type}</span>}
        <time dateTime={booking.day}>{formatDay(booking.day)}</time>
      </div>
      {kind === "campino" && (
        <>
          <span className="booking-amount">{euro(booking.amount_cents)}</span>
          <span className={`payment-label ${booking.paid ? "paid" : "unpaid"}`}><span className="dot" />{booking.paid ? "Pagato" : "Da pagare"}</span>
        </>
      )}
      <div className="booking-controls">
        {kind === "campino" && <form action={setPayment.bind(null, booking.id, !booking.paid)}>
          <button className="button secondary" aria-label={`${booking.paid ? "Annulla pagamento" : "Segna come pagato"} per ${booking.name}`}>
            {booking.paid ? "Annulla pagamento" : "Segna come pagato"}
          </button>
        </form>}
        <DeleteBookingForm id={booking.id} name={booking.name} day={booking.day} kind={kind} />
      </div>
    </li>
  );
}
