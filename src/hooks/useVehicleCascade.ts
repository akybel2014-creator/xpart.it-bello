import { useEffect, useState } from "react";
import { AUTO_TABLE_FALLBACK } from "@/src/data/autoFallback";
import {
  AUTO_TABLE_NAME,
  fetchDistinctVehicleBrands,
  fetchVehicleModels,
  fetchVehicleVersions,
  formatEngineOption,
  logSupabaseError,
  supabase,
  type EngineOption,
} from "@/src/lib/supabaseClient";

interface UseVehicleCascadeParams {
  selectedBrand: string;
  selectedModel: string;
}

interface UseVehicleCascadeResult {
  brands: string[];
  models: string[];
  engines: EngineOption[];
  loadingBrands: boolean;
  loadingModels: boolean;
  loadingEngines: boolean;
  isLiveSupabase: boolean;
  error: string | null;
}

const isSet = (val: string) => Boolean(val && val !== "all");

// Cache in memoria per evitare refetch ripetuti tra Modale Venditore e altri form
let cachedBrands: string[] | null = null;
const cachedModelsByBrand = new Map<string, string[]>();
const cachedEnginesByBrandModel = new Map<string, EngineOption[]>();

const BRANDS_STORAGE_KEY = `clp_brands_v2_${AUTO_TABLE_NAME}`;

