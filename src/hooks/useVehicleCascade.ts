import { useEffect, useState } from "react";
import { AUTO_TABLE_FALLBACK } from "@/src/data/autoFallback";
import {
  AUTO_TABLE_NAME,
  formatEngineOption,
  supabase,
  type AutoTableRow,
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

// Cache in memoria per evitare refetch ripetuti tra SearchBar e Modale Venditore
let cachedBrands: string[] | null = null;
const cachedModelsByBrand = new Map<string, string[]>();
const cachedEnginesByBrandModel = new Map<string, EngineOption[]>();

const BRANDS_STORAGE_KEY = `clp_brands_cache_${AUTO_TABLE_NAME}`;

async function fetchAllDistinctBrandsFromSupabase(): Promise<string[]> {
  if (cachedBrands && cachedBrands.length > 0) return cachedBrands;

  try {
    const raw = sessionStorage.getItem(BRANDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedBrands = parsed;
        return parsed;
      }
    }
  } catch {
    // sessionStorage non disponibile
  }

  if (!supabase) return [];

  const { count, error: countError } = await supabase
    .from(AUTO_TABLE_NAME)
    .select("*", { count: "exact", head: true });

  if (countError) throw countError;

  const pageSize = 1000;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const brandSet = new Set<string>();

  for (let i = 0; i < totalPages; i += 15) {
    const batch = [];
    for (let j = i; j < Math.min(i + 15, totalPages); j++) {
      batch.push(
        supabase
          .from(AUTO_TABLE_NAME)
          .select("Marca")
          .range(j * pageSize, (j + 1) * pageSize - 1)
      );
    }
    const results = await Promise.all(batch);
    for (const res of results) {
      if (res.error) throw res.error;
      for (const row of (res.data as AutoTableRow[]) ?? []) {
        const name = (row.Marca ?? row.marca)?.trim();
        if (name) brandSet.add(name);
      }
    }
  }

  const sorted = Array.from(brandSet).sort((a, b) => a.localeCompare(b, "it"));
  cachedBrands = sorted;

  try {
    sessionStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(sorted));
  } catch {
    // ignore quota errors
  }

  return sorted;
}

async function fetchModelsForBrandFromSupabase(brand: string): Promise<string[]> {
  const cached = cachedModelsByBrand.get(brand);
  if (cached) return cached;
  if (!supabase) return [];

  const pageSize = 1000;
  let offset = 0;
  const modelSet = new Set<string>();

  while (true) {
    const { data, error } = await supabase
      .from(AUTO_TABLE_NAME)
      .select("Modello")
      .eq("Marca", brand)
      .order("Modello", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const rows = (data as AutoTableRow[]) ?? [];
    for (const row of rows) {
      const name = (row.Modello ?? row.modello)?.trim();
      if (name) modelSet.add(name);
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  const sorted = Array.from(modelSet).sort((a, b) => a.localeCompare(b, "it"));
  cachedModelsByBrand.set(brand, sorted);
  return sorted;
}

async function fetchEnginesForModelFromSupabase(
  brand: string,
  model: string
): Promise<EngineOption[]> {
  const cacheKey = `${brand}::${model}`;
  const cached = cachedEnginesByBrandModel.get(cacheKey);
  if (cached) return cached;
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(AUTO_TABLE_NAME)
    .select("*")
    .eq("Marca", brand)
    .eq("Modello", model)
    .order("Versione", { ascending: true })
    .limit(1000);

  if (error) throw error;

  const deduped = new Map<string, EngineOption>();
  for (const row of (data as AutoTableRow[]) ?? []) {
    const formatted = formatEngineOption(row);
    if (formatted && !deduped.has(formatted.value)) {
      deduped.set(formatted.value, formatted);
    }
  }

  const sorted = Array.from(deduped.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "it")
  );
  cachedEnginesByBrandModel.set(cacheKey, sorted);
  return sorted;
}

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

  // 1. Carica tutte le marche distinte ordinate alfabeticamente all'avvio
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
        if (supabase) {
          const list = await fetchAllDistinctBrandsFromSupabase();
          if (!cancelled) setBrands(list);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 180));
        const distinct = Array.from(
          new Set(
            AUTO_TABLE_FALLBACK.map((r) => (r.Marca ?? r.marca)?.trim()).filter(
              (m): m is string => Boolean(m)
            )
          )
        ).sort((a, b) => a.localeCompare(b, "it"));

        cachedBrands = distinct;
        if (!cancelled) setBrands(distinct);
      } catch (err) {
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

  // 2. Carica modelli della marca selezionata
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
          const list = await fetchModelsForBrandFromSupabase(selectedBrand);
          if (!cancelled) setModels(list);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 180));
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
      } catch {
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

  // 3. Carica motorizzazioni / versioni per Marca + Modello selezionati
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
          const list = await fetchEnginesForModelFromSupabase(
            selectedBrand,
            selectedModel
          );
          if (!cancelled) setEngines(list);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 180));
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
      } catch {
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
