import {
  Camera,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase as defaultSupabase } from "@/src/lib/supabaseClient";

/**
 * Valore iniziale pulito per i filtri laterali operativi del catalogo `parts`.
 */
export const DEFAULT_SIDEBAR_FILTERS = {
  condizione: "tutti", // "tutti" | "Usato" | "Nuovo" | "Ricondizionato"
  prezzoMin: "",
  prezzoMax: "",
  soloConFoto: false,
  spedizioneRapida: false,
};

/**
 * Opzioni radio per la condizione del ricambio (allineate alla colonna `condizione` su `parts`).
 */
export const CONDITION_OPTIONS = [
  { value: "tutti", label: "Tutti", helper: "Mostra ogni stato d'uso" },
  { value: "Usato", label: "Usato", helper: "Originale testato da demolitore" },
  { value: "Nuovo", label: "Nuovo", helper: "Ricambio nuovo OEM / aftermarket" },
  {
    value: "Ricondizionato",
    label: "Ricondizionato",
    helper: "Revisionato al banco con garanzia",
  },
];

/**
 * Applica i filtri operativi della sidebar direttamente a un query builder Supabase
 * sulla tabella `public.parts` usando `.eq('condizione', ...)`, `.gte('prezzo', ...)`
 * e `.lte('prezzo', ...)`.
 */
export function applicaFiltriSidebarSuSupabase(queryBuilder, filtri) {
  if (!queryBuilder || !filtri) return queryBuilder;

  let q = queryBuilder;

  // 1. Condizione del ricambio
  if (filtri.condizione && filtri.condizione !== "tutti") {
    q = q.eq("condizione", filtri.condizione);
  }

  // 2. Fascia di prezzo (Min € / Max €)
  const minVal = Number(filtri.prezzoMin);
  if (filtri.prezzoMin !== "" && Number.isFinite(minVal) && minVal >= 0) {
    q = q.gte("prezzo", minVal);
  }

  const maxVal = Number(filtri.prezzoMax);
  if (filtri.prezzoMax !== "" && Number.isFinite(maxVal) && maxVal >= 0) {
    q = q.lte("prezzo", maxVal);
  }

  // 3. Solo annunci con immagini presenti (`immagini` non nullo / non vuoto)
  if (filtri.soloConFoto) {
    q = q.not("immagini", "is", null).neq("immagini", "{}");
  }

  // 4. Spedizione rapida disponibile
  if (filtri.spedizioneRapida) {
    q = q.eq("spedizione_rapida", true);
  }

  return q;
}

/**
 * Helper completo per interrogare la tabella Supabase `public.parts` combinando
 * i filtri principali della barra superiore (veicolo, testo OEM, categoria)
 * con i filtri laterali di `SidebarFilters`.
 */
export async function cercaPartsConFiltriSuSupabase(
  {
    tipo_veicolo,
    marca,
    modello,
    categoria_id,
    query,
  } = {},
  sidebarFilters = DEFAULT_SIDEBAR_FILTERS,
  client = defaultSupabase
) {
  if (!client) {
    return { data: [], error: new Error("Client Supabase non configurato.") };
  }

  let q = client.from("parts").select("*");

  if (tipo_veicolo) q = q.eq("tipo_veicolo", tipo_veicolo);
  if (marca && marca !== "all") q = q.ilike("marca", marca);
  if (modello && modello !== "all") q = q.ilike("modello", `%${modello}%`);
  if (categoria_id) q = q.eq("categoria_id", categoria_id);

  if (query && query.trim()) {
    const clean = query.trim();
    const normOem = clean.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const clauses = [`titolo.ilike.%${clean}%`];
    if (normOem.length >= 2) {
      clauses.push(`codice_oe.ilike.%${normOem}%`);
    }
    q = q.or(clauses.join(","));
  }

  // Applica condizione, prezzo min/max, solo con foto e spedizione rapida
  q = applicaFiltriSidebarSuSupabase(q, sidebarFilters);

  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(60);

  return { data: data ?? [], error };
}

/**
 * Calcola quanti filtri operativi sono attualmente attivi nella sidebar.
 */
export function countActiveSidebarFilters(filters) {
  if (!filters) return 0;
  let count = 0;
  if (filters.condizione && filters.condizione !== "tutti") count += 1;
  if (filters.prezzoMin !== "" || filters.prezzoMax !== "") count += 1;
  if (filters.soloConFoto) count += 1;
  if (filters.spedizioneRapida) count += 1;
  return count;
}

/**
 * SidebarFilters
 * Barra laterale sinistra dedicata esclusivamente ai filtri operativi su `public.parts`
 * (Condizione, Fascia di Prezzo Min/Max con debounce + Applica, Solo con foto,
 * Spedizione rapida, Azzera tutti i filtri).
 * Nessuna categoria hardcodata: la selezione categoria vive nella barra superiore
 * collegata a `public.categorie_sito`.
 */
