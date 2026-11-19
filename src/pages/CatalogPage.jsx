import { ChevronRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "@/src/components/ProductCard";
import { SidebarFilters } from "@/src/components/SidebarFilters";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";

/**
 * CatalogPage (Pagina Ricerca & Catalogo `/catalogo`, `/ricerca`, `/categorie`)
 * Utilizza la nuova `SidebarFilters` priva di categorie hardcodate:
 * le categorie si selezionano dalla barra in alto (`public.categorie_sito`),
 * mentre la barra sinistra gestisce condizione, fascia prezzo, foto e spedizione rapida.
 */
export function CatalogPage({
  searchSection,
  activeTyreBanner,
  oemResultsSection,
  filters,
  onChangeFilters,
  activeSidebarFilterCount,
  hasActiveTopSearch,
  mobileFiltersOpen,
  onMobileFiltersOpenChange,
  filteredParts,
  selectedVeicoloId,
  vehicleType,
  selectedCategoryName,
  sortBy,
  onChangeSortBy,
  onAddToCart,
  onRequestQuote,
  onInspectPart,
  onResetAll,
}) {
  return (
    <div className="bg-[#F9FAFB]">
      {/* Barra di ricerca principale in alto (Veicolo + Categorie Supabase + OEM) */}
      {searchSection}
      {activeTyreBanner}
      {oemResultsSection}

      {/* Sezione Catalogo con Sidebar Filtri Operativi */}
      <section
        id="catalogo-ricambi"
        className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      >
        {/* Breadcrumb pagina catalogo */}
        <nav
          aria-label="Percorso catalogo"
          className="mb-5 flex items-center gap-1.5 text-xs text-slate-500"
        >
          <Link to="/" className="hover:text-[#1E3A8A] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium text-slate-800">
            {selectedCategoryName
              ? `Catalogo · ${selectedCategoryName}`
              : "Catalogo Ricambi"}
          </span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Sidebar Filtri Operativi Desktop */}
          <div className="hidden lg:block lg:w-72 shrink-0">
            <SidebarFilters
              filters={filters}
              onChangeFilters={onChangeFilters}
              onResetAllFilters={onResetAll}
              hasActiveTopSearch={hasActiveTopSearch}
            />
          </div>

          {/* Mobile Filter Sheet */}
          <Sheet
            open={mobileFiltersOpen}
            onOpenChange={onMobileFiltersOpenChange}
          >
            <SheetContent side="left" className="w-80 overflow-y-auto p-4">
              <SheetHeader className="mb-3 px-1">
                <SheetTitle>Filtri Ricambi</SheetTitle>
              </SheetHeader>
              <SidebarFilters
                filters={filters}
                onChangeFilters={onChangeFilters}
                onResetAllFilters={() => {
                  onResetAll();
                  onMobileFiltersOpenChange(false);
                }}
                hasActiveTopSearch={hasActiveTopSearch}
                className="border-0 p-1 shadow-none"
              />
            </SheetContent>
          </Sheet>

          {/* Griglia Risultati Ricambi */}
          <div className="min-w-0 flex-1">
            {/* Toolbar conteggio e ordinamento */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {selectedCategoryName
                    ? `Ricambi: ${selectedCategoryName}`
                    : "Catalogo Ricambi Disponibili"}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500 tabular-nums">
                  {filteredParts.length}{" "}
                  {filteredParts.length === 1
                    ? "ricambio verificato trovato"
                    : "ricambi verificati trovati"}
                  {selectedVeicoloId && (
                    <span className="ml-2 text-xs text-slate-400">
                      · Filtro veicolo attivo ({String(vehicleType).toUpperCase()})
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onMobileFiltersOpenChange(true)}
                  className="lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtri
                  {activeSidebarFilterCount > 0 && ` (${activeSidebarFilterCount})`}
                </Button>

                <div className="w-48">
                  <Select value={sortBy} onValueChange={onChangeSortBy}>
                    <SelectTrigger
                      aria-label="Ordina ricambi"
                      className="h-9 bg-white text-xs"
                    >
                      <SelectValue placeholder="Ordina per" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Rilevanza</SelectItem>
                      <SelectItem value="price-asc">Prezzo: crescente</SelectItem>
                      <SelectItem value="price-desc">Prezzo: decrescente</SelectItem>
                      <SelectItem value="year-desc">Anno più recente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {filteredParts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredParts.map((part) => (
                  <ProductCard
                    key={part.id}
                    part={part}
                    onAddToCart={onAddToCart}
                    onRequestQuote={onRequestQuote}
                    onInspectPart={onInspectPart}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
                <h2 className="font-display text-lg font-semibold text-slate-900">
                  Nessun ricambio corrisponde ai filtri selezionati
                </h2>
                <p className="mt-1.5 max-w-md text-sm text-slate-500">
                  Prova ad ampliare la fascia di prezzo, cambiare la condizione oppure
                  azzerare i filtri attivi.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onResetAll}
                  className="mt-5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Azzera tutti i filtri
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default CatalogPage;
