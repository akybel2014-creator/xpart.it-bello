import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CartDrawer, type CartItem } from "@/src/components/CartDrawer";
import { CategorySidebar, type FilterState } from "@/src/components/CategorySidebar";
import { Header } from "@/src/components/Header";
import { ProductCard } from "@/src/components/ProductCard";
import { ProductDetailModal } from "@/src/components/ProductDetailModal";
import { QuoteModal, SellPartModal } from "@/src/components/QuoteAndSellModals";
import { SearchBar } from "@/src/components/SearchBar";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/src/components/ui/sheet";
import { Toaster } from "@/src/components/ui/sonner";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import { AUTO_PARTS, type AutoPart } from "@/src/data/parts";

type SortOption = "relevance" | "price-asc" | "price-desc" | "year-desc";

const DEFAULT_FILTERS: FilterState = {
  categoryId: null,
  subcategoryId: null,
  yearFrom: 2012,
  yearTo: 2025,
  conditions: [],
  priceRange: [50, 2000],
  verifiedOnly: false,
};

export default function App() {
  // Quick SearchBar state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");

  // Sidebar & Sort state
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Cart & Modals state
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { part: AUTO_PARTS[0], quantity: 1 },
  ]);
  const [cartOpen, setCartOpen] = useState(false);
  const [inspectedPart, setInspectedPart] = useState<AutoPart | null>(null);
  const [quotePart, setQuotePart] = useState<AutoPart | null>(null);
  const [sellModalOpen, setSellModalOpen] = useState(false);

  const hasActiveQuickSearch =
    searchQuery.trim() !== "" ||
    selectedBrand !== "all" ||
    selectedModel !== "all" ||
    selectedYear !== "all";

  const activeSidebarFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categoryId) count++;
    if (filters.subcategoryId) count++;
    if (filters.yearFrom !== 2012 || filters.yearTo !== 2025) count++;
    if (filters.conditions.length > 0) count += filters.conditions.length;
    if (filters.priceRange[0] !== 50 || filters.priceRange[1] !== 2000) count++;
    if (filters.verifiedOnly) count++;
    return count;
  }, [filters]);

  const filteredParts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = AUTO_PARTS.filter((part) => {
      if (q) {
        const searchable =
          `${part.title} ${part.oemCode} ${part.brand} ${part.model} ${part.engineCode}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      if (selectedBrand !== "all" && part.brand !== selectedBrand) return false;
      if (selectedModel !== "all" && part.model !== selectedModel) return false;

      if (selectedYear !== "all") {
        const y = Number(selectedYear);
        if (y < part.yearFrom || y > part.yearTo) return false;
      }

      if (filters.categoryId && part.category !== filters.categoryId) return false;
      if (filters.subcategoryId && part.subcategory !== filters.subcategoryId) return false;

      if (part.yearTo < filters.yearFrom || part.yearFrom > filters.yearTo) {
        return false;
      }

      if (
        filters.conditions.length > 0 &&
        !filters.conditions.includes(part.condition)
      ) {
        return false;
      }

      if (
        part.priceNet < filters.priceRange[0] ||
        part.priceNet > filters.priceRange[1]
      ) {
        return false;
      }

      if (filters.verifiedOnly && !part.seller.verified) return false;

      return true;
    });

    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => a.priceNet - b.priceNet);
    }
    if (sortBy === "price-desc") {
      return [...list].sort((a, b) => b.priceNet - a.priceNet);
    }
    if (sortBy === "year-desc") {
      return [...list].sort((a, b) => b.yearTo - a.yearTo);
    }
    return list;
  }, [searchQuery, selectedBrand, selectedModel, selectedYear, filters, sortBy]);

  const totalCartUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (part: AutoPart) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.part.id === part.id);
      if (existing) {
        if (existing.quantity >= part.stock) {
          toast.info(`Disponibilità massima raggiunta per ${part.title}.`);
          return prev;
        }
        toast.success(`Quantità aggiornata: ${part.title}`);
        return prev.map((item) =>
          item.part.id === part.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      toast.success(`Aggiunto al carrello: ${part.title}`);
      return [...prev, { part, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (partId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.part.id === partId
            ? {
                ...item,
                quantity: Math.min(item.part.stock, item.quantity + delta),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (partId: string) => {
    setCartItems((prev) => prev.filter((item) => item.part.id !== partId));
  };

  const handleResetQuickSearch = () => {
    setSearchQuery("");
    setSelectedBrand("all");
    setSelectedModel("all");
    setSelectedYear("all");
  };

  const handleResetAll = () => {
    handleResetQuickSearch();
    setFilters(DEFAULT_FILTERS);
    setSortBy("relevance");
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col bg-[#F9FAFB] text-slate-900">
        <Header
          cartCount={totalCartUnits}
          onOpenCart={() => setCartOpen(true)}
          onOpenSellModal={() => setSellModalOpen(true)}
          onNavigateSection={scrollToSection}
          onFilterVerifiedOnly={() => {
            setFilters((prev) => ({ ...prev, verifiedOnly: true }));
            toast.success("Filtro attivo: solo autodemolitori verificati.");
          }}
        />

        <main className="flex-1">
          <SearchBar
            query={searchQuery}
            selectedBrand={selectedBrand}
            selectedModel={selectedModel}
            selectedYear={selectedYear}
            onQueryChange={setSearchQuery}
            onBrandChange={setSelectedBrand}
            onModelChange={setSelectedModel}
            onYearChange={setSelectedYear}
            onSubmitSearch={() => scrollToSection("catalogo-ricambi")}
            onResetSearch={handleResetQuickSearch}
            hasActiveQuickSearch={hasActiveQuickSearch}
          />

          {/* Catalog & Sidebar Filters */}
          <section
            id="catalogo-ricambi"
            className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              {/* Desktop Sidebar */}
              <div className="hidden lg:block lg:w-72 shrink-0">
                <CategorySidebar
                  filters={filters}
                  onChangeFilters={setFilters}
                  onResetAll={() => setFilters(DEFAULT_FILTERS)}
                  activeFilterCount={activeSidebarFilterCount}
                />
              </div>

              {/* Mobile Filter Sheet */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetContent side="left" className="w-80 overflow-y-auto p-4">
                  <SheetHeader className="mb-3 px-1">
                    <SheetTitle>Filtri Catalogo</SheetTitle>
                  </SheetHeader>
                  <CategorySidebar
                    filters={filters}
                    onChangeFilters={setFilters}
                    onResetAll={() => setFilters(DEFAULT_FILTERS)}
                    activeFilterCount={activeSidebarFilterCount}
                  />
                </SheetContent>
              </Sheet>

              {/* Main Product Grid Column */}
              <div className="min-w-0 flex-1">
                {/* Catalog Toolbar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">
                      Catalogo Ricambi Disponibili
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500 tabular-nums">
                      {filteredParts.length}{" "}
                      {filteredParts.length === 1
                        ? "ricambio verificato trovato"
                        : "ricambi verificati trovati"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMobileFiltersOpen(true)}
                      className="lg:hidden"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtri
                      {activeSidebarFilterCount > 0 && ` (${activeSidebarFilterCount})`}
                    </Button>

                    <div className="w-48">
                      <Select
                        value={sortBy}
                        onValueChange={(val) => setSortBy(val as SortOption)}
                      >
                        <SelectTrigger aria-label="Ordina ricambi" className="h-9 bg-white text-xs">
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

                {/* Product Grid */}
                {filteredParts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredParts.map((part) => (
                      <ProductCard
                        key={part.id}
                        part={part}
                        onAddToCart={handleAddToCart}
                        onRequestQuote={setQuotePart}
                        onInspectPart={setInspectedPart}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
                    <h3 className="font-display text-lg font-semibold text-slate-900">
                      Nessun ricambio corrisponde ai filtri selezionati
                    </h3>
                    <p className="mt-1.5 max-w-md text-sm text-slate-500">
                      Prova ad ampliare la fascia di prezzo, modificare l&apos;anno di compatibilità
                      oppure rimuovere la ricerca per codice OEM.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetAll}
                      className="mt-5"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Ripristina tutti i filtri
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>

        {/* Quiet Corporate B2B Footer */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-4 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-display font-semibold text-slate-800">
                CasaLavoroPRO — Sezione Automotive
              </span>
              <span aria-hidden="true">·</span>
              <span>Marketplace B2B Autoricambi Usati & Ricondizionati</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => scrollToSection("ricerca-avanzata")}
                className="hover:text-[#1E3A8A] transition-colors cursor-pointer"
              >
                Ricerca OEM
              </button>
              <Separator orientation="vertical" className="h-3" />
              <button
                type="button"
                onClick={() => setSellModalOpen(true)}
                className="hover:text-[#1E3A8A] transition-colors cursor-pointer"
              >
                Diventa Fornitore
              </button>
              <Separator orientation="vertical" className="h-3" />
              <span>© 2026 CasaLavoroPRO</span>
            </div>
          </div>
        </footer>

        {/* Interactive Drawers & Modals */}
        <CartDrawer
          open={cartOpen}
          onOpenChange={setCartOpen}
          items={cartItems}
          onUpdateQty={handleUpdateCartQty}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={() => setCartItems([])}
        />

        <ProductDetailModal
          part={inspectedPart}
          onClose={() => setInspectedPart(null)}
          onAddToCart={handleAddToCart}
          onRequestQuote={setQuotePart}
        />

        <QuoteModal part={quotePart} onClose={() => setQuotePart(null)} />
        <SellPartModal open={sellModalOpen} onOpenChange={setSellModalOpen} />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
