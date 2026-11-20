import { AlertCircle, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CATEGORIES_TABLE_NAME,
  logSupabaseError,
  supabase as defaultSupabase,
  supabaseConfigError,
} from "@/src/lib/supabaseClient";

/**
 * Cache leggera in memoria per evitare chiamate duplicate a `public.categorie_sito`
 * quando `CategorySelector` è montato sia nella barra di ricerca sia nel form venditore.
 */
let categorieCache = null;

/**
 * Normalizza una stringa di categoria (rimuove punteggiatura/virgole e spazi extra)
 * per confrontare in modo sicuro il campo `macro_gruppo` delle sottocategorie
 * con il `nome` della macro-categoria padre (es. "Pneumatici cerchioni e accessori"
 * vs "Pneumatici, cerchioni e accessori").
 */
function normalizzaTestoCategoria(valore) {
  return (valore || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[,.;:!?/\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Funzione helper per salvare un ricambio nella tabella `parts` su Supabase
 * memorizzando in modo esplicito `categoria_id`, `categoria_nome` e `categoria_slug`.
 *
 * @param {object} datiRicambio - Campi del ricambio (marca, modello, codice_oe, prezzo_demolitore, ecc.)
 * @param {{ id: string, nome: string, slug: string, macro_gruppo: string } | null} categoriaSelezionata
 * @param {import("@supabase/supabase-js").SupabaseClient} [client] - Client Supabase opzionale
 */
export async function salvaRicambioSuSupabase(
  datiRicambio,
  categoriaSelezionata,
  client = defaultSupabase
) {
  if (!client) {
    return {
      data: null,
      error: new Error(
        supabaseConfigError ||
          "Client Supabase non configurato nelle variabili d'ambiente."
      ),
    };
  }

  if (!categoriaSelezionata?.id) {
    return {
      data: null,
      error: new Error("Seleziona una categoria valida prima di salvare il ricambio."),
    };
  }

  const payload = {
    ...datiRicambio,
    categoria_id: categoriaSelezionata.id,
    categoria_nome: categoriaSelezionata.nome,
    categoria_slug: categoriaSelezionata.slug,
  };

  const { data, error } = await client
    .from("parts")
    .insert([payload])
    .select()
    .single();

  if (error) {
    logSupabaseError("salvaRicambioSuSupabase", "parts", error);
  }

  return { data, error };
}

/**
 * CategorySelector
 * Selettore a due livelli (Macro-categoria -> Sottocategoria) collegato alla tabella
 * `public.categorie_sito` su Supabase.
 *
 * @param {object} props
 * @param {(categoria: { id: string, nome: string, slug: string, macro_gruppo: string } | null) => void} props.onCategorySelect
 * @param {{ id?: string, nome?: string, slug?: string, macro_gruppo?: string } | null} [props.value]
 * @param {"form" | "filter"} [props.variant="form"]
 * @param {string} [props.className=""]
 * @param {import("@supabase/supabase-js").SupabaseClient} [props.supabaseClient]
 */
export function CategorySelector({
  onCategorySelect,
  value = null,
  variant = "form",
  className = "",
  supabaseClient = defaultSupabase,
}) {
  const uniqueId = useId();
  const macroSelectId = `${uniqueId}-macro`;
  const subSelectId = `${uniqueId}-sub`;

  // Stato delle categorie scaricate da Supabase
  const [macroCategorie, setMacroCategorie] = useState(() =>
    Array.isArray(categorieCache?.macro) ? categorieCache.macro : []
  );
  const [tutteSottocategorie, setTutteSottocategorie] = useState(() =>
    Array.isArray(categorieCache?.sub) ? categorieCache.sub : []
  );

  // Stato selezioni correnti (usa gli slug univoci con suffisso di `public.categorie_sito`)
  const [selectedMacroSlug, setSelectedMacroSlug] = useState("");
  const [selectedSubSlug, setSelectedSubSlug] = useState("");
  const skipNextNullSyncRef = useRef(false);

  // Stati UX: caricamento ed errore
  const [loading, setLoading] = useState(() => !categorieCache);
  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * 1. Fetch iniziale da `public.categorie_sito`:
   *    - Carica macro-categorie (livello = 1, attiva = true) ordinate alfabeticamente.
   *    - Carica in parallelo le sottocategorie attive (livello = 2, attiva = true)
   *      con slug univoco con suffisso per il filtro a cascata istantaneo.
   */
  const caricaCategorie = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh && categorieCache && supabaseClient === defaultSupabase) {
        setMacroCategorie(
          Array.isArray(categorieCache.macro) ? categorieCache.macro : []
        );
        setTutteSottocategorie(
          Array.isArray(categorieCache.sub) ? categorieCache.sub : []
        );
        setLoading(false);
        return;
      }

      if (!supabaseClient) {
        console.error(
          "[Supabase][CategorySelector] Client Supabase non configurato: impossibile leggere public.categorie_sito.",
          { supabaseConfigError }
        );
        setErrorMessage(
          supabaseConfigError || "Connessione Supabase non configurata."
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const [macroRes, subRes] = await Promise.all([
          supabaseClient
            .from(CATEGORIES_TABLE_NAME)
            .select("id, nome, slug, macro_gruppo, livello, attiva")
            .eq("livello", 1)
            .eq("attiva", true)
            .order("nome", { ascending: true }),
          supabaseClient
            .from(CATEGORIES_TABLE_NAME)
            .select("id, nome, slug, macro_gruppo, livello, attiva")
            .eq("livello", 2)
            .eq("attiva", true)
            .order("nome", { ascending: true }),
        ]);

        if (macroRes.error) {
          logSupabaseError(
            "CategorySelector:macro(livello=1)",
            CATEGORIES_TABLE_NAME,
            macroRes.error
          );
          throw macroRes.error;
        }
        if (subRes.error) {
          logSupabaseError(
            "CategorySelector:sub(livello=2)",
            CATEGORIES_TABLE_NAME,
            subRes.error
          );
          throw subRes.error;
        }

        const macroData = Array.isArray(macroRes.data)
          ? macroRes.data.filter((item) => item && item.slug && item.nome)
          : [];
        const subData = Array.isArray(subRes.data)
          ? subRes.data.filter((item) => item && item.slug && item.nome)
          : [];

        if (macroData.length === 0) {
          console.warn(
            `[Supabase][CategorySelector] Nessuna macro-categoria restituita da "public.${CATEGORIES_TABLE_NAME}" (livello=1, attiva=true). Verifica RLS o dati in tabella.`
          );
        }

        if (supabaseClient === defaultSupabase && macroData.length > 0) {
          categorieCache = { macro: macroData, sub: subData };
        }

        setMacroCategorie(macroData);
        setTutteSottocategorie(subData);
      } catch (err) {
        logSupabaseError(
          "CategorySelector:caricaCategorie",
          CATEGORIES_TABLE_NAME,
          err
        );
        const messaggio =
          err instanceof Error
            ? err.message
            : "Errore di connessione durante il caricamento delle categorie.";
        setErrorMessage(messaggio);
      } finally {
        setLoading(false);
      }
    },
    [supabaseClient]
  );

  useEffect(() => {
    caricaCategorie(false);
  }, [caricaCategorie]);

  // Sincronizza eventuale valore controllato esterno privilegiando gli slug univoci con suffisso
  useEffect(() => {
    if (!value) {
      if (skipNextNullSyncRef.current) {
        skipNextNullSyncRef.current = false;
        return;
      }
      setSelectedMacroSlug("");
      setSelectedSubSlug("");
      return;
    }

    skipNextNullSyncRef.current = false;

    const safeMacro = Array.isArray(macroCategorie) ? macroCategorie : [];
    const safeSub = Array.isArray(tutteSottocategorie) ? tutteSottocategorie : [];

    // 1. Tenta il match diretto per slug univoco (o id) tra le sottocategorie di livello 2
    const matchedSub = safeSub.find(
      (s) =>
        (value.slug && s.slug === value.slug) ||
        (value.id && s.id === value.id)
    );
    if (matchedSub) {
      const targetMacroNorm = normalizzaTestoCategoria(matchedSub.macro_gruppo);
      const parentMacro = safeMacro.find(
        (m) => normalizzaTestoCategoria(m.nome) === targetMacroNorm
      );
      setSelectedMacroSlug(parentMacro ? parentMacro.slug : "");
      setSelectedSubSlug(matchedSub.slug);
      return;
    }

    // 2. Tenta il match diretto per slug univoco (o id / nome) tra le macro-categorie di livello 1
    const matchedMacro = safeMacro.find(
      (m) =>
        (value.slug && m.slug === value.slug) ||
        (value.id && m.id === value.id) ||
        (value.nome &&
          normalizzaTestoCategoria(m.nome) === normalizzaTestoCategoria(value.nome))
    );
    if (matchedMacro) {
      setSelectedMacroSlug(matchedMacro.slug);
      setSelectedSubSlug(variant === "filter" ? "" : matchedMacro.slug);
      return;
    }

    // 3. Fallback sul macro_gruppo se passato esternamente senza slug ancora risolto
    if (value.macro_gruppo && value.macro_gruppo !== "Principale") {
      const targetNorm = normalizzaTestoCategoria(value.macro_gruppo);
      const parentMacro = safeMacro.find(
        (m) => normalizzaTestoCategoria(m.nome) === targetNorm
      );
      if (parentMacro) {
        setSelectedMacroSlug(parentMacro.slug);
      }
      setSelectedSubSlug(value.slug || "");
    }
  }, [value, macroCategorie, tutteSottocategorie, variant]);

  // Macro-categoria attualmente selezionata (risolta per slug univoco)
  const macroSelezionata = useMemo(() => {
    const safeMacro = Array.isArray(macroCategorie) ? macroCategorie : [];
    return safeMacro.find((m) => m.slug === selectedMacroSlug) || null;
  }, [macroCategorie, selectedMacroSlug]);

  // 2. Comportamento a cascata:
  //    Filtra localmente le sottocategorie di livello = 2 con `macro_gruppo`
  //    corrispondente al nome della macro-categoria scelta.
  const sottocategorieFiltrate = useMemo(() => {
    if (!macroSelezionata) return [];
    const safeSub = Array.isArray(tutteSottocategorie) ? tutteSottocategorie : [];
    const targetNorm = normalizzaTestoCategoria(macroSelezionata.nome);
    return safeSub.filter(
      (sub) => normalizzaTestoCategoria(sub.macro_gruppo) === targetNorm
    );
  }, [macroSelezionata, tutteSottocategorie]);

  // Handler cambio Macro-categoria (Livello 1)
  const handleMacroChange = (e) => {
    const nextMacroSlug = e.target.value;
    setSelectedMacroSlug(nextMacroSlug);
    setSelectedSubSlug("");

    if (!nextMacroSlug) {
      onCategorySelect?.(null);
      return;
    }

    // In modalità filtro barra di ricerca notifica subito la macro-categoria selezionata;
    // nel form di inserimento attende la selezione della sottocategoria.
    if (variant === "filter") {
      const safeMacro = Array.isArray(macroCategorie) ? macroCategorie : [];
      const macroObj = safeMacro.find((m) => m.slug === nextMacroSlug);
      if (macroObj) {
        onCategorySelect?.({
          id: macroObj.id,
          nome: macroObj.nome,
          slug: macroObj.slug,
          macro_gruppo: macroObj.macro_gruppo,
          livello: 1,
        });
      }
    } else {
      skipNextNullSyncRef.current = true;
      onCategorySelect?.(null);
    }
  };

  // Handler cambio Sottocategoria (Livello 2 tramite slug univoco con suffisso)
  const handleSubChange = (e) => {
    const nextSlug = e.target.value;
    setSelectedSubSlug(nextSlug);

    if (!nextSlug) {
      if (variant === "filter" && macroSelezionata) {
        onCategorySelect?.({
          id: macroSelezionata.id,
          nome: macroSelezionata.nome,
          slug: macroSelezionata.slug,
          macro_gruppo: macroSelezionata.macro_gruppo,
          livello: 1,
        });
      } else {
        skipNextNullSyncRef.current = true;
        onCategorySelect?.(null);
      }
      return;
    }

    // Se la macro-categoria non ha sottocategorie di livello 2, consente comunque
    // di confermare la macro-categoria stessa come categoria finale
    if (macroSelezionata && nextSlug === macroSelezionata.slug) {
      onCategorySelect?.({
        id: macroSelezionata.id,
        nome: macroSelezionata.nome,
        slug: macroSelezionata.slug,
        macro_gruppo: macroSelezionata.macro_gruppo,
        livello: 1,
      });
      return;
    }

    const subObj = sottocategorieFiltrate.find((s) => s.slug === nextSlug);
    if (subObj) {
      onCategorySelect?.({
        id: subObj.id,
        nome: subObj.nome,
        slug: subObj.slug,
        macro_gruppo: subObj.macro_gruppo,
        livello: 2,
      });
    }
  };

  // Stato di caricamento iniziale (Skeleton / Spinner discreto)
  if (loading) {
    return (
      <div
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${className}`}
        aria-busy="true"
        aria-label="Caricamento categorie in corso"
      >
        <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#1E3A8A]" />
          <span className="truncate">Caricamento macro-categorie...</span>
        </div>
        <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-400">
          <span className="truncate">Sottocategoria</span>
        </div>
      </div>
    );
  }

  // Stato di errore connessione Supabase non bloccante
  if (errorMessage) {
    return (
      <div
        role="alert"
        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-xs text-red-700 ${className}`}
      >
        <span className="inline-flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>Impossibile caricare le categorie: {errorMessage}</span>
        </span>
        <button
          type="button"
          onClick={() => caricaCategorie(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1 font-semibold text-red-700 transition-colors hover:bg-red-50 cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          Riprova
        </button>
      </div>
    );
  }

  const isFilter = variant === "filter";
  const selectHeight = "h-10";
  const safeMacroList = Array.isArray(macroCategorie) ? macroCategorie : [];

  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${className}`}>
      {/* Primo selettore: Macro-categorie (livello = 1) identificate da slug univoco */}
      <div>
        {!isFilter && (
          <label
            htmlFor={macroSelectId}
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Macro-categoria *
          </label>
        )}
        <div className="relative">
          <select
            id={macroSelectId}
            aria-label="Macro-categoria"
            value={selectedMacroSlug}
            onChange={handleMacroChange}
            className={`${selectHeight} w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-9 text-sm text-slate-900 transition-colors duration-150 hover:border-slate-300 focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25 cursor-pointer`}
          >
            <option value="">
              {isFilter ? "Tutte le macro-categorie" : "Seleziona macro-categoria..."}
            </option>
            {safeMacroList.map((macro) => (
              <option key={macro.slug} value={macro.slug}>
                {macro.nome}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Secondo selettore: Sottocategorie (livello = 2) con slug univoco con suffisso */}
      <div>
        {!isFilter && (
          <label
            htmlFor={subSelectId}
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Sottocategoria *
          </label>
        )}
        <div className="relative">
          <select
            id={subSelectId}
            aria-label="Sottocategoria"
            value={selectedSubSlug}
            disabled={!selectedMacroSlug}
            onChange={handleSubChange}
            className={`${selectHeight} w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-9 text-sm text-slate-900 transition-colors duration-150 hover:border-slate-300 focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer`}
          >
            <option value="">
              {!selectedMacroSlug
                ? "Sottocategoria (scegli macro)"
                : sottocategorieFiltrate.length > 0
                  ? isFilter
                    ? "Tutte le sottocategorie"
                    : "Seleziona sottocategoria..."
                  : "Seleziona categoria principale..."}
            </option>

            {sottocategorieFiltrate.map((sub) => (
              <option key={sub.slug} value={sub.slug}>
                {sub.nome}
              </option>
            ))}

            {/* Fallback pulito se la macro-categoria non ha ancora sottocategorie in tabella */}
            {selectedMacroSlug &&
              sottocategorieFiltrate.length === 0 &&
              macroSelezionata && (
                <option value={macroSelezionata.slug}>
                  {macroSelezionata.nome} (Categoria principale)
                </option>
              )}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
    </div>
  );
}

export default CategorySelector;
