import { BookingForm } from "@/components/forms";
import { Header } from "@/components/header";
import { requireAccount } from "@/lib/auth";
import { todayInRome } from "@/lib/dates";

export default async function Home() {
  await requireAccount();
  return (
    <>
      <Header />
      <main className="public-main"><BookingForm today={todayInRome()} /></main>
    </>
  );
}
