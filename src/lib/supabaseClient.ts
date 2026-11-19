import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

const normalizedUrl = rawUrl?.replace(/\/rest\/v1\/?.*$/i, "").replace(/\/+$/, "");

export const AUTO_TABLE_NAME: string =
  (import.meta.env.VITE_SUPABASE_AUTO_TABLE as string | undefined)?.trim() || "vehicles";

const hasValidConfig =
  Boolean(normalizedUrl && rawKey) &&
  !normalizedUrl?.includes("your-project-ref") &&
  !rawKey?.includes("your-supabase-anon-key");

export const supabase: SupabaseClient | null = hasValidConfig
  ? createClient(normalizedUrl!, rawKey!)
  : null;

export interface AutoTableRow {
  id?: string | number;
  Marca?: string | null;
  Modello?: string | null;
  Versione?: string | null;
  marca?: string | null;
  modello?: string | null;
  motore?: string | null;
  versione?: string | null;
  cilindrata?: string | number | null;
  carburante?: string | null;
  codice_motore?: string | null;
  potenza?: string | number | null;
  cavalli?: string | number | null;
}

export interface EngineOption {
  value: string;
  label: string;
  code: string;
}

/**
 * Normalizza e costruisce una descrizione leggibile per Motore / Versione
 * supportando sia lo schema `vehicles` (Marca, Modello, Versione) sia colonne estese.
 */
export function formatEngineOption(row: AutoTableRow): EngineOption | null {
  const motore = row.motore?.toString().trim() || "";
  const versione = (row.Versione ?? row.versione)?.toString().trim() || "";
  const cilindrataRaw = row.cilindrata?.toString().trim() || "";
  const carburante = row.carburante?.toString().trim() || "";
  const codice = row.codice_motore?.toString().trim() || "";
  const potenzaRaw = (row.potenza ?? row.cavalli)?.toString().trim() || "";

  const cilindrata =
    cilindrataRaw && !cilindrataRaw.toLowerCase().includes("cc") && /^\d{3,4}$/.test(cilindrataRaw)
      ? `${(Number(cilindrataRaw) / 1000).toFixed(1)}L`
      : cilindrataRaw;

  const potenza =
    potenzaRaw && !potenzaRaw.toLowerCase().includes("cv") && !potenzaRaw.toLowerCase().includes("kw")
      ? `${potenzaRaw} CV`
      : potenzaRaw;

  const primary = motore || versione || cilindrata;
  const parts: string[] = [];

  if (primary) parts.push(primary);
  if (versione && motore && versione !== motore) parts.push(versione);
  if (cilindrata && !primary.includes(cilindrata)) parts.push(cilindrata);
  if (potenza) parts.push(potenza);
  if (carburante) parts.push(carburante);
  if (codice) parts.push(`Cod. ${codice}`);

  if (parts.length === 0) return null;

  const label = parts.join(" · ");
  return {
    value: label,
    label,
    code: codice || primary,
  };
}
