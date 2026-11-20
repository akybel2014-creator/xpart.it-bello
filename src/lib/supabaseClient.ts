import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function sanitizeEnvValue(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^["']+|["']+$/g, "").trim();
}

function normalizeSupabaseUrl(raw: string): string {
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/rest\/v1\/?.*$/i, "").replace(/\/+$/, "");
}

const rawUrl = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_URL);
const rawKey = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

const supabaseUrl = normalizeSupabaseUrl(rawUrl);
const supabaseAnonKey = rawKey;

const envAutoTable = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_AUTO_TABLE);
export const AUTO_TABLE_NAME: string =
  envAutoTable && envAutoTable !== "auto" ? envAutoTable : "vehicles";

export const VEHICLES_BRANDS_VIEW = "vehicles_marche";
export const CATEGORIES_TABLE_NAME = "categorie_sito";

const isPlaceholderUrl =
  !supabaseUrl || supabaseUrl.includes("your-project-ref");
const isPlaceholderKey =
  !supabaseAnonKey || supabaseAnonKey.includes("your-supabase-anon-key");

export const hasSupabaseConfig = !isPlaceholderUrl && !isPlaceholderKey;

let clientInstance: SupabaseClient | null = null;
let initErrorMessage: string | null = null;

if (hasSupabaseConfig) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    initErrorMessage =
      err instanceof Error
        ? err.message
        : "Errore inizializzazione client Supabase.";
    console.error("[Supabase] Errore durante createClient():", err);
  }
} else {
  initErrorMessage =
    "Variabili VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY mancanti al momento del build.";
  console.error(
    "[Supabase] Configurazione mancante o non valida al build time. Verifica VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (e riesegui il deploy su Cloudflare Pages).",
    {
      hasViteSupabaseUrl: !isPlaceholderUrl,
      hasViteSupabaseAnonKey: !isPlaceholderKey,
    }
  );
}

export const supabase: SupabaseClient | null = clientInstance;
export const supabaseConfigError: string | null = initErrorMessage;

/**
 * Helper centralizzato di diagnostica per gli errori Supabase.
 * Stampa in `console.error` l'oggetto errore completo di Supabase insieme a una diagnosi
 * immediata (RLS, tabella/vista mancante, nome colonna o rete).
 */
export function logSupabaseError(
  contesto: string,
  tabella: string,
  error: unknown
): void {
  const errObj =
    error && typeof error === "object"
      ? (error as {
          code?: string;
          message?: string;
          details?: string;
          hint?: string;
          status?: number;
        })
      : { message: String(error) };

  let diagnosi = "Errore query o rete Supabase.";
  if (errObj.code === "42501" || errObj.status === 401 || errObj.status === 403) {
    diagnosi =
      "Permesso negato (RLS): verifica che esista una policy SELECT per il ruolo 'anon' sulla tabella/vista.";
  } else if (errObj.code === "PGRST205" || errObj.code === "42P01") {
    diagnosi = `Tabella o vista '${tabella}' non trovata nello schema public (o schema cache da ricaricare).`;
  } else if (errObj.code === "42703" || errObj.code === "PGRST204") {
    diagnosi = `Colonna non trovata in '${tabella}': verifica il maiuscolo/minuscolo esatto delle colonne ("Marca", "Modello", "Versione").`;
  }

  console.error(
    `[Supabase][${contesto}] Errore su "public.${tabella}" — ${diagnosi}`,
    error
  );
}

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

export interface VehicleVersionOption {
  id: string;
  versione: string;
}

/**
 * Normalizza e costruisce una descrizione leggibile per Motore / Versione
 * supportando sia lo schema `vehicles` ("Marca", "Modello", "Versione") sia colonne estese.
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

/**
 * 1. Carica tutte le marche distinte:
 *    - Usa prima la vista veloce `public.vehicles_marche` (colonna `marca`, 1 singola query).
 *    - Se la vista non è disponibile o restituisce errore, esegue automaticamente il fallback
 *      paginato sulla tabella `public.vehicles` leggendo la colonna `"Marca"`.
 */