export function SidebarFilters({
  filters = DEFAULT_SIDEBAR_FILTERS,
  onChangeFilters,
  onResetAllFilters,
  hasActiveTopSearch = false,
  className = "",
}) {
  // Stato locale controllato per i due input prezzo (supporta sia debounce sia pulsante Applica)
  const [minInput, setMinInput] = useState(String(filters.prezzoMin ?? ""));
  const [maxInput, setMaxInput] = useState(String(filters.prezzoMax ?? ""));

  // Sincronizza gli input locali se i filtri vengono azzerati dall'esterno
  useEffect(() => {
    setMinInput(String(filters.prezzoMin ?? ""));
    setMaxInput(String(filters.prezzoMax ?? ""));
  }, [filters.prezzoMin, filters.prezzoMax]);

  // Debounce morbido (450ms) sugli input di prezzo per evitare query ad ogni tasto
  useEffect(() => {
    const currentMin = String(filters.prezzoMin ?? "");
    const currentMax = String(filters.prezzoMax ?? "");
    if (minInput === currentMin && maxInput === currentMax) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onChangeFilters?.({
        ...filters,
        prezzoMin: minInput.trim(),
        prezzoMax: maxInput.trim(),
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [minInput, maxInput, filters, onChangeFilters]);

  const handleApplyPriceNow = (e) => {
    e.preventDefault();
    onChangeFilters?.({
      ...filters,
      prezzoMin: minInput.trim(),
      prezzoMax: maxInput.trim(),
    });
  };

  const handleConditionChange = (nextCondition) => {
    onChangeFilters?.({
      ...filters,
      condizione: nextCondition,
    });
  };

  const handleToggleOption = (key) => {
    onChangeFilters?.({
      ...filters,
      [key]: !filters[key],
    });
  };

  const activeSidebarCount = countActiveSidebarFilters(filters);
  const canResetAny = activeSidebarCount > 0 || hasActiveTopSearch;

  return (
    <aside
      aria-label="Filtri operativi ricambi"
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs ${className}`}
    >
      {/* Intestazione sidebar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#1E3A8A]" />
          <h2 className="font-display text-sm font-bold tracking-tight text-slate-900">
            Filtri Ricambi
          </h2>
        </div>
        {activeSidebarCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-[#1E3A8A]/10 px-1.5 text-[11px] font-semibold tabular-nums text-[#1E3A8A]">
            {activeSidebarCount}
          </span>
        )}
      </div>

      {/* 1. Condizione del pezzo (Radio) */}
      <fieldset className="mt-5">
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Condizione del pezzo
        </legend>
        <div className="mt-2.5 space-y-1.5">
          {CONDITION_OPTIONS.map((option) => {
            const isSelected = filters.condizione === option.value;
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
                  isSelected
                    ? "border-[#1E3A8A]/40 bg-[#1E3A8A]/[0.04]"
                    : "border-slate-200/70 bg-white hover:border-slate-300 hover:bg-[#F9FAFB]"
                }`}
              >
                <input
                  type="radio"
                  name="condizione-ricambio"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => handleConditionChange(option.value)}
                  className="mt-0.5 h-4 w-4 accent-[#1E3A8A] cursor-pointer"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-xs font-semibold ${
                      isSelected ? "text-[#1E3A8A]" : "text-slate-800"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    {option.helper}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 2. Fascia di Prezzo (Min € / Max € + Applica) */}
      <form
        onSubmit={handleApplyPriceNow}
        className="mt-6 border-t border-slate-100 pt-5"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Fascia di Prezzo
          </span>
          <span className="text-[11px] text-slate-400">Netto IVA escl.</span>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <div>
            <label
              htmlFor="filter-price-min"
              className="mb-1 block text-[11px] font-medium text-slate-500"
            >
              Min €
            </label>
            <div className="relative">
              <input
                id="filter-price-min"
                type="number"
                min="0"
                step="10"
                inputMode="numeric"
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
                placeholder="0"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                €
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="filter-price-max"
              className="mb-1 block text-[11px] font-medium text-slate-500"
            >
              Max €
            </label>
            <div className="relative">
              <input
                id="filter-price-max"
                type="number"
                min="0"
                step="10"
                inputMode="numeric"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                placeholder="2000"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                €
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-2.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#1E3A8A]/25 bg-[#1E3A8A]/5 px-3 text-xs font-semibold text-[#1E3A8A] transition-colors hover:bg-[#1E3A8A] hover:text-white cursor-pointer"
        >
          <Check className="h-3.5 w-3.5" />
          Applica fascia prezzo
        </button>
      </form>

      {/* 3. Opzioni aggiuntive (Checkbox) */}
      <fieldset className="mt-6 border-t border-slate-100 pt-5">
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Opzioni aggiuntive
        </legend>

        <div className="mt-2.5 space-y-2.5">
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200/70 bg-[#F9FAFB]/60 p-3 transition-colors hover:border-slate-300">
            <input
              type="checkbox"
              checked={Boolean(filters.soloConFoto)}
              onChange={() => handleToggleOption("soloConFoto")}
              className="mt-0.5 h-4 w-4 rounded accent-[#1E3A8A] cursor-pointer"
            />
            <span className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Camera className="h-3.5 w-3.5 text-[#1E3A8A]" />
                Solo con foto disponibili
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500">
                Mostra solo ricambi con immagini reali caricate
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200/70 bg-[#F9FAFB]/60 p-3 transition-colors hover:border-slate-300">
            <input
              type="checkbox"
              checked={Boolean(filters.spedizioneRapida)}
              onChange={() => handleToggleOption("spedizioneRapida")}
              className="mt-0.5 h-4 w-4 rounded accent-[#1E3A8A] cursor-pointer"
            />
            <span className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Truck className="h-3.5 w-3.5 text-[#16A34A]" />
                Spedizione rapida disponibile
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500">
                Consegna con corriere espresso 24/48 ore
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {/* 4. Pulsante inferiore: Azzera tutti i filtri (sidebar + ricerca in alto) */}
      <div className="mt-6 border-t border-slate-200/80 pt-4">
        <button
          type="button"
          onClick={() => onResetAllFilters?.()}
          disabled={!canResetAny}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Azzera tutti i filtri
        </button>
      </div>
    </aside>
  );
}

export default SidebarFilters;
