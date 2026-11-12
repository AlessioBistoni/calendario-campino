import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddMemberForm, CredentialsForm, DeleteMemberForm } from "@/components/forms";
import { Header } from "@/components/header";
import { requireAccount } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Account" };

export default async function Accounts() {
  const account = await requireAccount();
  const members = await db().query<{ id: string; username: string }>("SELECT id, username FROM accounts ORDER BY lower(username), id");
  return (
    <>
      <Header admin />
      <main className="dashboard">
        <Link className="back-link" href="/gestione"><ArrowLeft size={16} aria-hidden /> Calendario</Link>
        <div className="dashboard-heading"><h1>Account</h1></div>
        <section className="panel members-panel" aria-labelledby="members-heading">
          <div className="panel-heading"><h2 id="members-heading">Membri</h2></div>
          <ul className="member-list">
            {members.rows.map((member) => (
              <li key={member.id}>
                <span className="member-name">{member.username}{member.id === account.id && <small>Il tuo account</small>}</span>
                <DeleteMemberForm id={member.id} username={member.username} />
              </li>
            ))}
          </ul>
        </section>
        <div className="credentials-grid">
          <section className="panel credentials-panel" aria-labelledby="new-member-heading">
            <h2 id="new-member-heading">Aggiungi membro</h2>
            <AddMemberForm />
          </section>
          <section className="panel credentials-panel" aria-labelledby="my-account-heading">
            <h2 id="my-account-heading">Il tuo account</h2>
            <CredentialsForm username={account.username} />
          </section>
        </div>
      </main>
    </>
  );
}
