import { ImageResponse } from "next/og";
import type { Booking } from "./bookings";
import { calendarDays, formatMonth, weekdays } from "./dates";

export function calendarImage(month: string, bookings: Booking[]) {
  const days = calendarDays(month);
  const byDay = new Map(bookings.map((booking) => [booking.day, booking.name]));
  const weeks = Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7));
  // Allow even 80-character unbroken names to wrap without clipping.
  const rowHeights = weeks.map((week) => Math.max(124, ...week.map(({ date }) =>
    68 + Math.ceil(Array.from(byDay.get(date) ?? "").length / 8) * 28,
  )));
  const title = formatMonth(month);
  const height = 230 + rowHeights.reduce((sum, value) => sum + value, 0);

  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 40, background: "#ffffff", color: "#181d27", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 100, padding: "0 24px", background: "#17263d", color: "#ffffff" }}>
        <span style={{ fontSize: 36, fontWeight: 700 }}>Campino</span>
        <span style={{ fontSize: 34 }}>{title.charAt(0).toUpperCase() + title.slice(1)}</span>
      </div>
      <div style={{ display: "flex", height: 50, background: "#f0f2f5" }}>
        {weekdays.map((day) => <div key={day} style={{ display: "flex", width: 240, justifyContent: "center", alignItems: "center", fontSize: 22 }}>{day}</div>)}
      </div>
      {weeks.map((week, index) => (
        <div key={index} style={{ display: "flex", height: rowHeights[index] }}>
          {week.map(({ date, day }) => {
            const name = byDay.get(date);
            const inMonth = date.slice(0, 7) === month;
            return (
              <div key={date} style={{ display: "flex", flexDirection: "column", width: 240, padding: 16, border: "1px solid #dde2ea", background: name ? "#edf0f5" : inMonth ? "#ffffff" : "#f9fafc", color: inMonth ? "#181d27" : "#737e8c" }}>
                <span style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>{day}</span>
                {name && <span style={{ fontSize: 22, lineHeight: "28px", wordBreak: "break-all", color: "#17263d" }}>{name}</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>,
    {
      width: 1760,
      height,
      headers: {
        "Content-Disposition": `attachment; filename="calendario-campino-${month}.png"`,
        "Cache-Control": "private, no-store",
      },
    },
  );
}
