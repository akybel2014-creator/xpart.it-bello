import type { ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoriaSito } from "@/src/components/CategorySelector";
import type { SidebarFilterState } from "@/src/components/SidebarFilters";
import type { VehicleType } from "@/src/components/VehicleSearchBox";
import type { AutoPart } from "@/src/data/parts";

declare module "@/src/pages/HomePage" {
  export interface HomePageProps {
    heroSection: ReactNode;
    oemResultsSection?: ReactNode;
    onSelectCategoryCard?: (category: CategoriaSito) => void;
    onOpenSellModal?: () => void;
    supabaseClient?: SupabaseClient | null;
  }
  export function HomePage(props: HomePageProps): React.JSX.Element;
  export default HomePage;
}

declare module "@/src/pages/CatalogPage" {
  export interface CatalogPageProps {
    searchSection: ReactNode;
    activeTyreBanner?: ReactNode;
    oemResultsSection?: ReactNode;
    filters: SidebarFilterState;
    onChangeFilters: (filters: SidebarFilterState) => void;
    activeSidebarFilterCount: number;
    hasActiveTopSearch: boolean;
    mobileFiltersOpen: boolean;
    onMobileFiltersOpenChange: (open: boolean) => void;
    filteredParts: AutoPart[];
    selectedVeicoloId: string;
    vehicleType: VehicleType;
    selectedCategoryName?: string | null;
    sortBy: "relevance" | "price-asc" | "price-desc" | "year-desc";
    onChangeSortBy: (val: "relevance" | "price-asc" | "price-desc" | "year-desc") => void;
    onAddToCart: (part: AutoPart) => void;
    onRequestQuote: (part: AutoPart) => void;
    onInspectPart: (part: AutoPart) => void;
    onResetAll: () => void;
  }
  export function CatalogPage(props: CatalogPageProps): React.JSX.Element;
  export default CatalogPage;
}

declare module "@/src/pages/TerminiDiServizio" {
  export function TerminiDiServizio(): React.JSX.Element;
  export default TerminiDiServizio;
}

declare module "@/src/pages/PrivacyPolicy" {
  export function PrivacyPolicy(): React.JSX.Element;
  export default PrivacyPolicy;
}

declare module "@/src/pages/GaranziaResi" {
  export function GaranziaResi(): React.JSX.Element;
  export default GaranziaResi;
}

declare module "@/src/pages/ChiSiamo" {
  export function ChiSiamo(): React.JSX.Element;
  export default ChiSiamo;
}

declare module "@/src/pages/Contatti" {
  export function Contatti(): React.JSX.Element;
  export default Contatti;
}

declare module "@/src/pages/PagineInformativeExtra" {
  export function CookiePolicy(): React.JSX.Element;
  export function DiventaFornitore(): React.JSX.Element;
  export function OfficineB2B(): React.JSX.Element;
  export function DirectoryDemolitori(): React.JSX.Element;
  export function MarcheSupportate(): React.JSX.Element;
}
