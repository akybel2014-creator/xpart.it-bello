import {
  AlertCircle,
  Check,
  Copy,
  Database,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  normalizeOemCode,
  parseCrossReferences,
  parseOemAttributes,
  type OemCatalogSearchItem,
  type OemMatchType,
} from "@/src/services/oemCatalogService";

export interface GroupedOemCatalogCard {
  /** Chiave univoca del gruppo (oem_code normalizzato + marca + modello) */
  groupKey: string;
  /** ID del primo record rappresentativo */
  primaryId: number;
  /** Codice OEM principale formattato */
  oemCode: string;
  /** Marca veicolo (se presente) */
  carBrand: string | null;
  /** Modello veicolo (se presente) */
  carModel: string | null;
  /** Lati di montaggio validi e deduplicati (vuoto se assente o 'Non specificato') */
  fittingSides: string[];
  /** Specifiche / attributi tecnici validi e deduplicati */
  attributes: string[];
  /** Tutti i codici equivalenti (cross_reference) accorpati e deduplicati */
  crossReferences: string[];
  /** Tipo di corrispondenza migliore tra i record accorpati */
  matchType: OemMatchType;
  /** Numero di righe del database accorpate in questa card */
  mergedRecordsCount: number;
}

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
  /** Azione primaria in fondo alla card: cerca ricambi compatibili nel catalogo */
  onFindCompatibleParts?: (card: GroupedOemCatalogCard) => void;
  /** Azione secondaria in fondo alla card: richiedi disponibilità / preventivo B2B */
  onRequestAvailability?: (card: GroupedOemCatalogCard) => void;
}

const MATCH_PRIORITY: Record<OemMatchType, number> = {
  "exact-oem": 0,
  "exact-cross": 1,
  "partial-oem": 2,
  "partial-cross": 3,
};

const MATCH_BADGE_MAP: Record<
  OemMatchType,
  { label: string; className: string }
