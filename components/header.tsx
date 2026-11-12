import Link from "next/link";
import { ArrowUpRight, LockKeyhole, LogOut } from "lucide-react";
import { signOut } from "@/app/actions";

export function Header({ admin = false, login = false }: { admin?: boolean; login?: boolean }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href={admin ? "/gestione" : "/"} className="brand">
          Campino
        </Link>
        {!login && (
          <div className="header-actions">
            <form action={signOut}>
              <button className="header-link" type="submit" aria-label="Esci" title="Esci"><LogOut size={15} aria-hidden /></button>
            </form>
            <Link className="header-link" href={admin ? "/" : "/gestione"}>
              {admin ? <ArrowUpRight size={15} aria-hidden /> : <LockKeyhole size={15} aria-hidden />}
              {admin ? "Prenotazione" : "Gestione"}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
