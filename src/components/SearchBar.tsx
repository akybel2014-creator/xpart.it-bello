import { CircleDot, ShieldCheck, Wrench } from "lucide-react";
import {
  TyreSelector,
  type TyreSearchPayload,
} from "@/src/components/TyreSelector";
import {
  VehicleSearchBox,
  type VehicleSearchSelection,
  type VehicleType,
} from "@/src/components/VehicleSearchBox";
import { HERO_BANNER_IMAGE } from "@/src/data/parts";

export type SearchModuleTab = "ricambi" | "pneumatici";

interface SearchBarProps {
  activeSearchTab: SearchModuleTab;
  onChangeSearchTab: (tab: SearchModuleTab) => void;
  query: string;
  initialTipoVeicolo?: VehicleType;
  isOemSearching?: boolean;
  onSelectionChange: (selection: VehicleSearchSelection) => void;
  onSubmitSearch: (selection: VehicleSearchSelection) => void;
  onResetSearch: (selection: VehicleSearchSelection) => void;
  onSearchTyres: (payload: TyreSearchPayload) => void;
  onResetTyres: () => void;
  searchResetKey?: number;
}

export function SearchBar({
  activeSearchTab,
  onChangeSearchTab,
  query,
  initialTipoVeicolo = "auto",
  isOemSearching = false,
  onSelectionChange,
  onSubmitSearch,
  onResetSearch,
  onSearchTyres,
  onResetTyres,
  searchResetKey = 0,
}: SearchBarProps) {
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
              Ricambi originali usati, OEM e pneumatici per la tua officina
            </h1>
            <p className="mt-3.5 max-w-xl text-base leading-relaxed text-slate-600">
              Cerca per codice OEM, veicolo compatibile o misura pneumatico. Fornitura diretta da
              autodemolitori e distributori verificati con spedizione espressa in 24/48 ore.
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
                <span className="font-mono tabular-nums opacity-90">OEM · VIN · Tyre</span>
              </div>
            </div>
          </div>
        </div>

        {/* Commutatore Tab Principale: "Ricambi Auto" vs "Pneumatici" */}
        <div className="mt-8">
          <div
            role="tablist"
            aria-label="Seleziona modulo di ricerca"
            className="mb-3 inline-flex rounded-xl border border-slate-200 bg-[#F9FAFB] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeSearchTab === "ricambi"}
              onClick={() => onChangeSearchTab("ricambi")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeSearchTab === "ricambi"
                  ? "bg-white text-[#1E3A8A] shadow-xs ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span>Ricambi Auto</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeSearchTab === "pneumatici"}
              onClick={() => onChangeSearchTab("pneumatici")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeSearchTab === "pneumatici"
                  ? "bg-white text-[#1E3A8A] shadow-xs ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CircleDot className="h-4 w-4 text-orange-500" />
              <span>Pneumatici</span>
            </button>
          </div>

          {activeSearchTab === "ricambi" ? (
            <VehicleSearchBox
              key={`vsb-${searchResetKey}`}
              initialTipoVeicolo={initialTipoVeicolo}
              query={query}
              isOemSearching={isOemSearching}
              onChange={onSelectionChange}
              onSearch={onSubmitSearch}
              onReset={onResetSearch}
            />
          ) : (
            <TyreSelector
              key={`tyre-${searchResetKey}`}
              onSearch={onSearchTyres}
              onReset={onResetTyres}
            />
          )}
        </div>
      </div>
    </section>
  );
}
