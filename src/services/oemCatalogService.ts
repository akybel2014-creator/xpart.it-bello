import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as defaultSupabase } from "@/src/lib/supabaseClient";

/**
 * Nome della tabella catalogo codici OEM su Supabase (schema public).
 */
export const OEM_CATALOG_TABLE = "codici_oem_catalogo";

/**
 * Struttura di una riga restituita dalla tabella `public.codici_oem_catalogo`.
 */
export interface OemCatalogRecord {
  id: number;
  car_brand: string | null;
  car_model: string | null;
  oem_code: string | null;
  cross_reference: string | null;
  fitting_side: string | null;
  attributes: string | null;
}

/**
 * Tipo di corrispondenza rilevata rispetto al codice cercato,
 * utile per ordinare i risultati per rilevanza e guidare la UX.
 */
export type OemMatchType =
  | "exact-oem"
  | "exact-cross"
  | "partial-oem"
  | "partial-cross";

export interface OemCatalogSearchItem extends OemCatalogRecord {
  matchType: OemMatchType;
}

export interface SearchOemCatalogParams {
  /** Testo grezzo digitato dall'utente (es. "1k0 615 301 t" o "1K0-615-301-T") */
  rawQuery: string;
  /** Marca opzionale selezionata nel filtro (valore "all" o vuoto = tutte le marche) */
  carBrand?: string | null;
  /** Numero massimo di risultati da restituire (default: 40) */
  limit?: number;
  /** Client Supabase opzionale (di default usa l'istanza condivisa) */
  client?: SupabaseClient | null;
}

export interface SearchOemCatalogResponse {
  data: OemCatalogSearchItem[];
  totalCount: number;
  normalizedQuery: string;
  error: string | null;
}

/**
 * Normalizza un codice OEM in ingresso:
 * rimuove spazi, trattini, punti e qualsiasi carattere non alfanumerico,
 * convertendo il risultato in maiuscolo.
 *
 * Esempi:
 * - "1k0 615 301 t"  -> "1K0615301T"
 * - "1K0-615-301-T"  -> "1K0615301T"
 * - "156.053.019"    -> "156053019"
 */
