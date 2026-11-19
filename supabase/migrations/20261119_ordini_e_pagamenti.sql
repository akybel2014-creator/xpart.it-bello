-- ============================================================================
-- CasaLavoroPRO - Sezione Automotive
-- Schema Ordini e Transazioni di Pagamento per Supabase (PostgreSQL)
-- Compatibile con provider esterni (es. Stripe Checkout / PaymentIntents)
-- ============================================================================

-- Estensione necessaria per gen_random_uuid() (già attiva di default su Supabase)
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. FUNZIONE HELPER PER AGGIORNAMENTO AUTOMATICO `updated_at`
-- ----------------------------------------------------------------------------
create or replace function public.aggiorna_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. TABELLA `public.ordini`
-- Memorizza l'ordine B2B, lo snapshot degli articoli acquistati e lo stato
-- complessivo dell'evasione.
-- ----------------------------------------------------------------------------
create table if not exists public.ordini (
  id                uuid primary key default gen_random_uuid(),
  codice_ordine     text not null unique,
  utente_id         uuid not null references auth.users(id) on delete restrict,
  stato             text not null default 'pending'
                    check (stato in ('pending', 'paid', 'failed', 'refunded', 'processing', 'shipped', 'delivered', 'cancelled')),
  articoli          jsonb not null default '[]'::jsonb,
  imponibile        numeric(10, 2) not null check (imponibile >= 0),
  iva               numeric(10, 2) not null default 0 check (iva >= 0),
  spese_spedizione  numeric(10, 2) not null default 0 check (spese_spedizione >= 0),
  importo_totale    numeric(10, 2) not null check (importo_totale >= 0),
  valuta            char(3) not null default 'EUR',
  dati_fatturazione jsonb,
  note_ordine       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_ordini_updated_at on public.ordini;
create trigger trg_ordini_updated_at
  before update on public.ordini
  for each row
  execute function public.aggiorna_timestamp_updated_at();

-- ----------------------------------------------------------------------------
-- 3. TABELLA `public.transazioni_pagamento`
-- Storico immutabile dei tentativi di pagamento e delle conferme del provider
-- (Stripe PaymentIntent / Checkout Session).
-- ----------------------------------------------------------------------------
create table if not exists public.transazioni_pagamento (
  id                  uuid primary key default gen_random_uuid(),
  ordine_id           uuid not null references public.ordini(id) on delete cascade,
  utente_id           uuid not null references auth.users(id) on delete restrict,
  importo             numeric(10, 2) not null check (importo >= 0),
  valuta              char(3) not null default 'EUR',
  stato               text not null default 'pending'
                      check (stato in ('pending', 'paid', 'failed', 'refunded')),
  provider_payment_id text unique,
  metodo_pagamento    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists trg_transazioni_updated_at on public.transazioni_pagamento;
create trigger trg_transazioni_updated_at
  before update on public.transazioni_pagamento
  for each row
  execute function public.aggiorna_timestamp_updated_at();

-- ----------------------------------------------------------------------------
-- 4. INDICI PER PRESTAZIONI E IDEMPOTENZA WEBHOOK
-- ----------------------------------------------------------------------------
create index if not exists idx_ordini_utente_created
  on public.ordini (utente_id, created_at desc);

create index if not exists idx_ordini_stato
  on public.ordini (stato);

create index if not exists idx_transazioni_ordine_id
  on public.transazioni_pagamento (ordine_id);

create index if not exists idx_transazioni_utente_created
  on public.transazioni_pagamento (utente_id, created_at desc);

create index if not exists idx_transazioni_stato
  on public.transazioni_pagamento (stato);

create index if not exists idx_transazioni_provider_payment_id
  on public.transazioni_pagamento (provider_payment_id)
  where provider_payment_id is not null;

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- Principio di sicurezza:
-- - Gli utenti autenticati leggono solo i propri ordini e transazioni.
-- - La creazione dell'ordine lato client è ammessa solo con stato = 'pending'.
-- - Gli aggiornamenti di stato ('paid', 'failed', 'refunded') e la scrittura
--   delle transazioni confermate avvengono SOLO lato server tramite Edge Function
--   con chiave `service_role` (che bypassa RLS), impedendo manomissioni client.
-- ----------------------------------------------------------------------------
alter table public.ordini enable row level security;
alter table public.transazioni_pagamento enable row level security;

-- Policy SELECT su `ordini`: l'utente vede solo i propri ordini
drop policy if exists "ordini_select_propri" on public.ordini;
create policy "ordini_select_propri"
  on public.ordini
  for select
  to authenticated
  using (auth.uid() = utente_id);

-- Policy INSERT su `ordini`: l'utente può creare un ordine solo per sé in stato 'pending'
drop policy if exists "ordini_insert_propri_pending" on public.ordini;
create policy "ordini_insert_propri_pending"
  on public.ordini
  for insert
  to authenticated
  with check (
    auth.uid() = utente_id
    and stato = 'pending'
  );

-- Policy UPDATE su `ordini`: opzionale, consente all'utente solo di annullare un ordine ancora 'pending'
drop policy if exists "ordini_cancel_se_pending" on public.ordini;
create policy "ordini_cancel_se_pending"
  on public.ordini
  for update
  to authenticated
  using (auth.uid() = utente_id and stato = 'pending')
  with check (auth.uid() = utente_id and stato = 'cancelled');

-- Policy SELECT su `transazioni_pagamento`: l'utente legge solo il proprio storico pagamenti
drop policy if exists "transazioni_select_proprie" on public.transazioni_pagamento;
create policy "transazioni_select_proprie"
  on public.transazioni_pagamento
  for select
  to authenticated
  using (auth.uid() = utente_id);

-- Nessuna policy INSERT/UPDATE/DELETE pubblica su `transazioni_pagamento`:
-- la scrittura è riservata esclusivamente al backend / Edge Function (service_role).
