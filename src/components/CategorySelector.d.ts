import type { SupabaseClient } from "@supabase/supabase-js";

export interface CategoriaSito {
  id: string;
  nome: string;
  slug: string;
  macro_gruppo: string;
}

export interface CategorySelectorProps {
  onCategorySelect: (categoria: CategoriaSito | null) => void;
  value?: Partial<CategoriaSito> | null;
  variant?: "form" | "filter";
  className?: string;
  supabaseClient?: SupabaseClient | null;
}

export function CategorySelector(props: CategorySelectorProps): React.JSX.Element;
export default CategorySelector;

export function salvaRicambioSuSupabase(
  datiRicambio: Record<string, unknown>,
  categoriaSelezionata: CategoriaSito | null,
  client?: SupabaseClient | null
): Promise<{ data: unknown; error: Error | null }>;
