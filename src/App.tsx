import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { toast } from "sonner";
import { CartDrawer, type CartItem } from "@/src/components/CartDrawer";
import type { CategoriaSito } from "@/src/components/CategorySelector";
import { CheckoutSummary } from "@/src/components/CheckoutSummary";
import { Footer } from "@/src/components/Footer";
import { Header, type PortalView } from "@/src/components/Header";
import {
  OemCatalogResults,
  type GroupedOemCatalogCard,
} from "@/src/components/OemCatalogResults";
import { ProductDetailModal } from "@/src/components/ProductDetailModal";
import { QuoteModal, SellPartModal } from "@/src/components/QuoteAndSellModals";
import { SearchBar, type SearchModuleTab } from "@/src/components/SearchBar";
import { SellerDashboard } from "@/src/components/SellerDashboard";
import {
  countActiveSidebarFilters,
  DEFAULT_SIDEBAR_FILTERS,
  type SidebarFilterState,
} from "@/src/components/SidebarFilters";
import type { TyreSearchPayload } from "@/src/components/TyreSelector";
import type {
  VehicleSearchSelection,
  VehicleType,
} from "@/src/components/VehicleSearchBox";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
import { Toaster } from "@/src/components/ui/sonner";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import { AUTO_PARTS, type AutoPart } from "@/src/data/parts";
import { useOemCatalogSearch } from "@/src/hooks/useOemCatalogSearch";
import { CatalogPage } from "@/src/pages/CatalogPage";
import { ChiSiamo } from "@/src/pages/ChiSiamo";
import { Contatti } from "@/src/pages/Contatti";
import { GaranziaResi } from "@/src/pages/GaranziaResi";
import { HomePage } from "@/src/pages/HomePage";
import {
  CookiePolicy,
  DirectoryDemolitori,
  DiventaFornitore,
  MarcheSupportate,
  OfficineB2B,
} from "@/src/pages/PagineInformativeExtra";
import { PrivacyPolicy } from "@/src/pages/PrivacyPolicy";
import { TerminiDiServizio } from "@/src/pages/TerminiDiServizio";
import { normalizeOemCode } from "@/src/services/oemCatalogService";

