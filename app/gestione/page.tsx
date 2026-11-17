import type { Metadata } from "next";
import { CalendarDashboard } from "@/components/calendar-dashboard";

export const metadata: Metadata = { title: "Gestione campino", robots: { index: false } };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ mese?: string }> }) {
  const { mese } = await searchParams;
  return <CalendarDashboard monthQuery={mese} />;
}
