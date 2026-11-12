"use client";

import { useActionState, useId, useRef, useState } from "react";
import { book, signIn, updateCredentials, addMember, deleteMember, deleteBooking, type FormState } from "@/app/actions";
import { formatDay } from "@/lib/dates";

const initial: FormState = {};

export function BookingForm({ today }: { today: string }) {
  const [instance, reset] = useState(0);
  return <BookingFields key={instance} today={today} onReset={() => reset(instance + 1)} />;
}

function BookingFields({ today, onReset }: { today: string; onReset: () => void }) {
  const [state, action, pending] = useActionState(book, initial);
  const [name, setName] = useState("");
  const [day, setDay] = useState("");

  if (state.booking) {
    return (
      <section className="form-section" aria-labelledby="confirmation-title">
        <h1 id="confirmation-title">Prenotazione confermata</h1>
        <dl className="confirmation">
          <div><dt>Nome</dt><dd>{state.booking.name}</dd></div>
          <div><dt>Giorno</dt><dd>{formatDay(state.booking.day)}</dd></div>
        </dl>
        <button type="button" className="button secondary full" onClick={onReset}>Nuova prenotazione</button>
      </section>
    );
  }

  return (
    <section className="form-section" aria-labelledby="booking-title">
      <h1 id="booking-title">Prenota il campino</h1>
      <form className="stack" action={action}>
        <label className="field" htmlFor="booking-name">
          <span>Nome</span>
          <input id="booking-name" name="name" autoComplete="name" placeholder="Nome prenotazione" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field" htmlFor="booking-day">
          <span>Giorno della partita</span>
          <input id="booking-day" type="date" name="day" required min={today} max="9999-12-31" value={day} onChange={(event) => setDay(event.target.value)} />
        </label>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <button className="button primary full" disabled={pending}>
          {pending ? "Salvataggio…" : "Prenota il campino"}
        </button>
      </form>
    </section>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);
  const [username, setUsername] = useState("");
  return (
    <form className="stack" action={action}>
      <label className="field">
        <span>Nome utente</span>
        <input name="username" autoComplete="username" required maxLength={40} value={username} onChange={(event) => setUsername(event.target.value)} />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required maxLength={128} />
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="button primary full" disabled={pending}>
        {pending ? "Accesso in corso…" : "Accedi"}
      </button>
    </form>
  );
}

export function CredentialsForm({ username }: { username: string }) {
  const [state, action, pending] = useActionState(updateCredentials, initial);
  const [newUsername, setUsername] = useState(username);
  return (
    <form className="stack" action={action}>
      <label className="field">
        <span>Nome utente</span>
        <input name="username" autoComplete="username" required minLength={3} maxLength={40} value={newUsername} onChange={(event) => setUsername(event.target.value)} />
      </label>
      <label className="field">
        <span>Password attuale</span>
        <input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} />
      </label>
      <label className="field">
        <span>Nuova password <small>(facoltativa)</small></span>
        <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} aria-describedby="password-hint" />
        <small id="password-hint">Lascia vuoto per conservare la password attuale. La nuova password richiede almeno 12 caratteri.</small>
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.success && <p className="form-success" role="status">{state.success}</p>}
      <button className="button primary full" disabled={pending}>{pending ? "Salvataggio…" : "Salva credenziali"}</button>
    </form>
  );
}


export function AddMemberForm() {
  const [state, action, pending] = useActionState(addMember, initial);
  return (
    <form className="stack" action={action}>
      <label className="field">
        <span>Nome utente</span>
        <input name="username" required minLength={3} maxLength={40} autoComplete="off" />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />
        <small>Da 12 a 128 caratteri.</small>
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.success && <p className="form-success" role="status">{state.success}</p>}
      <button className="button primary full" disabled={pending}>{pending ? "Creazione…" : "Aggiungi membro"}</button>
    </form>
  );
}

export function DeleteMemberForm({ id, username }: { id: string; username: string }) {
  return <ConfirmDeleteForm action={deleteMember.bind(null, id)} label={username} question={`Eliminare ${username}?`} />;
}

export function DeleteBookingForm({ id, name, day }: { id: string; name: string; day: string }) {
  return <ConfirmDeleteForm action={deleteBooking.bind(null, id)} label={`prenotazione di ${name}`} question={`Eliminare la prenotazione di ${name} per ${formatDay(day)}? La partita sarà rimossa anche dal riepilogo degli incassi.`} />;
}

function ConfirmDeleteForm({ action: deleteAction, label, question }: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  label: string;
  question: string;
}) {
  const [state, action, pending] = useActionState(deleteAction, initial);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  return (
    <form action={action} className="member-delete">
      <button type="button" className="button secondary" onClick={() => dialog.current?.showModal()} aria-label={`Elimina ${label}`}>Elimina</button>
      <dialog ref={dialog} className="confirmation-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={(event) => { if (pending) event.preventDefault(); }}>
        <h2 id={titleId}>Conferma eliminazione</h2>
        <p id={descriptionId}>{question}</p>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <div className="confirmation-actions">
          <button type="button" className="button secondary" disabled={pending} autoFocus onClick={() => dialog.current?.close()}>Annulla</button>
          <button type="submit" className="button primary" disabled={pending}>{pending ? "Eliminazione…" : "Conferma eliminazione"}</button>
        </div>
      </dialog>
    </form>
  );
}
