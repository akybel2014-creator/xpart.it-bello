import type { SupabaseClient } from "@supabase/supabase-js";

export type TyreVehicleType = "auto" | "suv" | "furgone" | "moto";
export type TyreSearchMode = "dimensione" | "veicolo";
export type TyreSeason = "estive" | "invernali" | "4stagioni" | "tutte";

export interface TyreSearchPayload {
  veicolo: TyreVehicleType;
  modalita: TyreSearchMode;
  larghezza: string;
  altezza: string;
  diametro: string;
  stagione: TyreSeason;
  marca: string;
  marca_veicolo: string;
  modello_veicolo: string;
  motorizzazione_veicolo: string;
  misura_formattata: string;
}

export interface TyreSelectorProps {
  initialVeicolo?: TyreVehicleType;
  supabaseClient?: SupabaseClient | null;
  executePartsQuery?: boolean;
  onSearch?: (
    payload: TyreSearchPayload,
    partsResponse?: { data: unknown[]; error: unknown }
  ) => void;
  onReset?: () => void;
  className?: string;
}

export function cercaPneumaticiSuSupabase(
  filtri: TyreSearchPayload,
  client?: SupabaseClient | null
): Promise<{ data: unknown[]; error: unknown }>;

export function TyreSelector(props: TyreSelectorProps): React.JSX.Element;
export default TyreSelector;
