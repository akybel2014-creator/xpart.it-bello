import { RotateCcw, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { HERO_BANNER_IMAGE, VEHICLE_MAKES } from "@/src/data/parts";

interface SearchBarProps {
  query: string;
  selectedBrand: string;
  selectedModel: string;
  selectedYear: string;
  onQueryChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onSubmitSearch: () => void;
  onResetSearch: () => void;
  hasActiveQuickSearch: boolean;
}

const YEARS = Array.from({ length: 11 }, (_, idx) => String(2025 - idx));

export function SearchBar({
  query,
  selectedBrand,
  selectedModel,
  selectedYear,
  onQueryChange,
  onBrandChange,
  onModelChange,
  onYearChange,
  onSubmitSearch,
  onResetSearch,
  hasActiveQuickSearch,
}: SearchBarProps) {
  const availableModels =
    selectedBrand && selectedBrand !== "all" ? VEHICLE_MAKES[selectedBrand] ?? [] : [];

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

        {/* Prominent B2B SearchBar with Shadcn Select Controls */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitSearch();
          }}
          className="mt-8 rounded-2xl border border-slate-200 bg-[#F9FAFB] p-3 sm:p-4 shadow-xs"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
            <div className="relative md:col-span-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Codice OEM, ricambio o motore (es. 55264310)..."
                aria-label="Cerca per codice OEM o descrizione ricambio"
                className="h-11 pl-10 bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <Select
                value={selectedBrand}
                onValueChange={(value) => {
                  onBrandChange(value);
                  onModelChange("all");
                }}
              >
                <SelectTrigger aria-label="Seleziona Marca" className="h-11 bg-white">
                  <SelectValue placeholder="Marca veicolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le marche</SelectItem>
                  {Object.keys(VEHICLE_MAKES).map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Select
                value={selectedModel}
                onValueChange={onModelChange}
                disabled={!selectedBrand || selectedBrand === "all"}
              >
                <SelectTrigger aria-label="Seleziona Modello" className="h-11 bg-white">
                  <SelectValue placeholder="Modello" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i modelli</SelectItem>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Select value={selectedYear} onValueChange={onYearChange}>
                <SelectTrigger aria-label="Seleziona Anno" className="h-11 bg-white">
                  <SelectValue placeholder="Anno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli anni</SelectItem>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Button type="submit" size="lg" className="h-11 w-full">
                <Search className="h-4 w-4" />
                Cerca Ricambi
              </Button>
              {hasActiveQuickSearch && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onResetSearch}
                  title="Ripristina ricerca rapida"
                  aria-label="Ripristina ricerca rapida"
                  className="h-11 w-11 shrink-0 bg-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
