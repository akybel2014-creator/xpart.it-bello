import {
  ArrowRight,
  Car,
  Cog,
  Compass,
  Disc,
  Gauge,
  Layers,
  Lightbulb,
  Loader2,
  PackagePlus,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CATEGORIES_TABLE_NAME,
  logSupabaseError,
  supabase as defaultSupabase,
} from "@/src/lib/supabaseClient";

/**
 * Fallback sobrio per le macro-categorie nel caso in cui `public.categorie_sito`
 * non sia ancora raggiungibile nell'ambiente locale.
 */
const FALLBACK_MACRO_CATEGORIE = [
  { id: "cat-motore", nome: "Motore e Alimentazione", slug: "motore", macro_gruppo: "Principale" },
  { id: "cat-freni", nome: "Impianto Frenante", slug: "freni", macro_gruppo: "Principale" },
  { id: "cat-cambio", nome: "Cambio e Trasmissione", slug: "cambio", macro_gruppo: "Principale" },
  { id: "cat-illuminazione", nome: "Illuminazione e Fari", slug: "illuminazione", macro_gruppo: "Principale" },
  { id: "cat-sospensioni", nome: "Sospensioni e Ammortizzatori", slug: "sospensioni", macro_gruppo: "Principale" },
  { id: "cat-sterzo", nome: "Sterzo e Avantreno", slug: "sterzo", macro_gruppo: "Principale" },
  { id: "cat-elettronica", nome: "Impianto Elettrico e Centraline", slug: "impianto-elettrico", macro_gruppo: "Principale" },
  { id: "cat-carrozzeria", nome: "Carrozzeria e Lamierati", slug: "carrozzeria", macro_gruppo: "Principale" },
];

/**
 * Seleziona un'icona tecnica coerente in base al nome o allo slug della macro-categoria.
 */
function getCategoryIcon(slug = "", nome = "") {
  const key = `${slug} ${nome}`.toLowerCase();
  if (key.includes("fren") || key.includes("disc")) return Disc;
  if (
    key.includes("motor") ||
    key.includes("turbo") ||
    key.includes("sovraliment") ||
    key.includes("alimentaz") ||
    key.includes("carburant")
  )
    return Cog;
  if (key.includes("illumin") || key.includes("far") || key.includes("ottic"))
    return Lightbulb;
  if (
    key.includes("elettr") ||
    key.includes("sensor") ||
    key.includes("centralin") ||
    key.includes("accension")
  )
    return Zap;
  if (key.includes("sospens") || key.includes("ammort") || key.includes("sterz"))
    return Compass;
  if (
    key.includes("cambio") ||
    key.includes("trasmiss") ||
    key.includes("frizion") ||
    key.includes("scaric")
  )
    return Gauge;
  if (key.includes("carroz") || key.includes("portier") || key.includes("paraurt"))
    return Car;
  if (
    key.includes("pneumat") ||
    key.includes("cerch") ||
    key.includes("climat") ||
    key.includes("riscald") ||
    key.includes("raffredd")
  )
    return Layers;
  return Wrench;
}

/**
 * Formatta un prezzo in Euro in stile italiano pulito.
 */
