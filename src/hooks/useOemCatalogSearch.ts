import { useCallback, useEffect, useRef, useState } from "react";
import {
  normalizeOemCode,
  searchOemCatalog,
  type OemCatalogSearchItem,
} from "@/src/services/oemCatalogService";
import {
  matchOemCodesBatch,
  type MatchOemCodesBatchResponse,
  type VerifiedVehicleMatch,
} from "@/src/services/oemCompatibilityService";

interface UseOemCatalogSearchParams {
  /** Testo inserito nel campo di ricerca OEM */
  query: string;
  /** Marca selezionata nel filtro (oppure "all") */
  selectedBrand: string;
  /** Lunghezza minima del codice normalizzato per attivare la ricerca automatica (default: 3) */
  minAutoChars?: number;
  /** Ritardo di debounce in millisecondi durante la digitazione (default: 350ms) */
  debounceMs?: number;
}

export interface UseOemCatalogSearchResult {
  results: OemCatalogSearchItem[];
  verifiedVehicles: VerifiedVehicleMatch[];
  totalCount: number;
  normalizedQuery: string;
  isLoading: boolean;
  hasSearched: boolean;
  error: string | null;
  /** Esegue subito la ricerca bypassando il debounce (es. al click su "Cerca" o Invio) */
  searchNow: (overrideQuery?: string, overrideBrand?: string) => Promise<void>;
  /** Azzera i risultati e lo stato della ricerca OEM */
  clearResults: () => void;
}

/**
 * Hook React per la ricerca reattiva su `public.codici_oem_catalogo`
 * arricchita con i veicoli compatibili verificati tramite `public.match_oem_codes_batch`.
 */
export function useOemCatalogSearch({
  query,
  selectedBrand,
  minAutoChars = 3,
  debounceMs = 350,
}: UseOemCatalogSearchParams): UseOemCatalogSearchResult {
  const [results, setResults] = useState<OemCatalogSearchItem[]>([]);
  const [verifiedVehicles, setVerifiedVehicles] = useState<VerifiedVehicleMatch[]>(
    []
  );
  const [totalCount, setTotalCount] = useState(0);
  const [normalizedQuery, setNormalizedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contatore progressivo per prevenire race condition tra richieste concorrenti
  const requestIdRef = useRef(0);

  const executeSearch = useCallback(
    async (rawInput: string, brandInput: string) => {
      const normalized = normalizeOemCode(rawInput);

      if (normalized.length < 2) {
        requestIdRef.current += 1;
        setResults([]);
        setVerifiedVehicles([]);
        setTotalCount(0);
        setNormalizedQuery(normalized);
        setHasSearched(false);
        setError(null);
        setIsLoading(false);
        return;
      }

      const currentRequestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      setNormalizedQuery(normalized);

      const emptyBatchFallback: MatchOemCodesBatchResponse = {
        resultsByCode: {},
        processedCount: 0,
        aborted: false,
        error: null,
        errorCode: null,
      };

      const [catalogResponse, batchResponse] = await Promise.all([
        searchOemCatalog({
          rawQuery: rawInput,
          carBrand: brandInput,
        }),
        matchOemCodesBatch([normalized], { chunkSize: 50 }).catch(
          () => emptyBatchFallback
        ),
      ]);

      // Ignora la risposta se nel frattempo è partita una ricerca più recente
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const rawVerified =
        batchResponse.resultsByCode[normalized]?.verifiedVehicles ?? [];
      const cleanBrand = brandInput?.trim().toLowerCase();
      const filteredVerified =
        cleanBrand && cleanBrand !== "all"
          ? rawVerified.filter((v) =>
              v.marca.toLowerCase().includes(cleanBrand)
            )
          : rawVerified;

      setResults(Array.isArray(catalogResponse.data) ? catalogResponse.data : []);
      setVerifiedVehicles(filteredVerified);
      setTotalCount(catalogResponse.totalCount);
      setNormalizedQuery(catalogResponse.normalizedQuery);
      setError(catalogResponse.error);
      setHasSearched(true);
      setIsLoading(false);
    },
    []
  );

  // Ricerca automatica con debounce quando cambia il testo o la marca selezionata
  useEffect(() => {
    const normalized = normalizeOemCode(query);

    if (!normalized) {
      requestIdRef.current += 1;
      setResults([]);
      setVerifiedVehicles([]);
      setTotalCount(0);
      setNormalizedQuery("");
      setHasSearched(false);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (normalized.length < minAutoChars) {
      setNormalizedQuery(normalized);
      return;
    }

    const timer = window.setTimeout(() => {
      void executeSearch(query, selectedBrand);
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, selectedBrand, minAutoChars, debounceMs, executeSearch]);

  const searchNow = useCallback(
    async (overrideQuery?: string, overrideBrand?: string) => {
      const targetQuery = overrideQuery ?? query;
      const targetBrand = overrideBrand ?? selectedBrand;
      await executeSearch(targetQuery, targetBrand);
    },
    [query, selectedBrand, executeSearch]
  );

  const clearResults = useCallback(() => {
    requestIdRef.current += 1;
    setResults([]);
    setVerifiedVehicles([]);
    setTotalCount(0);
    setNormalizedQuery("");
    setHasSearched(false);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    results,
    verifiedVehicles,
    totalCount,
    normalizedQuery,
    isLoading,
    hasSearched,
    error,
    searchNow,
    clearResults,
  };
}