export function normalizeOemCode(rawQuery: string): string {
  return (rawQuery || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

/**
 * Pulisce una stringa grezza per l'uso sicuro all'interno della clausola `.or()` di PostgREST,
 * eliminando caratteri sintattici riservati (virgole, parentesi, wildcard).
 */
function sanitizePostgrestValue(value: string): string {
  return value.replace(/[,()%*]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Suddivide il campo `cross_reference` in una lista pulita di codici equivalenti.
 * Supporta separatori comuni nei cataloghi automotive (virgola, punto e virgola, pipe, a capo).
 */
export function parseCrossReferences(crossReference: string | null): string[] {
  if (!crossReference) return [];

  const tokens = crossReference
    .split(/[,;|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  // Rimuove eventuali duplicati mantenendo l'ordine originale
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const token of tokens) {
    const key = normalizeOemCode(token) || token.toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(token);
    }
  }
  return unique;
}

/**
 * Suddivide il campo `attributes` in voci leggibili se contiene separatori strutturati
 * (pipe, punto e virgola o a capo), altrimenti mantiene il testo intero.
 */
export function parseOemAttributes(attributes: string | null): string[] {
  if (!attributes) return [];
  const trimmed = attributes.trim();
  if (!trimmed) return [];

  if (/[;|\n]/.test(trimmed)) {
    return trimmed
      .split(/[;|\n]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [trimmed];
}

/**
 * Determina il grado di corrispondenza di un record rispetto al codice normalizzato,
 * consentendo di mostrare prima i match esatti su `oem_code`, poi quelli su `cross_reference`.
 */
function classifyOemMatch(
  row: OemCatalogRecord,
  normalizedQuery: string
): OemMatchType {
  const normOem = normalizeOemCode(row.oem_code ?? "");
  if (normOem && normOem === normalizedQuery) {
    return "exact-oem";
  }

  const crossList = parseCrossReferences(row.cross_reference);
  const hasExactCross = crossList.some(
    (code) => normalizeOemCode(code) === normalizedQuery
  );
  if (hasExactCross) {
    return "exact-cross";
  }

  if (normOem && normOem.includes(normalizedQuery)) {
    return "partial-oem";
  }

  return "partial-cross";
}

const MATCH_PRIORITY: Record<OemMatchType, number> = {
  "exact-oem": 0,
  "exact-cross": 1,
  "partial-oem": 2,
  "partial-cross": 3,
};

/**
 * Interroga la tabella Supabase `public.codici_oem_catalogo` cercando corrispondenze
 * parziali o esatte sia su `oem_code` che su `cross_reference`.
 * Se viene fornita anche una marca (`carBrand`), applica il filtro su `car_brand`.
 */
export async function searchOemCatalog({
  rawQuery,
  carBrand,
  limit = 40,
  client = defaultSupabase,
}: SearchOemCatalogParams): Promise<SearchOemCatalogResponse> {
  const normalizedQuery = normalizeOemCode(rawQuery);

  // Evita query inutili se l'input non contiene caratteri alfanumerici
  if (!normalizedQuery) {
    return {
      data: [],
      totalCount: 0,
      normalizedQuery: "",
      error: null,
    };
  }

  if (!client) {
    return {
      data: [],
      totalCount: 0,
      normalizedQuery,
      error:
        "Connessione a Supabase non configurata. Verifica le variabili d'ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
    };
  }

  try {
    // Costruisce la clausola OR con `ilike` su `oem_code` e `cross_reference`.
    // Se l'utente ha inserito separatori (es. spazi o trattini), include anche la versione
    // originale sanificata così da trovare sia codici salvati normalizzati sia formattati.
    const orConditions: string[] = [
      `oem_code.ilike.%${normalizedQuery}%`,
      `cross_reference.ilike.%${normalizedQuery}%`,
    ];

    const safeRaw = sanitizePostgrestValue(rawQuery);
    if (safeRaw && safeRaw.toUpperCase() !== normalizedQuery) {
      orConditions.push(
        `oem_code.ilike.%${safeRaw}%`,
        `cross_reference.ilike.%${safeRaw}%`
      );
    }

    let queryBuilder = client
      .from(OEM_CATALOG_TABLE)
      .select(
        "id, car_brand, car_model, oem_code, cross_reference, fitting_side, attributes",
        { count: "exact" }
      )
      .or(orConditions.join(","));

    // Applica il filtro opzionale sulla marca se selezionata dall'utente
    const cleanBrand = carBrand?.trim();
    if (cleanBrand && cleanBrand.toLowerCase() !== "all") {
      queryBuilder = queryBuilder.ilike("car_brand", `%${cleanBrand}%`);
    }

    const { data, error, count } = await queryBuilder
      .order("oem_code", { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    const rows = (data as OemCatalogRecord[] | null) ?? [];

    // Classifica e ordina i risultati portando in cima le corrispondenze esatte
    const ranked: OemCatalogSearchItem[] = rows
      .map((row) => ({
        ...row,
        matchType: classifyOemMatch(row, normalizedQuery),
      }))
      .sort((a, b) => {
        const diff = MATCH_PRIORITY[a.matchType] - MATCH_PRIORITY[b.matchType];
        if (diff !== 0) return diff;
        return (a.oem_code ?? "").localeCompare(b.oem_code ?? "", "it");
      });

    return {
      data: ranked,
      totalCount: count ?? ranked.length,
      normalizedQuery,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Errore imprevisto durante la ricerca nel catalogo codici OEM.";
    return {
      data: [],
      totalCount: 0,
      normalizedQuery,
      error: message,
    };
  }
}
