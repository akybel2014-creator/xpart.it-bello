import {
  AlertCircle,
  Check,
  Copy,
  Database,
  Loader2,
  RefreshCw,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  normalizeOemCode,
  parseCrossReferences,
  parseOemAttributes,
  type OemCatalogSearchItem,
  type OemMatchType,
} from "@/src/services/oemCatalogService";

interface OemCatalogResultsProps {
  results: OemCatalogSearchItem[];
  totalCount: number;
  normalizedQuery: string;
  selectedBrand: string;
  isLoading: boolean;
  hasSearched: boolean;
  error: string | null;
  /** Callback invocata quando l'utente clicca un codice equivalente (cross_reference) */
  onSelectCrossReference: (code: string) => void;
  /** Callback per rimuovere il filtro marca e ripetere la ricerca su tutte le marche */
  onClearBrandFilter: () => void;
  /** Callback per ripetere la ricerca in caso di errore di rete */
  onRetry: () => void;
  /** Callback per chiudere/svuotare la ricerca OEM corrente */
  onClearQuery: () => void;
}

const MATCH_BADGE_MAP: Record<
  OemMatchType,
  { label: string; className: string }
> = {
  "exact-oem": {
    label: "Corrispondenza OEM esatta",
    className: "border-[#16A34A]/25 bg-[#16A34A]/10 text-[#15803D]",
  },
  "exact-cross": {
    label: "Corrispondenza equivalente esatta",
    className: "border-[#1E3A8A]/25 bg-[#1E3A8A]/10 text-[#1E3A8A]",
  },
  "partial-oem": {
    label: "Corrispondenza su codice OEM",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  "partial-cross": {
    label: "Corrispondenza su codice equivalente",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

/**
 * Pannello risultati collegato a `public.codici_oem_catalogo` su Supabase.
 * Mostra codice OEM, marca, modello, lato montaggio, dettagli tecnici e codici equivalenti
 * mantenendo lo stile sobrio B2B (blu navy #1E3A8A e grigi neutri).
 */
export function OemCatalogResults({
  results,
  totalCount,
  normalizedQuery,
  selectedBrand,
  isLoading,
  hasSearched,
  error,
  onSelectCrossReference,
  onClearBrandFilter,
  onRetry,
  onClearQuery,
}: OemCatalogResultsProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const isBrandFiltered = Boolean(selectedBrand && selectedBrand !== "all");

  // Non renderizza il pannello finché non c'è una ricerca attiva
  if (!normalizedQuery || (!isLoading && !hasSearched && !error)) {
    return null;
  }

  const handleCopyOem = async (id: number, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast.success(`Codice OEM ${code} copiato negli appunti.`);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1800);
    } catch {
      toast.info(`Codice OEM: ${code}`);
    }
  };

  return (
    <section
      id="risultati-catalogo-oem"
      aria-live="polite"
      className="border-b border-slate-200/80 bg-[#F9FAFB]"
    >
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
          {/* Intestazione sezione risultati OEM */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3.5 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A]">
                <Database className="h-4 w-4" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-base font-semibold tracking-tight text-slate-900">
                    Risultati Catalogo Codici OEM
                  </h2>
                  <span className="rounded-md border border-[#1E3A8A]/20 bg-[#1E3A8A]/5 px-2 py-0.5 font-mono text-xs font-semibold text-[#1E3A8A]">
                    {normalizedQuery}
                  </span>
                  {isBrandFiltered && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                      <SlidersHorizontal className="h-3 w-3 text-slate-400" />
                      Marca: {selectedBrand}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                  {isLoading
                    ? "Ricerca su codici OEM e codici equivalenti in corso..."
                    : error
                      ? "Impossibile completare l'interrogazione del catalogo OEM"
                      : totalCount === 0
                        ? "0 corrispondenze trovate"
                        : totalCount > results.length
                          ? `Visualizzati ${results.length} di ${totalCount} codici OEM trovati`
                          : `${totalCount} ${
                              totalCount === 1
                                ? "codice OEM trovato"
                                : "codici OEM trovati"
                            }`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isBrandFiltered && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClearBrandFilter}
                  className="h-8 text-xs text-slate-700"
                >
                  Cerca su tutte le marche
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearQuery}
                className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900"
              >
                <X className="h-3.5 w-3.5" />
                Chiudi
              </Button>
            </div>
          </div>

          {/* Corpo risultati: Caricamento / Errore / Vuoto / Lista risultati */}
          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2.5 py-8 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-[#1E3A8A]" />
                <span>
                  Verifica codice <strong className="font-mono">{normalizedQuery}</strong>{" "}
                  nel catalogo OEM...
                </span>
              </div>
            ) : error ? (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700"
              >
                <span className="inline-flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-8 border-red-200 bg-white text-xs text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Riprova
                </Button>
              </div>
            ) : results.length === 0 ? (
              /* Messaggio pulito quando nessun codice OEM corrisponde */
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-[#F9FAFB] px-6 py-9 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
                  <SearchX className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-display text-sm font-semibold text-slate-900">
                  Nessun codice OEM trovato per questo codice
                </h3>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                  Nessuna corrispondenza per{" "}
                  <span className="font-mono font-semibold text-slate-700">
                    {normalizedQuery}
                  </span>
                  {isBrandFiltered ? ` nella marca ${selectedBrand}` : ""} né tra i codici
                  OEM principali né nei codici equivalenti.
                </p>
                {isBrandFiltered && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClearBrandFilter}
                    className="mt-4 h-8 bg-white text-xs"
                  >
                    Rimuovi filtro marca ({selectedBrand})
                  </Button>
                )}
              </div>
            ) : (
              /* Griglia schede risultati OEM */
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {results.map((item) => {
                  const oemDisplay = item.oem_code?.trim() || "—";
                  const brandDisplay = item.car_brand?.trim() || "Marca non specificata";
                  const modelDisplay = item.car_model?.trim() || null;
                  const fittingSide = item.fitting_side?.trim() || null;
                  const attributeEntries = parseOemAttributes(item.attributes);
                  const crossRefs = parseCrossReferences(item.cross_reference);
                  const matchMeta = MATCH_BADGE_MAP[item.matchType];

                  return (
                    <article
                      key={item.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors duration-150 hover:border-[#1E3A8A]/40"
                    >
                      <div>
                        {/* Riga superiore: Codice OEM + Pulsante copia + Stato match */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                              Codice OEM
                            </span>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="font-mono text-base font-semibold tracking-tight text-[#1E3A8A] break-all">
                                {oemDisplay}
                              </span>
                              {item.oem_code && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyOem(item.id, oemDisplay)}
                                  title="Copia codice OEM"
                                  className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-[#F9FAFB] px-2 text-[11px] font-medium text-slate-600 transition-colors hover:border-[#1E3A8A]/30 hover:text-[#1E3A8A] cursor-pointer"
                                >
                                  {copiedId === item.id ? (
                                    <>
                                      <Check className="h-3 w-3 text-[#16A34A]" />
                                      <span className="text-[#16A34A]">Copiato</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Copia</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${matchMeta.className}`}
                          >
                            {matchMeta.label}
                          </span>
                        </div>

                        {/* Metadati veicolo e montaggio: Marca, Modello, Lato montaggio */}
                        <dl className="mt-3.5 grid grid-cols-1 gap-2.5 rounded-lg border border-slate-100 bg-[#F9FAFB] p-3 text-xs sm:grid-cols-3">
                          <div>
                            <dt className="text-[11px] font-medium text-slate-400">
                              Marca
                            </dt>
                            <dd className="mt-0.5 font-semibold text-slate-900">
                              {brandDisplay}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-[11px] font-medium text-slate-400">
                              Modello
                            </dt>
                            <dd className="mt-0.5 font-medium text-slate-800">
                              {modelDisplay ?? (
                                <span className="text-slate-400">Non specificato</span>
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-[11px] font-medium text-slate-400">
                              Lato montaggio
                            </dt>
                            <dd className="mt-0.5 font-medium text-slate-800">
                              {fittingSide ?? (
                                <span className="text-slate-400">Non specificato</span>
                              )}
                            </dd>
                          </div>
                        </dl>

                        {/* Dettagli / Attributi tecnici */}
                        {attributeEntries.length > 0 && (
                          <div className="mt-3">
                            <span className="block text-[11px] font-medium text-slate-400">
                              Dettagli e specifiche tecniche
                            </span>
                            {attributeEntries.length === 1 ? (
                              <p className="mt-1 text-xs leading-relaxed text-slate-700">
                                {attributeEntries[0]}
                              </p>
                            ) : (
                              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                                {attributeEntries.map((attr, idx) => (
                                  <li
                                    key={`${item.id}-attr-${idx}`}
                                    className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                                  >
                                    {attr}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Codici equivalenti (Cross-reference) cliccabili */}
                      {crossRefs.length > 0 && (
                        <div className="mt-3.5 border-t border-slate-100 pt-3">
                          <span className="block text-[11px] font-medium text-slate-400">
                            Codici equivalenti (Cross-reference)
                          </span>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {crossRefs.map((refCode, idx) => {
                              const isHighlighted = normalizeOemCode(refCode).includes(
                                normalizedQuery
                              );
                              return (
                                <button
                                  key={`${item.id}-ref-${idx}`}
                                  type="button"
                                  onClick={() => onSelectCrossReference(refCode)}
                                  title={`Cerca il codice equivalente ${refCode}`}
                                  className={`rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors cursor-pointer ${
                                    isHighlighted
                                      ? "border-[#1E3A8A]/35 bg-[#1E3A8A]/10 font-semibold text-[#1E3A8A]"
                                      : "border-slate-200 bg-white text-slate-700 hover:border-[#1E3A8A]/40 hover:text-[#1E3A8A]"
                                  }`}
                                >
                                  {refCode}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
