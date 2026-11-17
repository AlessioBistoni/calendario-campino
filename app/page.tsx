import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { requireAccount } from "@/lib/auth";

export default async function Home() {
  await requireAccount();
  return (
    <>
      <Header home />
      <main className="public-main">
        <section className="form-section" aria-labelledby="home-heading">
          <h1 id="home-heading">Prenotazioni</h1>
          <div className="section-choices">
            <Link href="/campino" className="section-choice">Campino <ArrowRight size={22} aria-hidden /></Link>
            <Link href="/eventi" className="section-choice event-theme">Eventi <ArrowRight size={22} aria-hidden /></Link>
          </div>
        </section>
      </main>
    </>
  );
}
