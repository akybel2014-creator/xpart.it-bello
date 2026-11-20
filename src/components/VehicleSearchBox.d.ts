import type { SupabaseClient } from "@supabase/supabase-js";

export type VehicleType = "auto" | "moto" | "camion";

export interface VehicleSearchSelection {
  tipo_veicolo: VehicleType;
  marca: string;
  modello: string;
  motorizzazione: string;
  veicolo_id: string;
  query: string;
  vin?: string;
  vin_wmi?: string;
  categoria_id: string;
  categoria_slug: string;
  categoria_nome: string;
}

export interface VehicleSearchBoxProps {
  initialTipoVeicolo?: VehicleType;
  query?: string;
  isOemSearching?: boolean;
  executePartsQuery?: boolean;
  supabaseClient?: SupabaseClient | null;
  onChange?: (selection: VehicleSearchSelection) => void;
  onSearch?: (
    selection: VehicleSearchSelection,
    partsResponse?: { data: unknown[]; error: unknown }
  ) => void;
  onReset?: (selection: VehicleSearchSelection) => void;
  className?: string;
}

export function cercaRicambiPartsSuSupabase(
  filtri: VehicleSearchSelection,
  client?: SupabaseClient | null
): Promise<{ data: unknown[]; error: unknown }>;

export function VehicleSearchBox(props: VehicleSearchBoxProps): React.JSX.Element;
export default VehicleSearchBox;
