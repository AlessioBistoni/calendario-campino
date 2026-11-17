CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booked_date date NOT NULL UNIQUE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  amount_cents integer NOT NULL DEFAULT 5000 CHECK (amount_cents > 0),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  revision integer NOT NULL DEFAULT 1
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'accounts' AND column_name = 'role') THEN
    ALTER TABLE accounts ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
    ALTER TABLE sessions ADD COLUMN account_id uuid;
    UPDATE sessions SET account_id = accounts.id FROM accounts WHERE sessions.role = accounts.role;
    ALTER TABLE sessions DROP CONSTRAINT sessions_role_fkey;
    ALTER TABLE accounts DROP CONSTRAINT accounts_pkey;
    ALTER TABLE accounts ADD PRIMARY KEY (id);
    ALTER TABLE sessions DROP COLUMN role;
    ALTER TABLE accounts DROP COLUMN role;
    ALTER TABLE sessions ALTER COLUMN account_id SET NOT NULL;
    ALTER TABLE sessions ADD CONSTRAINT sessions_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  revision integer NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS login_limits (
  client_hash text PRIMARY KEY,
  attempts integer NOT NULL,
  window_started_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booked_date date NOT NULL UNIQUE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  event_type text NOT NULL CHECK (event_type IN ('Compleanno', 'Evento CVA', 'Evento esterno')),
  created_at timestamptz NOT NULL DEFAULT now()
);
