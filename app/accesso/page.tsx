import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms";
import { Header } from "@/components/header";
import { currentAccount } from "@/lib/auth";

export const metadata: Metadata = { title: "Accedi" };

export default async function Login({ searchParams }: { searchParams: Promise<{ area?: string; aggiornato?: string }> }) {
  const { aggiornato } = await searchParams;
  const account = await currentAccount();
  if (account) redirect("/");
  return (
    <>
      <Header login />
      <main className="public-main">
        <section className="form-section" aria-labelledby="login-heading">
          <h1 id="login-heading">Accedi a Campino</h1>
          {aggiornato === "1" && <p className="form-success" role="status">Credenziali aggiornate. Accedi per continuare.</p>}
          <LoginForm />
        </section>
      </main>
    </>
  );
}
