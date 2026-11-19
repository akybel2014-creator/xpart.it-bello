import type { SupabaseClient } from "@supabase/supabase-js";

export type PartConditionFilter = "tutti" | "Usato" | "Nuovo" | "Ricondizionato";

export interface SidebarFilterState {
  condizione: PartConditionFilter;
  prezzoMin: string;
  prezzoMax: string;
  soloConFoto: boolean;
  spedizioneRapida: boolean;
}

export const DEFAULT_SIDEBAR_FILTERS: SidebarFilterState;

export function countActiveSidebarFilters(filters: SidebarFilterState): number;

export function applicaFiltriSidebarSuSupabase<T>(
  queryBuilder: T,
  filtri: SidebarFilterState
): T;

export function cercaPartsConFiltriSuSupabase(
  topFilters?: {
    tipo_veicolo?: string;
    marca?: string;
    modello?: string;
    categoria_id?: string;
    query?: string;
  },
  sidebarFilters?: SidebarFilterState,
  client?: SupabaseClient | null
): Promise<{ data: unknown[]; error: unknown }>;

export interface SidebarFiltersProps {
  filters: SidebarFilterState;
  onChangeFilters: (next: SidebarFilterState) => void;
  onResetAllFilters: () => void;
  hasActiveTopSearch?: boolean;
  className?: string;
}

export function SidebarFilters(props: SidebarFiltersProps): React.JSX.Element;
export default SidebarFilters;
