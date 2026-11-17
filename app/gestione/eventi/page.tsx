import type { Metadata } from "next";
import { CalendarDashboard } from "@/components/calendar-dashboard";

export const metadata: Metadata = { title: "Gestione eventi", robots: { index: false } };

export default async function EventsDashboard({ searchParams }: { searchParams: Promise<{ mese?: string }> }) {
  const { mese } = await searchParams;
  return <CalendarDashboard kind="eventi" monthQuery={mese} />;
}