export function useVehicleCascade({
  selectedBrand,
  selectedModel,
}: UseVehicleCascadeParams): UseVehicleCascadeResult {
  const [brands, setBrands] = useState<string[]>(() => cachedBrands ?? []);
  const [models, setModels] = useState<string[]>(() =>
    isSet(selectedBrand) ? cachedModelsByBrand.get(selectedBrand) ?? [] : []
  );
  const [engines, setEngines] = useState<EngineOption[]>(() =>
    isSet(selectedBrand) && isSet(selectedModel)
      ? cachedEnginesByBrandModel.get(`${selectedBrand}::${selectedModel}`) ?? []
      : []
  );

  const [loadingBrands, setLoadingBrands] = useState<boolean>(!cachedBrands);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [loadingEngines, setLoadingEngines] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Carica tutte le marche distinte (da `public.vehicles_marche` con fallback `public.vehicles`)
  useEffect(() => {
    if (cachedBrands && cachedBrands.length > 0) {
      setBrands(cachedBrands);
      setLoadingBrands(false);
      return;
    }

    let cancelled = false;

    async function loadBrands() {
      setLoadingBrands(true);
      setError(null);

      try {
        try {
          const raw = sessionStorage.getItem(BRANDS_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as string[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              cachedBrands = parsed;
              if (!cancelled) setBrands(parsed);
              return;
            }
          }
        } catch {
          // sessionStorage non disponibile
        }

        if (supabase) {
          const list = await fetchDistinctVehicleBrands(supabase);
          if (list.length > 0) {
            cachedBrands = list;
            try {
              sessionStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(list));
            } catch {
              // ignore quota errors
            }
            if (!cancelled) setBrands(list);
            return;
          }
        }

        const distinct = Array.from(
          new Set(
            AUTO_TABLE_FALLBACK.map((r) => (r.Marca ?? r.marca)?.trim()).filter(
              (m): m is string => Boolean(m)
            )
          )
        ).sort((a, b) => a.localeCompare(b, "it"));

        if (!cancelled) setBrands(distinct);
      } catch (err) {
        logSupabaseError("useVehicleCascade:loadBrands", AUTO_TABLE_NAME, err);
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossibile caricare le marche da Supabase."
          );
          const fallbackBrands = Array.from(
            new Set(
              AUTO_TABLE_FALLBACK.map((r) => (r.Marca ?? r.marca)?.trim()).filter(
                (m): m is string => Boolean(m)
              )
            )
          ).sort((a, b) => a.localeCompare(b, "it"));
          setBrands(fallbackBrands);
        }
      } finally {
        if (!cancelled) setLoadingBrands(false);
      }
    }

    loadBrands();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Carica modelli della marca selezionata da `public.vehicles`
  useEffect(() => {
    if (!isSet(selectedBrand)) {
      setModels([]);
      setLoadingModels(false);
      return;
    }

    const preloaded = cachedModelsByBrand.get(selectedBrand);
    if (preloaded) {
      setModels(preloaded);
      setLoadingModels(false);
      return;
    }

    let cancelled = false;

    async function loadModels() {
      setLoadingModels(true);
      setModels([]);

      try {
        if (supabase) {
          const list = await fetchVehicleModels(selectedBrand, supabase);
          if (list.length > 0) {
            cachedModelsByBrand.set(selectedBrand, list);
            if (!cancelled) setModels(list);
            return;
          }
        }

        const distinct = Array.from(
          new Set(
            AUTO_TABLE_FALLBACK.filter(
              (r) =>
                (r.Marca ?? r.marca)?.toLowerCase() === selectedBrand.toLowerCase()
            )
              .map((r) => (r.Modello ?? r.modello)?.trim())
              .filter((m): m is string => Boolean(m))
          )
        ).sort((a, b) => a.localeCompare(b, "it"));

        if (!cancelled) setModels(distinct);
      } catch (err) {
        logSupabaseError("useVehicleCascade:loadModels", AUTO_TABLE_NAME, err);
        if (!cancelled) {
          const fallbackModels = Array.from(
            new Set(
              AUTO_TABLE_FALLBACK.filter(
                (r) =>
                  (r.Marca ?? r.marca)?.toLowerCase() === selectedBrand.toLowerCase()
              )
                .map((r) => (r.Modello ?? r.modello)?.trim())
                .filter((m): m is string => Boolean(m))
            )
          ).sort((a, b) => a.localeCompare(b, "it"));
          setModels(fallbackModels);
        }
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    }

    loadModels();
    return () => {
      cancelled = true;
    };
  }, [selectedBrand]);

  // 3. Carica motorizzazioni / versioni per Marca + Modello da `public.vehicles`
  useEffect(() => {
    if (!isSet(selectedBrand) || !isSet(selectedModel)) {
      setEngines([]);
      setLoadingEngines(false);
      return;
    }

    const cacheKey = `${selectedBrand}::${selectedModel}`;
    const preloaded = cachedEnginesByBrandModel.get(cacheKey);
    if (preloaded) {
      setEngines(preloaded);
      setLoadingEngines(false);
      return;
    }

    let cancelled = false;

    async function loadEngines() {
      setLoadingEngines(true);
      setEngines([]);

      try {
        if (supabase) {
          const versions = await fetchVehicleVersions(
            selectedBrand,
            selectedModel,
            supabase
          );
          if (versions.length > 0) {
            const mapped: EngineOption[] = versions.map((v) => ({
              value: v.versione,
              label: v.versione,
              code: v.id,
            }));
            cachedEnginesByBrandModel.set(cacheKey, mapped);
            if (!cancelled) setEngines(mapped);
            return;
          }
        }

        const rows = AUTO_TABLE_FALLBACK.filter(
          (r) =>
            (r.Marca ?? r.marca)?.toLowerCase() === selectedBrand.toLowerCase() &&
            (r.Modello ?? r.modello)?.toLowerCase() === selectedModel.toLowerCase()
        );

        const deduped = new Map<string, EngineOption>();
        for (const row of rows) {
          const formatted = formatEngineOption(row);
          if (formatted && !deduped.has(formatted.value)) {
            deduped.set(formatted.value, formatted);
          }
        }
        const sorted = Array.from(deduped.values()).sort((a, b) =>
          a.label.localeCompare(b.label, "it")
        );
        if (!cancelled) setEngines(sorted);
      } catch (err) {
        logSupabaseError("useVehicleCascade:loadEngines", AUTO_TABLE_NAME, err);
        if (!cancelled) setEngines([]);
      } finally {
        if (!cancelled) setLoadingEngines(false);
      }
    }

    loadEngines();
    return () => {
      cancelled = true;
    };
  }, [selectedBrand, selectedModel]);

  return {
    brands,
    models,
    engines,
    loadingBrands,
    loadingModels,
    loadingEngines,
    isLiveSupabase: Boolean(supabase),
    error,
  };
}
