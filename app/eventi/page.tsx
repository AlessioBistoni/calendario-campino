import type { Metadata } from "next";
import { BookingForm } from "@/components/forms";
import { Header } from "@/components/header";
import { requireAccount } from "@/lib/auth";
import { todayInRome } from "@/lib/dates";

export const metadata: Metadata = { title: "Prenota un evento" };

export default async function Events() {
  await requireAccount();
  return (
    <div className="event-theme">
      <Header section="eventi" />
      <main className="public-main"><BookingForm kind="eventi" today={todayInRome()} /></main>
    </div>
  );
}