> = {
  "exact-oem": {
    label: "OEM esatto",
    className: "border-[#16A34A]/25 bg-[#16A34A]/10 text-[#15803D]",
  },
  "exact-cross": {
    label: "Equivalente esatto",
    className: "border-[#1E3A8A]/25 bg-[#1E3A8A]/10 text-[#1E3A8A]",
  },
  "partial-oem": {
    label: "Match codice OEM",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  "partial-cross": {
    label: "Match equivalente",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

/**
 * Verifica se un campo opzionale contiene un valore informativo reale,
 * escludendo null, stringhe vuote, trattini o segnaposto come "Non specificato".
 */
function isMeaningfulValue(value?: string | null): value is string {
  if (!value) return false;
  const cleaned = value.trim();
  if (!cleaned) return false;

  const lower = cleaned.toLowerCase();
  return ![
    "-",
    "—",
    "n/a",
    "n/d",
    "nd",
    "null",
    "none",
    "non specificato",
    "non disponibile",
    "sconosciuto",
  ].includes(lower);
}

/**
 * Accorpa le righe di `public.codici_oem_catalogo` che condividono lo stesso
 * codice OEM e lo stesso veicolo (`car_brand` + `car_model`), unendo in modo
 * pulito i codici `cross_reference`, i lati di montaggio e le specifiche tecniche
 * così da evitare card duplicate quasi identiche.
 */
export function groupOemCatalogResults(
  results: OemCatalogSearchItem[]
): GroupedOemCatalogCard[] {
  const groups = new Map<
    string,
    {
      card: GroupedOemCatalogCard;
      seenCrossKeys: Set<string>;
      seenSides: Set<string>;
      seenAttrs: Set<string>;
    }
  >();

  for (const item of results) {
    const rawOem = item.oem_code?.trim() || "";
    const normOem = normalizeOemCode(rawOem);
    const brand = isMeaningfulValue(item.car_brand) ? item.car_brand.trim() : null;
    const model = isMeaningfulValue(item.car_model) ? item.car_model.trim() : null;

    const groupKey = [
      normOem || `ID_${item.id}`,
      (brand ?? "").toUpperCase(),
      (model ?? "").toUpperCase(),
    ].join("__");

    let entry = groups.get(groupKey);
    if (!entry) {
      entry = {
        card: {
          groupKey,
          primaryId: item.id,
          oemCode: rawOem || "—",
          carBrand: brand,
          carModel: model,
          fittingSides: [],
          attributes: [],
          crossReferences: [],
          matchType: item.matchType,
          mergedRecordsCount: 0,
        },
        seenCrossKeys: new Set<string>(),
        seenSides: new Set<string>(),
        seenAttrs: new Set<string>(),
      };
      groups.set(groupKey, entry);
    }

    entry.card.mergedRecordsCount += 1;

    // Mantieni il grado di corrispondenza più alto nel gruppo
    if (MATCH_PRIORITY[item.matchType] < MATCH_PRIORITY[entry.card.matchType]) {
      entry.card.matchType = item.matchType;
    }

    // Accorpa lato di montaggio solo se valorizzato e significativo
    if (isMeaningfulValue(item.fitting_side)) {
      const sideClean = item.fitting_side.trim();
      const sideKey = sideClean.toLowerCase();
      if (!entry.seenSides.has(sideKey)) {
        entry.seenSides.add(sideKey);
        entry.card.fittingSides.push(sideClean);
      }
    }

    // Accorpa attributi / specifiche tecniche validi
    for (const attr of parseOemAttributes(item.attributes)) {
      if (!isMeaningfulValue(attr)) continue;
      const attrClean = attr.trim();
      const attrKey = attrClean.toLowerCase();
      if (!entry.seenAttrs.has(attrKey)) {
        entry.seenAttrs.add(attrKey);
        entry.card.attributes.push(attrClean);
      }
    }

    // Accorpa i codici cross_reference deduplicandoli (escludendo duplicati del codice OEM stesso)
    for (const refCode of parseCrossReferences(item.cross_reference)) {
      if (!isMeaningfulValue(refCode)) continue;
      const refClean = refCode.trim();
      const refNorm = normalizeOemCode(refClean) || refClean.toUpperCase();
      if (normOem && refNorm === normOem) continue;
      if (!entry.seenCrossKeys.has(refNorm)) {
        entry.seenCrossKeys.add(refNorm);
        entry.card.crossReferences.push(refClean);
      }
    }
  }

  return Array.from(groups.values())
    .map((entry) => entry.card)
    .sort((a, b) => {
      const pDiff = MATCH_PRIORITY[a.matchType] - MATCH_PRIORITY[b.matchType];
      if (pDiff !== 0) return pDiff;
      return (a.carBrand ?? "").localeCompare(b.carBrand ?? "", "it");
    });
}

/**
 * Pannello risultati collegato a `public.codici_oem_catalogo` su Supabase.
 * Accorpa i duplicati per OEM + veicolo, nasconde i blocchi vuoti/nulli senza buchi
 * visivi, mostra un'intestazione chiara sopra la griglia a 2 colonne e fornisce
 * azioni operative sobrie in fondo a ogni card.
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
  onFindCompatibleParts,
  onRequestAvailability,
}: OemCatalogResultsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isBrandFiltered = Boolean(selectedBrand && selectedBrand !== "all");

  // Deduplica e accorpa le righe con stesso codice OEM + Marca + Modello
  const groupedCards = useMemo(() => groupOemCatalogResults(results), [results]);

  // Non renderizza il pannello finché non c'è una ricerca attiva
  if (!normalizedQuery || (!isLoading && !hasSearched && !error)) {
    return null;
  }

  const handleCopyOem = async (key: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedKey(key);
      toast.success(`Codice OEM ${code} copiato negli appunti.`);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1800);
    } catch {
      toast.info(`Codice OEM: ${code}`);
    }
  };

  const handleFindPartsClick = (card: GroupedOemCatalogCard) => {
    if (onFindCompatibleParts) {
      onFindCompatibleParts(card);
      return;
    }
    onSelectCrossReference(card.oemCode);
  };

  const handleRequestAvailabilityClick = (card: GroupedOemCatalogCard) => {
    if (onRequestAvailability) {
      onRequestAvailability(card);
      return;
    }
    toast.success(
      `Richiesta disponibilità pronta per codice OEM ${card.oemCode}${
        card.carBrand ? ` (${card.carBrand})` : ""
      }.`
    );
  };

  const uniqueCount = groupedCards.length;
  const hasMergedDuplicates = results.length > uniqueCount;

  return (
    <section
      id="risultati-catalogo-oem"
      aria-live="polite"
      className="border-b border-slate-200/80 bg-[#F9FAFB]"
    >
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
          {/* Barra superiore del pannello: Titolo + Azioni rapide */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3.5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A]">
                <Database className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold tracking-tight text-slate-900">
                  Catalogo Codici OEM
                </h2>
                <p className="text-xs text-slate-500">
                  Corrispondenze verificate su codici originali e codici equivalenti
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

          {/* Corpo risultati */}
          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2.5 py-8 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-[#1E3A8A]" />
                <span>
                  Ricerca codice{" "}
                  <strong className="font-mono text-[#1E3A8A]">{normalizedQuery}</strong>{" "}
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
            ) : uniqueCount === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-[#F9FAFB] px-6 py-9 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
                  <SearchX className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-display text-sm font-semibold text-slate-900">
                  Nessun risultato trovato per{" "}
                  <span className="font-mono text-[#1E3A8A]">{normalizedQuery}</span>
                </h3>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                  Nessuna corrispondenza rilevata
                  {isBrandFiltered ? ` per la marca ${selectedBrand}` : ""} né tra i codici
                  OEM principali né tra i codici equivalenti.
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
              <>
                {/* 4. Intestazione chiara sopra la griglia a 2 colonne: codice cercato + conteggio */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-[#F9FAFB] px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                    <span>Risultati per codice:</span>
                    <span className="rounded-md border border-[#1E3A8A]/20 bg-white px-2 py-0.5 font-mono text-xs font-semibold text-[#1E3A8A]">
                      {normalizedQuery}
                    </span>
                    {isBrandFiltered && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                        <SlidersHorizontal className="h-3 w-3 text-slate-400" />
                        {selectedBrand}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 tabular-nums">
                    <span className="font-semibold text-slate-900">
                      {uniqueCount}{" "}
                      {uniqueCount === 1 ? "risultato trovato" : "risultati trovati"}
                    </span>
                    {(hasMergedDuplicates || totalCount > results.length) && (
                      <span className="text-slate-400">
                        ({totalCount > results.length ? `${totalCount} record in catalogo` : `accorpati da ${results.length} riferimenti`})
                      </span>
                    )}
                  </div>
                </div>

                {/* Griglia a 2 colonne delle card deduplicate */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {groupedCards.map((card) => {
                    const matchMeta = MATCH_BADGE_MAP[card.matchType];

                    // Costruisce dinamicamente solo i metadati realmente valorizzati (zero buchi visivi)
                    const vehicleMetaItems: { label: string; value: string; emphasis?: boolean }[] = [];
                    if (card.carBrand) {
                      vehicleMetaItems.push({
                        label: "Marca",
                        value: card.carBrand,
                        emphasis: true,
                      });
                    }
                    if (card.carModel) {
                      vehicleMetaItems.push({
                        label: "Modello",
                        value: card.carModel,
                      });
                    }
                    if (card.fittingSides.length > 0) {
                      vehicleMetaItems.push({
                        label: "Lato montaggio",
                        value: card.fittingSides.join(" · "),
                      });
                    }

                    const metaGridColsClass =
                      vehicleMetaItems.length >= 3
                        ? "sm:grid-cols-3"
                        : vehicleMetaItems.length === 2
                          ? "sm:grid-cols-2"
                          : "sm:grid-cols-1";

                    return (
                      <article
                        key={card.groupKey}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors duration-150 hover:border-[#1E3A8A]/40"
                      >
                        <div>
                          {/* Riga superiore: Codice OEM + Copia + Badge match */}
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                Codice OEM
                              </span>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <span className="font-mono text-base font-semibold tracking-tight text-[#1E3A8A] break-all">
                                  {card.oemCode}
                                </span>
                                {card.oemCode !== "—" && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyOem(card.groupKey, card.oemCode)}
                                    title="Copia codice OEM"
                                    className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-[#F9FAFB] px-2 text-[11px] font-medium text-slate-600 transition-colors hover:border-[#1E3A8A]/30 hover:text-[#1E3A8A] cursor-pointer"
                                  >
                                    {copiedKey === card.groupKey ? (
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

                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${matchMeta.className}`}
                              >
                                {matchMeta.label}
                              </span>
                              {card.mergedRecordsCount > 1 && (
                                <span className="text-[11px] text-slate-400 tabular-nums">
                                  {card.mergedRecordsCount} riferimenti accorpati
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 1. Metadati veicolo/montaggio: mostra solo campi presenti senza buchi */}
                          {vehicleMetaItems.length > 0 && (
                            <dl
                              className={`mt-3.5 grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-[#F9FAFB] px-3.5 py-2.5 text-xs ${metaGridColsClass}`}
                            >
                              {vehicleMetaItems.map((meta) => (
                                <div key={meta.label} className="min-w-0">
                                  <dt className="text-[11px] font-medium text-slate-400">
                                    {meta.label}
                                  </dt>
                                  <dd
                                    className={`mt-0.5 break-words ${
                                      meta.emphasis
                                        ? "font-semibold text-slate-900"
                                        : "font-medium text-slate-800"
                                    }`}
                                  >
                                    {meta.value}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}

                          {/* 1. Specifiche tecniche: nascoste completamente se vuote/nulle */}
                          {card.attributes.length > 0 && (
                            <div className="mt-3">
                              <span className="block text-[11px] font-medium text-slate-400">
                                Dettagli e specifiche tecniche
                              </span>
                              {card.attributes.length === 1 ? (
                                <p className="mt-1 text-xs leading-relaxed text-slate-700">
                                  {card.attributes[0]}
                                </p>
                              ) : (
                                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                                  {card.attributes.map((attr, idx) => (
                                    <li
                                      key={`${card.groupKey}-attr-${idx}`}
                                      className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                                    >
                                      {attr}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}

                          {/* 2. Codici equivalenti accorpati (nascosti se vuoti) */}
                          {card.crossReferences.length > 0 && (
                            <div className="mt-3.5 border-t border-slate-100 pt-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-medium text-slate-400">
                                  Codici equivalenti (Cross-reference)
                                </span>
                                {card.crossReferences.length > 1 && (
                                  <span className="text-[11px] text-slate-400 tabular-nums">
                                    {card.crossReferences.length} codici
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {card.crossReferences.map((refCode, idx) => {
                                  const isHighlighted = normalizeOemCode(refCode).includes(
                                    normalizedQuery
                                  );
                                  return (
                                    <button
                                      key={`${card.groupKey}-ref-${idx}`}
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
                        </div>

                        {/* 3. Barra azioni sobria in fondo alla card */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                          <button
                            type="button"
                            onClick={() => handleFindPartsClick(card)}
                            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#1E3A8A]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/40 sm:flex-initial cursor-pointer"
                          >
                            <Search className="h-3.5 w-3.5" />
                            <span>Cerca ricambi compatibili</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRequestAvailabilityClick(card)}
                            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-[#F9FAFB] px-3.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#1E3A8A]/35 hover:bg-white hover:text-[#1E3A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/30 sm:flex-initial cursor-pointer"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <span>Richiedi disponibilità</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default OemCatalogResults;