type SortOption = "relevance" | "price-asc" | "price-desc" | "year-desc";

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeView: PortalView =
    location.pathname === "/pannello-fornitore" ? "seller-dashboard" : "marketplace";

  const handleChangeView = (view: PortalView) => {
    if (view === "seller-dashboard") {
      navigate("/pannello-fornitore");
    } else if (
      location.pathname !== "/" &&
      location.pathname !== "/ricerca" &&
      location.pathname !== "/catalogo" &&
      location.pathname !== "/categorie"
    ) {
      navigate("/");
    }
  };

  // Quick SearchBar / VehicleSearchBox / TyreSelector state
  const [activeSearchTab, setActiveSearchTab] = useState<SearchModuleTab>("ricambi");
  const [activeTyreSearch, setActiveTyreSearch] = useState<TyreSearchPayload | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>("auto");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVin, setActiveVin] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedEngine, setSelectedEngine] = useState("all");
  const [selectedVeicoloId, setSelectedVeicoloId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoriaSito | null>(null);

  // Ricerca live su Supabase `public.codici_oem_catalogo` collegata al campo OEM + Marca
  const oemCatalogSearch = useOemCatalogSearch({
    query: searchQuery,
    selectedBrand,
  });

  // Sidebar & Sort state (SidebarFilters collegata a `public.parts`)
  const [filters, setFilters] = useState<SidebarFilterState>(DEFAULT_SIDEBAR_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchResetKey, setSearchResetKey] = useState(0);

  // Cart & Modals state
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { part: AUTO_PARTS[0], quantity: 1 },
  ]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutSnapshot, setCheckoutSnapshot] = useState<CartItem[]>([]);
  const [inspectedPart, setInspectedPart] = useState<AutoPart | null>(null);
  const [quotePart, setQuotePart] = useState<AutoPart | null>(null);
  const [sellModalOpen, setSellModalOpen] = useState(false);

  const activeSidebarFilterCount = useMemo(
    () => countActiveSidebarFilters(filters),
    [filters]
  );

  const hasActiveTopSearch = Boolean(
    searchQuery.trim() ||
      activeVin.trim() ||
      selectedBrand !== "all" ||
      selectedModel !== "all" ||
      selectedEngine !== "all" ||
      selectedCategory !== null ||
      activeTyreSearch !== null
  );

  const filteredParts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const normalizedQ = normalizeOemCode(searchQuery);

    const list = AUTO_PARTS.filter((part) => {
      if (q) {
        const searchable =
          `${part.title} ${part.oemCode} ${part.brand} ${part.model} ${part.engineCode}`.toLowerCase();
        const normalizedPartOem = normalizeOemCode(part.oemCode);
        const matchesText = searchable.includes(q);
        const matchesNormalizedOem =
          normalizedQ.length >= 2 && normalizedPartOem.includes(normalizedQ);
        if (!matchesText && !matchesNormalizedOem) return false;
      }

      if (
        selectedBrand !== "all" &&
        part.brand.toLowerCase() !== selectedBrand.toLowerCase()
      ) {
        return false;
      }

      if (selectedModel !== "all") {
        const cleanSelected = selectedModel
          .replace(/\([^)]*\)/g, " ")
          .toLowerCase()
          .trim();
        const partModelLower = part.model.toLowerCase();
        const modelTokens = partModelLower
          .split(/[\s/]+/)
          .filter((t) => t.length >= 2);
        const matchesModel =
          cleanSelected.includes(partModelLower) ||
          partModelLower.includes(cleanSelected) ||
          modelTokens.some((t) => cleanSelected.includes(t));
        if (!matchesModel) return false;
      }

      if (selectedEngine !== "all") {
        const cleanEngine = selectedEngine
          .replace(/\([^)]*\)/g, " ")
          .toLowerCase();
        const engineTokens = cleanEngine
          .split(/[\s·/]+/)
          .map((t) => t.replace(/^cod\.\s*/i, "").trim())
          .filter((t) => t.length >= 2 && !["kw", "cv"].includes(t));
        const target = `${part.engineCode} ${part.description}`.toLowerCase();
        const matchesEngine = engineTokens.some((token) => target.includes(token));
        if (!matchesEngine) return false;
      }

      if (selectedCategory) {
        const slugClean = (selectedCategory.slug || "").toLowerCase();
        const catText = `${slugClean} ${selectedCategory.nome} ${selectedCategory.macro_gruppo}`.toLowerCase();
        const partText = `${part.category} ${part.subcategory} ${part.title} ${part.description}`.toLowerCase();
        const synonymMap: Record<string, string[]> = {
          freni: ["frenante", "pinza", "disco", "brembo"],
          motore: ["motore", "turbocompressore", "alternatore"],
          "componenti-per-la-sovralimentazione": ["turbocompressore", "turbina", "intercooler", "sovralimentazione"],
          "turbina-sovralimentazione": ["turbina", "turbocompressore", "turbo"],
          illuminazione: ["illuminazione", "faro", "proiettore", "led"],
          cambio: ["trasmissione", "cambio", "dsg", "frizione"],
          ammortizzazione: ["sospensioni", "ammortizzatore", "macpherson"],
          sospensioni: ["sospensioni", "ammortizzatore"],
          sterzo: ["sospensioni", "sterzo", "scatola"],
          "impianto-elettrico": ["elettronica", "centralina", "alternatore", "ecu"],
          "sensori-rele-unita-controllo": ["elettronica", "centralina", "ecu", "sensore"],
        };
        const mappedTerms = synonymMap[slugClean] ?? [];
        const slugTokens = slugClean
          .split("-")
          .filter((t) => t.length >= 4 && !["della", "delle", "degli", "nell", "accessori"].includes(t));
        const nameTokens = (selectedCategory.nome || "")
          .toLowerCase()
          .split(/[\s,/]+/)
          .filter((t) => t.length >= 4);
        const matchesCat =
          (slugClean && partText.includes(slugClean)) ||
          mappedTerms.some((term) => partText.includes(term)) ||
          slugTokens.some((tok) => partText.includes(tok)) ||
          nameTokens.some((tok) => partText.includes(tok)) ||
          catText.includes(part.category.toLowerCase());
        if (!matchesCat) return false;
      }

      // 1. Filtro Condizione del pezzo (Tutti / Usato / Nuovo / Ricondizionato)
      if (filters.condizione && filters.condizione !== "tutti") {
        const condTarget = filters.condizione.toLowerCase();
        if (!part.condition.toLowerCase().includes(condTarget)) {
          return false;
        }
      }

      // 2. Filtro Fascia di Prezzo (Min € / Max €)
      const minPrice = Number(filters.prezzoMin);
      if (
        filters.prezzoMin !== "" &&
        Number.isFinite(minPrice) &&
        part.priceNet < minPrice
      ) {
        return false;
      }

      const maxPrice = Number(filters.prezzoMax);
      if (
        filters.prezzoMax !== "" &&
        Number.isFinite(maxPrice) &&
        part.priceNet > maxPrice
      ) {
        return false;
      }

      // 3. Solo con foto disponibili
      if (filters.soloConFoto && !part.image?.trim()) {
        return false;
      }

      // 4. Spedizione rapida disponibile (evasione entro 24h)
      if (filters.spedizioneRapida && part.seller.dispatchHours > 24) {
        return false;
      }

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
  }, [
    searchQuery,
    selectedBrand,
    selectedModel,
    selectedEngine,
    selectedCategory,
    filters,
    sortBy,
  ]);

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

  const applyVehicleSelection = (selection: VehicleSearchSelection) => {
    setVehicleType(selection.tipo_veicolo);
    setSearchQuery(selection.query);
    setActiveVin(selection.vin || "");
    setSelectedBrand(selection.marca || "all");
    setSelectedModel(selection.modello || "all");
    setSelectedEngine(selection.motorizzazione || "all");
    setSelectedVeicoloId(selection.veicolo_id || "");
    setSelectedCategory(
      selection.categoria_id
        ? {
            id: selection.categoria_id,
            nome: selection.categoria_nome,
            slug: selection.categoria_slug,
            macro_gruppo: "Principale",
          }
        : null
    );
  };

  const handleResetQuickSearch = (selection?: VehicleSearchSelection) => {
    if (selection) {
      applyVehicleSelection(selection);
    } else {
      setSearchQuery("");
      setActiveVin("");
      setSelectedBrand("all");
      setSelectedModel("all");
      setSelectedEngine("all");
      setSelectedVeicoloId("");
      setSelectedCategory(null);
    }
    oemCatalogSearch.clearResults();
  };

  const handleSubmitQuickSearch = (selection: VehicleSearchSelection) => {
    applyVehicleSelection(selection);
    const normalized = normalizeOemCode(selection.query);
    if (normalized.length >= 2) {
      void oemCatalogSearch.searchNow(selection.query, selection.marca || "all");
    }
    navigate("/catalogo");
  };

  const handleSelectCategoryCard = (cat: CategoriaSito) => {
    setSelectedCategory(cat);
    navigate("/catalogo");
  };

  const handleSelectCrossReference = (code: string) => {
    setSearchQuery(code);
    void oemCatalogSearch.searchNow(code, selectedBrand);
  };

  const handleClearBrandForOem = () => {
    setSelectedBrand("all");
    setSelectedModel("all");
    setSelectedEngine("all");
    void oemCatalogSearch.searchNow(searchQuery, "all");
  };

  const handleSearchTyres = (payload: TyreSearchPayload) => {
    setActiveTyreSearch(payload);
    const brandLabel = payload.marca !== "tutti" ? ` · ${payload.marca}` : "";
    const seasonLabel = payload.stagione !== "tutte" ? ` · ${payload.stagione}` : "";
    toast.success(
      `Ricerca pneumatici avviata: ${payload.misura_formattata || payload.veicolo}${seasonLabel}${brandLabel}`
    );
    navigate("/catalogo");
  };

  const handleResetTyres = () => {
    setActiveTyreSearch(null);
  };

  const handleResetAll = () => {
    handleResetQuickSearch();
    setActiveTyreSearch(null);
    setFilters(DEFAULT_SIDEBAR_FILTERS);
    setSortBy("relevance");
    setSearchResetKey((prev) => prev + 1);
    toast.info("Tutti i filtri di ricerca sono stati azzerati.");
  };

  const scrollToSection = (sectionId: string) => {
    if (sectionId === "catalogo-ricambi" && location.pathname === "/") {
      navigate("/catalogo");
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Gestisce scroll automatico coerente al cambio percorso React Router
  useEffect(() => {
    if (location.pathname === "/catalogo" || location.pathname === "/categorie") {
      window.setTimeout(() => {
        const el = document.getElementById("catalogo-ricambi");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 60);
    } else if (location.pathname === "/ricerca") {
      setActiveSearchTab("ricambi");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  const sharedSearchHero = (
    <SearchBar
      activeSearchTab={activeSearchTab}
      onChangeSearchTab={setActiveSearchTab}
      query={searchQuery}
      initialTipoVeicolo={vehicleType}
      isOemSearching={oemCatalogSearch.isLoading}
      onSelectionChange={applyVehicleSelection}
      onSubmitSearch={handleSubmitQuickSearch}
      onResetSearch={handleResetQuickSearch}
      onSearchTyres={handleSearchTyres}
      onResetTyres={handleResetTyres}
      searchResetKey={searchResetKey}
    />
  );

  const handleFindCompatiblePartsFromOem = (card: GroupedOemCatalogCard) => {
    const cleanOem = card.oemCode && card.oemCode !== "—" ? card.oemCode : oemCatalogSearch.normalizedQuery;
    setSearchQuery(cleanOem);
    if (card.carBrand) {
      setSelectedBrand(card.carBrand);
    }
    setActiveSearchTab("ricambi");
    setActiveTyreSearch(null);
    if (location.pathname !== "/catalogo" && location.pathname !== "/ricerca") {
      navigate("/catalogo");
    }
    window.setTimeout(() => {
      document
        .getElementById("catalogo-ricambi")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleRequestAvailabilityFromOem = (card: GroupedOemCatalogCard) => {
    const params = new URLSearchParams();
    if (card.oemCode && card.oemCode !== "—") params.set("oem", card.oemCode);
    if (card.carBrand) params.set("marca", card.carBrand);
    if (card.carModel) params.set("modello", card.carModel);
    navigate(`/contatti?${params.toString()}`);
  };

  const sharedOemResults = (
    <OemCatalogResults
      results={oemCatalogSearch.results}
      verifiedVehicles={oemCatalogSearch.verifiedVehicles}
      activeVin={activeVin}
      totalCount={oemCatalogSearch.totalCount}
      normalizedQuery={oemCatalogSearch.normalizedQuery}
      selectedBrand={selectedBrand}
      isLoading={oemCatalogSearch.isLoading}
      hasSearched={oemCatalogSearch.hasSearched}
      error={oemCatalogSearch.error}
      onSelectCrossReference={handleSelectCrossReference}
      onClearBrandFilter={handleClearBrandForOem}
      onRetry={() => void oemCatalogSearch.searchNow()}
      onClearQuery={() => {
        setSearchQuery("");
        oemCatalogSearch.clearResults();
      }}
      onFindCompatibleParts={handleFindCompatiblePartsFromOem}
      onRequestAvailability={handleRequestAvailabilityFromOem}
    />
  );

  const activeTyreBanner = activeTyreSearch ? (
    <section className="border-b border-slate-200/80 bg-[#F9FAFB]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold text-[#1E3A8A]">
            Filtro Pneumatici attivo:
          </span>
          <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono font-semibold text-slate-900">
            {activeTyreSearch.misura_formattata || activeTyreSearch.veicolo.toUpperCase()}
          </span>
          <span className="rounded border border-slate-200 bg-white px-2 py-0.5 capitalize text-slate-700">
            Veicolo: {activeTyreSearch.veicolo}
          </span>
          {activeTyreSearch.stagione !== "tutte" && (
            <span className="rounded border border-orange-200 bg-orange-50 px-2 py-0.5 capitalize font-medium text-orange-800">
              Stagione: {activeTyreSearch.stagione}
            </span>
          )}
          {activeTyreSearch.marca !== "tutti" && (
            <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700">
              Produttore: {activeTyreSearch.marca}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleResetTyres}
          className="h-7 text-xs text-slate-500 hover:text-slate-900"
        >
          Rimuovi filtro pneumatici
        </Button>
      </div>
    </section>
  ) : null;

  const catalogPageElement = (
    <CatalogPage
      searchSection={sharedSearchHero}
      activeTyreBanner={activeTyreBanner}
      oemResultsSection={sharedOemResults}
      filters={filters}
      onChangeFilters={setFilters}
      activeSidebarFilterCount={activeSidebarFilterCount}
      hasActiveTopSearch={hasActiveTopSearch}
      mobileFiltersOpen={mobileFiltersOpen}
      onMobileFiltersOpenChange={setMobileFiltersOpen}
      filteredParts={filteredParts}
      selectedVeicoloId={selectedVeicoloId}
      vehicleType={vehicleType}
      selectedCategoryName={selectedCategory?.nome ?? null}
      sortBy={sortBy}
      onChangeSortBy={(val: SortOption) => setSortBy(val)}
      onAddToCart={handleAddToCart}
      onRequestQuote={setQuotePart}
      onInspectPart={setInspectedPart}
      onResetAll={handleResetAll}
    />
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col bg-[#F9FAFB] text-slate-900">
        <Header
          activeView={activeView}
          onChangeView={handleChangeView}
          cartCount={totalCartUnits}
          onOpenCart={() => setCartOpen(true)}
          onOpenSellModal={() => setSellModalOpen(true)}
          onNavigateSection={scrollToSection}
          onOpenTyresSearch={() => setActiveSearchTab("pneumatici")}
          onFilterVerifiedOnly={() => {
            navigate("/demolitori");
          }}
        />

        {/* Mobile quick view switcher (hidden on md+ where Header nav is visible) */}
        <div className="border-b border-slate-200 bg-white px-4 py-2 md:hidden">
          <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-[#F9FAFB] p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => handleChangeView("marketplace")}
              className={`rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeView === "marketplace"
                  ? "bg-white text-[#1E3A8A] shadow-xs"
                  : "text-slate-600"
              }`}
            >
              Catalogo Ricambi
            </button>
            <button
              type="button"
              onClick={() => handleChangeView("seller-dashboard")}
              className={`rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeView === "seller-dashboard"
                  ? "bg-white text-[#16A34A] shadow-xs"
                  : "text-slate-600"
              }`}
            >
              Pannello Fornitore
            </button>
          </div>
        </div>

        <main className="flex-1">
          <Routes>
            {/* Homepage a tutta larghezza senza sidebar laterale filtri */}
            <Route
              path="/"
              element={
                <HomePage
                  heroSection={sharedSearchHero}
                  oemResultsSection={sharedOemResults}
                  onSelectCategoryCard={handleSelectCategoryCard}
                  onOpenSellModal={() => setSellModalOpen(true)}
                />
              }
            />

            {/* Pagina Ricerca & Catalogo dedicata con filtri laterali */}
            <Route path="/ricerca" element={catalogPageElement} />
            <Route path="/catalogo" element={catalogPageElement} />
            <Route path="/categorie" element={catalogPageElement} />
            <Route path="/demolitori" element={<DirectoryDemolitori />} />
            <Route path="/marche" element={<MarcheSupportate />} />

            {/* Area Fornitori e Officine */}
            <Route path="/pannello-fornitore" element={<SellerDashboard />} />
            <Route path="/diventa-fornitore" element={<DiventaFornitore />} />
            <Route path="/officine-b2b" element={<OfficineB2B />} />
            <Route path="/garanzia-e-resi" element={<GaranziaResi />} />

            {/* Supporto e Note Legali */}
            <Route path="/chi-siamo" element={<ChiSiamo />} />
            <Route path="/contatti" element={<Contatti />} />
            <Route path="/termini-di-servizio" element={<TerminiDiServizio />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />

            {/* Fallback sicuro: evita schermate bianche o 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer B2B Professionale a 4 Colonne + Barra Copyright */}
        <Footer />

        {/* Interactive Drawers & Modals */}
        <CartDrawer
          open={cartOpen}
          onOpenChange={setCartOpen}
          items={cartItems}
          onUpdateQty={handleUpdateCartQty}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={() => setCartItems([])}
          onProceedToCheckout={() => {
            setCheckoutSnapshot(cartItems);
            setCartOpen(false);
            setCheckoutOpen(true);
          }}
        />

        <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
            <DialogTitle className="sr-only">
              Riepilogo Ordine e Pagamento B2B
            </DialogTitle>
            <CheckoutSummary
              items={checkoutSnapshot}
              onPaymentSuccess={(res) => {
                setCartItems([]);
                toast.success(
                  `Ordine ${res?.codiceOrdine ?? ""} confermato con successo.`
                );
              }}
              onBackToCart={() => {
                setCheckoutOpen(false);
                if (cartItems.length > 0) setCartOpen(true);
              }}
            />
          </DialogContent>
        </Dialog>

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

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