function formatPrice(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "Su richiesta";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Estrae i campi principali da una riga della tabella Supabase `public.parts`
 * supportando eventuali varianti di naming colonne (es. `titolo`/`title`, `prezzo`/`prezzo_demolitore`).
 */
function mapSupabasePartRow(row) {
  const categoryLabel = row.categoria
    ? String(row.categoria).charAt(0).toUpperCase() + String(row.categoria).slice(1)
    : "";
  const brand = row.marca ?? row.brand ?? "";
  const model = row.modello ?? row.model ?? "";
  const cleanModelShort = String(model).split("(")[0].trim();

  const generatedTitle = [categoryLabel || "Ricambio OEM", brand, cleanModelShort]
    .filter(Boolean)
    .join(" ");

  const title = row.titolo ?? row.title ?? row.nome ?? generatedTitle;
  const oemCode = row.codice_oe ?? row.codice_oem ?? row.oem_code ?? "";
  const engine = row.versione_motore ?? row.motorizzazione ?? row.motore ?? "";
  const year = row.anno ?? row.anno_inizio ?? "";
  const condition = row.condizione ?? row.stato_pezzo ?? "Usato OEM";
  const price =
    row.prezzo_pubblico ?? row.prezzo ?? row.prezzo_demolitore ?? row.price_net ?? null;
  const image =
    (Array.isArray(row.foto_urls) && row.foto_urls[0]) ||
    row.foto_url ||
    row.immagine_url ||
    row.image_url ||
    (Array.isArray(row.immagini) && row.immagini[0]) ||
    null;
  const city = row.citta ?? row.localita ?? "";

  const vehicleSummary = [brand, model, engine || (year ? String(year) : "")]
    .filter(Boolean)
    .join(" · ");

  return {
    id: row.id,
    title,
    oemCode,
    vehicleSummary: vehicleSummary || "Compatibilità verificabile via OEM",
    condition,
    price,
    image,
    city,
    raw: row,
  };
}

/**
 * HomePage
 * Layout e-commerce automotive B2B a tutta larghezza (senza sidebar filtri):
 * 1. Hero con barra di ricerca multi-veicolo / OEM / Pneumatici (passata come `heroSection`)
 * 2. Eventuali risultati live OEM (passati come `oemResultsSection`)
 * 3. Griglia Macro-Categorie Popolari da `public.categorie_sito` (3/4 colonne, max-w-7xl)
 * 4. Griglia "Ultimi Ricambi Aggiunti" da `public.parts` (4 per riga, con stato vuoto pulito)
 */
export function HomePage({
  heroSection,
  oemResultsSection,
  onSelectCategoryCard,
  onOpenSellModal,
  supabaseClient = defaultSupabase,
}) {
  // Stato Macro-Categorie Popolari (`public.categorie_sito`)
  const [macroCategories, setMacroCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Stato Ultimi 8 Ricambi (`public.parts`)
  const [latestParts, setLatestParts] = useState([]);
  const [loadingParts, setLoadingParts] = useState(true);

  // 1. Carica le prime 8 macro-categorie attive da Supabase `public.categorie_sito`
  useEffect(() => {
    let cancelled = false;

    async function fetchMacroCategories() {
      setLoadingCategories(true);
      try {
        if (!supabaseClient) {
          console.warn(
            "[Supabase][HomePage] Client Supabase non configurato: uso categorie locali di fallback."
          );
          if (!cancelled) setMacroCategories(FALLBACK_MACRO_CATEGORIE);
          return;
        }

        const { data, error } = await supabaseClient
          .from(CATEGORIES_TABLE_NAME)
          .select("id, nome, slug, macro_gruppo, livello, attiva")
          .eq("livello", 1)
          .eq("attiva", true)
          .order("nome", { ascending: true })
          .limit(12);

        if (error) {
          logSupabaseError("HomePage:macroCategories", CATEGORIES_TABLE_NAME, error);
          if (!cancelled) setMacroCategories(FALLBACK_MACRO_CATEGORIE);
          return;
        }

        const validCategories = Array.isArray(data)
          ? data.filter((cat) => cat && cat.slug && cat.nome)
          : [];

        if (validCategories.length > 0) {
          if (!cancelled) setMacroCategories(validCategories);
          return;
        }

        console.warn(
          `[Supabase][HomePage] Nessuna categoria restituita da "public.${CATEGORIES_TABLE_NAME}" (livello=1, attiva=true). Verifica RLS o dati in tabella.`
        );
        if (!cancelled) setMacroCategories(FALLBACK_MACRO_CATEGORIE);
      } catch (err) {
        logSupabaseError("HomePage:macroCategories", CATEGORIES_TABLE_NAME, err);
        if (!cancelled) setMacroCategories(FALLBACK_MACRO_CATEGORIE);
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    }

    fetchMacroCategories();
    return () => {
      cancelled = true;
    };
  }, [supabaseClient]);

  // 2. Carica gli ultimi 8 ricambi inseriti dalla tabella Supabase `public.parts`
  useEffect(() => {
    let cancelled = false;

    async function fetchLatestParts() {
      if (!supabaseClient) {
        console.warn(
          "[Supabase][HomePage] Client Supabase non configurato: impossibile caricare public.parts."
        );
        setLatestParts([]);
        setLoadingParts(false);
        return;
      }

      setLoadingParts(true);
      try {
        const { data, error } = await supabaseClient
          .from("parts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(8);

        if (error) {
          logSupabaseError("HomePage:latestParts", "parts", error);
          // Se la tabella non ha `created_at` o restituisce errore di ordinamento, ritenta senza order
          const fallbackRes = await supabaseClient
            .from("parts")
            .select("*")
            .limit(8);

          if (fallbackRes.error) {
            logSupabaseError("HomePage:latestParts(fallback)", "parts", fallbackRes.error);
          }

          if (!cancelled) {
            setLatestParts(
              !fallbackRes.error && Array.isArray(fallbackRes.data)
                ? fallbackRes.data.map(mapSupabasePartRow)
                : []
            );
          }
          return;
        }

        if (!cancelled) {
          setLatestParts(
            Array.isArray(data) ? data.map(mapSupabasePartRow) : []
          );
        }
      } catch (err) {
        logSupabaseError("HomePage:latestParts", "parts", err);
        if (!cancelled) setLatestParts([]);
      } finally {
        if (!cancelled) setLoadingParts(false);
      }
    }

    fetchLatestParts();
    return () => {
      cancelled = true;
    };
  }, [supabaseClient]);

  return (
    <div className="bg-[#F9FAFB]">
      {/* Hero + Barra di Ricerca Veicoli / OEM / Pneumatici */}
      {heroSection}

      {/* Risultati live Catalogo Codici OEM (visibile solo quando si cerca un codice OEM) */}
      {oemResultsSection}

      {/* SEZIONE 1: Griglia Macro-Categorie Popolari a tutta larghezza */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1E3A8A]">
              Esplora per impianto
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
              Macro-Categorie Popolari
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Seleziona una categoria per accedere direttamente ai ricambi compatibili nel catalogo.
            </p>
          </div>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E3A8A] hover:underline"
          >
            Vedi tutto il catalogo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loadingCategories ? (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={`cat-skel-${idx}`}
                className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {macroCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.slug, cat.nome);
              return (
                <button
                  key={cat.slug || cat.id}
                  type="button"
                  onClick={() => onSelectCategoryCard?.(cat)}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition-all duration-150 hover:border-[#1E3A8A]/45 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/40 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-[#F9FAFB] text-[#1E3A8A] transition-colors group-hover:border-[#1E3A8A]/25 group-hover:bg-[#1E3A8A] group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#1E3A8A]" />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-display text-sm font-semibold text-slate-900 group-hover:text-[#1E3A8A] transition-colors">
                      {cat.nome}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Sfoglia ricambi certificati
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* SEZIONE 2: Ultimi Ricambi Aggiunti da Supabase `public.parts` (4 per riga) */}
      <section className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1E3A8A]">
                Arrivi recenti dai centri verificati
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
                Ultimi Ricambi Aggiunti
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Gli annunci più recenti caricati direttamente dagli autodemolitori e ricambisti partner.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E3A8A] hover:underline"
            >
              Apri ricerca avanzata
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingParts ? (
            <div className="mt-6 flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-[#F9FAFB] py-14 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#1E3A8A]" />
              <span>Caricamento ultimi ricambi dal database...</span>
            </div>
          ) : latestParts.length === 0 ? (
            /* Stato vuoto pulito richiesto quando la tabella `parts` non ha ancora annunci */
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-[#F9FAFB] px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#1E3A8A] shadow-xs">
                <PackagePlus className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                Nessun annuncio ancora pubblicato - Diventa il primo venditore
              </h3>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-500">
                Gestisci un centro di autodemolizione o un magazzino ricambi? Carica subito
                i tuoi pezzi con codice OEM per raggiungere officine e professionisti in
                tutta Italia.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/pannello-fornitore"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1E3A8A]/92"
                >
                  Apri Pannello Fornitore
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {onOpenSellModal && (
                  <button
                    type="button"
                    onClick={onOpenSellModal}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                  >
                    Pubblica annuncio rapido
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Griglia 4 schede prodotto per riga su desktop */
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {latestParts.map((item) => {
                const isNew = String(item.condition).toLowerCase().includes("nuov");
                return (
                  <article
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-150 hover:border-[#1E3A8A]/40 hover:shadow-sm"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <Wrench className="h-10 w-10" />
                        </div>
                      )}
                      <span
                        className={`absolute left-3 top-3 rounded-md border px-2 py-0.5 text-[11px] font-semibold backdrop-blur-xs ${
                          isNew
                            ? "border-[#16A34A]/30 bg-white/95 text-[#15803D]"
                            : "border-slate-200 bg-white/95 text-slate-800"
                        }`}
                      >
                        {item.condition}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        {item.oemCode && (
                          <p className="font-mono text-[11px] font-medium text-[#1E3A8A]">
                            OEM {item.oemCode}
                          </p>
                        )}
                        <h3 className="mt-1 line-clamp-2 font-display text-sm font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-1 text-xs text-slate-500">
                          {item.vehicleSummary}
                        </p>
                      </div>

                      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
                        <div>
                          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                            Prezzo netto
                          </span>
                          <span className="font-display text-base font-bold tabular-nums text-[#1E3A8A]">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        <Link
                          to="/catalogo"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-[#F9FAFB] px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#1E3A8A]/40 hover:text-[#1E3A8A]"
                        >
                          Dettagli
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Fascia di fiducia B2B compatta a fine homepage */}
          <div className="mt-10 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-[#F9FAFB] p-5 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#16A34A]" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Ricambi verificati con garanzia
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Ispezione al banco, grado d&apos;uso certificato e reso garantito entro 14 giorni.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Cog className="mt-0.5 h-5 w-5 shrink-0 text-[#1E3A8A]" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Matching OEM e Cross-Reference
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Ricerca flessibile per codice originale ed equivalenti senza errori di formattazione.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Car className="mt-0.5 h-5 w-5 shrink-0 text-[#1E3A8A]" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Auto, Moto e Veicoli Industriali
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Un unico portale B2B con fatturazione elettronica immediata e consegna 24/48h.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