export async function fetchDistinctVehicleBrands(
  client: SupabaseClient | null = supabase
): Promise<string[]> {
  if (!client) {
    console.error("[Supabase][fetchDistinctVehicleBrands] Client Supabase non configurato.");
    return [];
  }

  // Tentativo 1: vista ottimizzata `public.vehicles_marche` (colonna `marca`)
  const { data: viewData, error: viewError } = await client
    .from(VEHICLES_BRANDS_VIEW)
    .select("marca")
    .order("marca", { ascending: true })
    .limit(1000);

  if (!viewError && Array.isArray(viewData) && viewData.length > 0) {
    const distinct = Array.from(
      new Set(
        viewData
          .map((row: { marca?: string | null; Marca?: string | null }) =>
            (row.marca ?? row.Marca)?.trim()
          )
          .filter((name): name is string => Boolean(name))
      )
    ).sort((a, b) => a.localeCompare(b, "it"));

    if (distinct.length > 0) {
      return distinct;
    }
  } else if (viewError) {
    logSupabaseError(
      "Caricamento marche (vista → fallback su public.vehicles)",
      VEHICLES_BRANDS_VIEW,
      viewError
    );
  }

  // Tentativo 2 (fallback): tabella `public.vehicles` leggendo `"Marca"` con doppi apici
  const { count, error: countError } = await client
    .from(AUTO_TABLE_NAME)
    .select('"Marca"', { count: "exact", head: true });

  if (countError) {
    logSupabaseError("Conteggio righe marche", AUTO_TABLE_NAME, countError);
    throw countError;
  }

  if (!count || count === 0) {
    console.error(
      `[Supabase][fetchDistinctVehicleBrands] La tabella "public.${AUTO_TABLE_NAME}" ha restituito 0 righe (verifica RLS o popolamento dati).`
    );
    return [];
  }

  const pageSize = 1000;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const brandSet = new Set<string>();

  for (let i = 0; i < totalPages; i += 10) {
    const batch = [];
    for (let j = i; j < Math.min(i + 10, totalPages); j++) {
      batch.push(
        client
          .from(AUTO_TABLE_NAME)
          .select('"Marca"')
          .range(j * pageSize, (j + 1) * pageSize - 1)
      );
    }
    const results = await Promise.all(batch);
    for (const res of results) {
      if (res.error) {
        logSupabaseError("Paginazione marche", AUTO_TABLE_NAME, res.error);
        throw res.error;
      }
      for (const row of (res.data as AutoTableRow[]) ?? []) {
        const name = (row.Marca ?? row.marca)?.trim();
        if (name) brandSet.add(name);
      }
    }
  }

  return Array.from(brandSet).sort((a, b) => a.localeCompare(b, "it"));
}

/**
 * 2. Carica tutti i modelli distinti da `public.vehicles` filtrando per `"Marca"`.
 */
export async function fetchVehicleModels(
  brand: string,
  client: SupabaseClient | null = supabase
): Promise<string[]> {
  if (!client || !brand) return [];

  const pageSize = 1000;
  let offset = 0;
  const modelSet = new Set<string>();

  while (true) {
    const { data, error } = await client
      .from(AUTO_TABLE_NAME)
      .select('"Modello"')
      .eq("Marca", brand)
      .order("Modello", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      logSupabaseError(`Caricamento modelli per Marca="${brand}"`, AUTO_TABLE_NAME, error);
      throw error;
    }

    const rows = (data as AutoTableRow[]) ?? [];
    for (const row of rows) {
      const name = (row.Modello ?? row.modello)?.trim();
      if (name) modelSet.add(name);
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return Array.from(modelSet).sort((a, b) => a.localeCompare(b, "it"));
}

/**
 * 3. Carica tutte le versioni / motorizzazioni da `public.vehicles` filtrando per `"Marca"` e `"Modello"`.
 */
export async function fetchVehicleVersions(
  brand: string,
  model: string,
  client: SupabaseClient | null = supabase
): Promise<VehicleVersionOption[]> {
  if (!client || !brand || !model) return [];

  const { data, error } = await client
    .from(AUTO_TABLE_NAME)
    .select('id, "Versione"')
    .eq("Marca", brand)
    .eq("Modello", model)
    .order("Versione", { ascending: true })
    .limit(1000);

  if (error) {
    logSupabaseError(
      `Caricamento versioni per Marca="${brand}", Modello="${model}"`,
      AUTO_TABLE_NAME,
      error
    );
    throw error;
  }

  const deduped = new Map<string, VehicleVersionOption>();
  for (const row of (data as AutoTableRow[]) ?? []) {
    const label = (row.Versione ?? row.versione)?.trim();
    if (label && !deduped.has(label)) {
      deduped.set(label, {
        id: row.id !== undefined && row.id !== null ? String(row.id) : label,
        versione: label,
      });
    }
  }

  return Array.from(deduped.values()).sort((a, b) =>
    a.versione.localeCompare(b.versione, "it")
  );
}
