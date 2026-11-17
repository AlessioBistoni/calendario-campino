import Link from "next/link";
import { ArrowUpRight, LockKeyhole, LogOut } from "lucide-react";
import { managementPath, type BookingKind } from "@/lib/reservations";
import { signOut } from "@/app/actions";

export function Header({ admin = false, login = false, home = false, section = "campino" }: { admin?: boolean; login?: boolean; home?: boolean; section?: BookingKind }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" aria-label="Torna alla scelta delle prenotazioni" className="brand">
          {home || login ? "Prenotazioni" : section === "eventi" ? "Eventi" : "Campino"}
        </Link>
        {!login && (
          <div className="header-actions">
            <form action={signOut}>
              <button className="header-link" type="submit" aria-label="Esci" title="Esci"><LogOut size={15} aria-hidden /></button>
            </form>
            {!home && <Link className="header-link" href={admin ? `/${section}` : managementPath(section)}>
              {admin ? <ArrowUpRight size={15} aria-hidden /> : <LockKeyhole size={15} aria-hidden />}
              {admin ? "Prenotazione" : "Gestione"}
            </Link>}
          </div>
        )}
      </div>
    </header>
  );
}
