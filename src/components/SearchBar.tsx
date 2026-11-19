import { Loader2, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  CategorySelector,
  type CategoriaSito,
} from "@/src/components/CategorySelector";
import { HERO_BANNER_IMAGE } from "@/src/data/parts";
import { useVehicleCascade } from "@/src/hooks/useVehicleCascade";

interface SearchBarProps {
  query: string;
  selectedBrand: string;
  selectedModel: string;
  selectedEngine: string;
  selectedCategory: CategoriaSito | null;
  onQueryChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onEngineChange: (value: string) => void;
  onCategoryChange: (cat: CategoriaSito | null) => void;
  onSubmitSearch: () => void;
  onResetSearch: () => void;
  hasActiveQuickSearch: boolean;
}

export function SearchBar({
  query,
  selectedBrand,
  selectedModel,
  selectedEngine,
  selectedCategory,
  onQueryChange,
  onBrandChange,
  onModelChange,
  onEngineChange,
  onCategoryChange,
  onSubmitSearch,
  onResetSearch,
  hasActiveQuickSearch,
}: SearchBarProps) {
  const {
    brands,
    models,
    engines,
    loadingBrands,
    loadingModels,
    loadingEngines,
  } = useVehicleCascade({
    selectedBrand,
    selectedModel,
  });

  const isBrandSelected = Boolean(selectedBrand && selectedBrand !== "all");
  const isModelSelected = Boolean(selectedModel && selectedModel !== "all");

  return (
    <section
      id="ricerca-avanzata"
      className="border-b border-slate-200/80 bg-white"
    >
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Split Hero Presentation */}
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-7">
            <p className="text-xs font-medium tracking-wide text-[#1E3A8A]">
              CasaLavoroPRO · Sezione Automotive B2B
            </p>
            <h1 className="mt-2.5 max-w-2xl font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[42px] lg:leading-[1.15] [text-wrap:balance]">
              Ricambi originali usati e certificati per la tua officina
            </h1>
            <p className="mt-3.5 max-w-xl text-base leading-relaxed text-slate-600">
              Cerca per codice OEM, numero di telaio o veicolo compatibile. Fornitura diretta da
              autodemolitori professionali verificati con spedizione espressa in 24/48 ore.
            </p>

            {/* Adjacent Proof Metrics */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                Fornitori con certificazione ISO 9001
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="tabular-nums">Garanzia B2B fino a 24 mesi</span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="tabular-nums">Reso garantito entro 14 giorni</span>
            </div>
          </div>

          {/* 16:9 Architectural Studio Image */}
          <div className="lg:col-span-5">
            <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 lg:h-full lg:min-h-[240px]">
              <img
                src={HERO_BANNER_IMAGE}
                alt="Banco tecnico con componenti meccanici automotive ispezionati"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
              <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-xs font-medium text-white">
                <span>Ispezione al banco su ogni unità</span>
                <span className="font-mono tabular-nums opacity-90">OEM · VIN Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prominent B2B Cascading SearchBar collegata al database Supabase `auto` */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitSearch();
          }}
          className="mt-8 rounded-2xl border border-slate-200 bg-[#F9FAFB] p-3 sm:p-4 shadow-xs"
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-center">
            {/* Ricerca libera OEM / Descrizione */}
            <div className="relative lg:col-span-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Codice OEM, ricambio o motore..."
                aria-label="Cerca per codice OEM o descrizione ricambio"
                className="h-11 pl-10 bg-white"
              />
            </div>

            {/* Menu 1: Marca (caricata alfabeticamente all'avvio) */}
            <div className="lg:col-span-2">
              <Select
                value={loadingBrands ? undefined : selectedBrand}
                disabled={loadingBrands}
                onValueChange={(value) => {
                  onBrandChange(value);
                  onModelChange("all");
                  onEngineChange("all");
                }}
              >
                <SelectTrigger aria-label="Seleziona Marca" className="h-11 bg-white">
                  {loadingBrands ? (
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1E3A8A]" />
                      <span>Caricamento...</span>
                    </span>
                  ) : (
                    <SelectValue placeholder="Marca" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le marche</SelectItem>
                  {brands.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Menu 2: Modello (abilitato dopo la scelta della marca) */}
            <div className="lg:col-span-2">
              <Select
                value={loadingModels ? undefined : selectedModel}
                disabled={!isBrandSelected || loadingModels}
                onValueChange={(value) => {
                  onModelChange(value);
                  onEngineChange("all");
                }}
              >
                <SelectTrigger aria-label="Seleziona Modello" className="h-11 bg-white">
                  {loadingModels ? (
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1E3A8A]" />
                      <span>Caricamento...</span>
                    </span>
                  ) : (
                    <SelectValue
                      placeholder={
                        isBrandSelected ? "Seleziona modello" : "Modello (scegli marca)"
                      }
                    />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i modelli</SelectItem>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Menu 3: Motore / Versione (abilitato dopo la scelta del modello) */}
            <div className="lg:col-span-3">
              <Select
                value={loadingEngines ? undefined : selectedEngine}
                disabled={!isBrandSelected || !isModelSelected || loadingEngines}
                onValueChange={onEngineChange}
              >
                <SelectTrigger
                  aria-label="Seleziona Motore o Versione"
                  className="h-11 bg-white"
                >
                  {loadingEngines ? (
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1E3A8A]" />
                      <span>Caricamento in corso...</span>
                    </span>
                  ) : (
                    <SelectValue
                      placeholder={
                        isModelSelected
                          ? "Motore / Versione"
                          : "Motore (scegli modello)"
                      }
                    />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le motorizzazioni</SelectItem>
                  {engines.map((engine) => (
                    <SelectItem key={engine.value} value={engine.value}>
                      {engine.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pulsanti Cerca e Reset */}
            <div className="flex items-center gap-2 lg:col-span-2">
              <Button type="submit" size="lg" className="h-11 flex-1 px-4">
                <Search className="h-4 w-4" />
                Cerca
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onResetSearch}
                disabled={!hasActiveQuickSearch}
                title="Svuota selettori e ripristina catalogo"
                className="h-11 shrink-0 bg-white px-3 text-slate-700"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Reset</span>
              </Button>
            </div>
          </div>

          {/* Seconda riga: Filtro Categoria a 2 livelli (public.categorie_sito) */}
          <div className="mt-3 border-t border-slate-200/80 pt-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
              <span className="shrink-0 text-xs font-semibold text-slate-500">
                Categoria ricambio:
              </span>
              <CategorySelector
                variant="filter"
                value={selectedCategory}
                onCategorySelect={onCategoryChange}
                className="flex-1"
              />
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
