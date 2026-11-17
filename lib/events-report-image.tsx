import { ImageResponse } from "next/og";
import type { Booking } from "./bookings";
import { eventTypes } from "./reservations";
import { todayInRome } from "./dates";

const titles = ["Compleanni", "Eventi CVA", "Eventi esterni"];
const rowHeight = (name: string) => Math.max(72, 28 + Math.ceil(Array.from(name).length / 24) * 32);

export function eventsReportImage(bookings: Booking[]) {
  const groups = eventTypes.map((type, index) => ({
    title: titles[index],
    rows: bookings.filter((booking) => booking.event_type === type).sort((a, b) => a.day.localeCompare(b.day) || a.name.localeCompare(b.name, "it")),
  }));
  const height = 208 + groups.reduce((sum, group) => sum + 132 + (group.rows.length ? group.rows.reduce((total, row) => total + rowHeight(row.name), 0) : 72), 0);
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 40, background: "#ffffff", color: "#181d27", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", height: 96, flexShrink: 0, background: "#573049", color: "white", padding: 24 }}>
        <span style={{ fontSize: 36, fontWeight: 700 }}>Prenotazioni eventi</span>
      </div>
      {groups.map((group) => <div key={group.title} style={{ display: "flex", flexDirection: "column", marginTop: 28, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 60, padding: "0 20px", background: "#f4edf1", color: "#573049" }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>{group.title}</span>
          <span style={{ fontSize: 20 }}>{group.rows.length} {group.rows.length === 1 ? "prenotazione" : "prenotazioni"}</span>
        </div>
        <div style={{ display: "flex", height: 44, alignItems: "center", padding: "0 20px", color: "#68707c", fontSize: 18, borderBottom: "1px solid #dce0e5" }}>
          <span style={{ width: 210 }}>DATA</span><span>NOME</span>
        </div>
        {group.rows.length ? group.rows.map((row) => <div key={row.id} style={{ display: "flex", alignItems: "center", height: rowHeight(row.name), padding: "12px 20px", borderBottom: "1px solid #dce0e5", fontSize: 25 }}>
          <span style={{ width: 210, flexShrink: 0 }}>{row.day.split("-").reverse().join("/")}</span>
          <span style={{ width: 630, lineHeight: "32px", wordBreak: "break-all" }}>{row.name}</span>
        </div>) : <div style={{ display: "flex", alignItems: "center", height: 72, padding: "0 20px", color: "#68707c", fontSize: 22 }}>Nessuna prenotazione</div>}
      </div>)}
      <div style={{ display: "flex", marginTop: 16, fontSize: 18, color: "#68707c" }}>Totale: {bookings.length} {bookings.length === 1 ? "prenotazione" : "prenotazioni"} · Aggiornato al {todayInRome().split("-").reverse().join("/")}</div>
    </div>,
    { width: 960, height, headers: {
      "Content-Disposition": `attachment; filename="resoconto-eventi-${todayInRome()}.png"`,
      "Cache-Control": "private, no-store",
    } },
  );
}
