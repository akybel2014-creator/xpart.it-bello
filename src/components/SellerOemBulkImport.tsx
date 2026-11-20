import {
  AlertCircle,
  CheckCircle2,
  Compass,
  Download,
  FileSpreadsheet,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  OemVehicleLinkDrawer,
  type SelectedVehicleDraft,
} from "@/src/components/OemVehicleLinkDrawer";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import {
  buildSampleOemCsv,
  matchOemCodesBatch,
  parseOemCsvOrLines,
  upsertOemVehicleLinks,
  type BatchProgressInfo,
  type CatalogSuggestionMatch,
  type OemMatchStatus,
  type OemVehicleLinkPayload,
  type ParsedCsvOemRow,
  type VerifiedVehicleMatch,
} from "@/src/services/oemCompatibilityService";

type StatusFilterValue = "tutti" | OemMatchStatus;

interface BulkOemPreviewRow extends ParsedCsvOemRow {
  status: OemMatchStatus;
  verifiedVehicles: VerifiedVehicleMatch[];
  catalogSuggestions: CatalogSuggestionMatch[];
  pendingVehicles: SelectedVehicleDraft[];
  checkedOnDb: boolean;
}

const CHUNK_SIZE_OPTIONS = [50, 75, 100] as const;

export function SellerOemBulkImport() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [rawInput, setRawInput] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [chunkSize, setChunkSize] = useState<number>(75);

  const [rows, setRows] = useState<BulkOemPreviewRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("tutti");
  const [tableSearch, setTableSearch] = useState("");

  const [isMatching, setIsMatching] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [progress, setProgress] = useState<BatchProgressInfo | null>(null);
  const [progressPhase, setProgressPhase] = useState<"match" | "save" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stato Drawer di abbinamento per singola riga OEM
  const [drawerCodeNorm, setDrawerCodeNorm] = useState<string | null>(null);

  const activeDrawerRow = useMemo(
    () =>
      drawerCodeNorm
        ? rows.find((r) => r.normalizedCode === drawerCodeNorm) ?? null
        : null,
    [rows, drawerCodeNorm]
  );

  // Statistiche riepilogative e filtri
  const counts = useMemo(() => {
    let abbinato = 0;
    let suggerito = 0;
    let daAbbinare = 0;
    let totalPendingLinks = 0;
    let rowsWithPending = 0;

    for (const row of rows) {
      if (row.status === "abbinato") abbinato += 1;
      else if (row.status === "suggerito") suggerito += 1;
      else daAbbinare += 1;

      if (row.pendingVehicles.length > 0) {
        totalPendingLinks += row.pendingVehicles.length;
        rowsWithPending += 1;
      }
    }

    return {
      tutti: rows.length,
      abbinato,
      suggerito,
      da_abbinare: daAbbinare,
      totalPendingLinks,
      rowsWithPending,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "tutti" && row.status !== statusFilter) {
        return false;
      }
      if (!q) return true;

      const vehiclesText = [
        ...row.verifiedVehicles.map((v) => `${v.marca} ${v.modello} ${v.versione}`),
        ...row.catalogSuggestions.map((s) => `${s.marca} ${s.modello}`),
        ...row.pendingVehicles.map((p) => `${p.marca} ${p.modello} ${p.versione}`),
      ].join(" ");

      const haystack = `${row.sku} ${row.rawCode} ${row.normalizedCode} ${row.label} ${row.brandHint} ${row.modelHint} ${row.compatibilityNote} ${vehiclesText}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, statusFilter, tableSearch]);

  const runBatchVerification = async (targetRows: BulkOemPreviewRow[]) => {
    if (!Array.isArray(targetRows) || targetRows.length === 0) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsMatching(true);
    setProgressPhase("match");
    setErrorMessage(null);
    setProgress({
      processed: 0,
      total: targetRows.length,
      chunkIndex: 0,
      totalChunks: Math.ceil(targetRows.length / chunkSize),
    });

    const codes = targetRows.map((r) => r.normalizedCode);
    const res = await matchOemCodesBatch(codes, {
      chunkSize,
      signal: controller.signal,
      onProgress: (info) => setProgress(info),
    });

    setIsMatching(false);
    setProgressPhase(null);

    if (res.aborted) {
      toast.info("Verifica batch annullata.");
      return;
    }

    if (res.error) {
      setErrorMessage(res.error);
      toast.error("Verifica codici OEM interrotta per un errore.");
    }

    setRows((prev) =>
      prev.map((row) => {
        const match = res.resultsByCode[row.normalizedCode];
        if (!match) return row;
        return {
          ...row,
          status: match.status,
          verifiedVehicles: match.verifiedVehicles,
          catalogSuggestions: match.catalogSuggestions,
          checkedOnDb: true,
        };
      })
    );

    if (!res.error) {
      let matchedCount = 0;
      let suggestedCount = 0;
      for (const code of codes) {
        const st = res.resultsByCode[code]?.status;
        if (st === "abbinato") matchedCount += 1;
        else if (st === "suggerito") suggestedCount += 1;
      }
      toast.success(
        `Verifica completata su ${codes.length} codici: ${matchedCount} abbinati, ${suggestedCount} suggeriti da catalogo.`
      );
    }
  };

  const handleAnalyzeRawText = async (sourceText: string) => {
    const parsed = parseOemCsvOrLines(sourceText);

    if (parsed.rows.length === 0) {
      toast.error(
        "Nessun codice OEM valido rilevato. Inserisci almeno un codice alfanumerico."
      );
      return;
    }

    // Mantiene eventuali code pending già preparate per gli stessi codici
    const prevPendingMap = new Map<string, SelectedVehicleDraft[]>();
    for (const existing of rows) {
      if (existing.pendingVehicles.length > 0) {
        prevPendingMap.set(existing.normalizedCode, existing.pendingVehicles);
      }
    }

    const initialRows: BulkOemPreviewRow[] = parsed.rows.map((item) => ({
      ...item,
      status: "da_abbinare",
      verifiedVehicles: [],
      catalogSuggestions: [],
      pendingVehicles: prevPendingMap.get(item.normalizedCode) ?? [],
      checkedOnDb: false,
    }));

    setRows(initialRows);
    setStatusFilter("tutti");

    if (parsed.duplicatesSkipped > 0 || parsed.invalidSkipped > 0) {
      toast.info(
        `Caricati ${initialRows.length} codici unici (${parsed.duplicatesSkipped} duplicati e ${parsed.invalidSkipped} righe non valide ignorate).`
      );
    }

    await runBatchVerification(initialRows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      setUploadedFileName(file.name);
      setRawInput(content);
      void handleAnalyzeRawText(content);
    };
    reader.onerror = () => {
      toast.error("Impossibile leggere il file selezionato.");
    };
    reader.readAsText(file, "UTF-8");

    // Permette di ricaricare lo stesso file successivamente
    e.target.value = "";
  };

  const handleDownloadSampleCsv = () => {
    const csv = buildSampleOemCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modello_codici_oem_casalavoropro.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadSampleInTextarea = () => {
    const sample = buildSampleOemCsv();
    setUploadedFileName("esempio_demo.csv");
    setRawInput(sample);
    void handleAnalyzeRawText(sample);
  };

  const handleCancelOperation = () => {
    abortControllerRef.current?.abort();
  };

  const handleClearAll = () => {
    abortControllerRef.current?.abort();
    setRawInput("");
    setUploadedFileName(null);
    setRows([]);
    setTableSearch("");
    setStatusFilter("tutti");
    setErrorMessage(null);
    setProgress(null);
    setDrawerCodeNorm(null);
  };

  const handleQueueVehiclesForRow = (
    normalizedCode: string,
    nextPending: SelectedVehicleDraft[]
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.normalizedCode === normalizedCode
          ? { ...row, pendingVehicles: nextPending }
          : row
      )
    );
  };

  const handleSavedVehiclesForRow = (
    normalizedCode: string,
    newlyVerified: VerifiedVehicleMatch[]
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.normalizedCode !== normalizedCode) return row;

        const existingMap = new Map<number, VerifiedVehicleMatch>();
        for (const v of row.verifiedVehicles) {
          existingMap.set(v.vehicle_id, v);
        }
        for (const v of newlyVerified) {
          existingMap.set(v.vehicle_id, v);
        }

        const mergedVerified = Array.from(existingMap.values()).sort((a, b) =>
          `${a.marca} ${a.modello} ${a.versione}`.localeCompare(
            `${b.marca} ${b.modello} ${b.versione}`,
            "it"
          )
        );

        const savedIdSet = new Set(newlyVerified.map((v) => v.vehicle_id));
        const remainingPending = row.pendingVehicles.filter(
          (v) => !savedIdSet.has(v.vehicle_id)
        );

        return {
          ...row,
          status: mergedVerified.length > 0 ? "abbinato" : row.status,
          verifiedVehicles: mergedVerified,
          pendingVehicles: remainingPending,
        };
      })
    );
  };

  const handleRemovedVehicleForRow = (
    normalizedCode: string,
    removedVehicleId: number
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.normalizedCode !== normalizedCode) return row;
        const remaining = row.verifiedVehicles.filter(
          (v) => v.vehicle_id !== removedVehicleId
        );
        const nextStatus: OemMatchStatus =
          remaining.length > 0
            ? "abbinato"
            : row.catalogSuggestions.length > 0
              ? "suggerito"
              : "da_abbinare";
        return {
          ...row,
          status: nextStatus,
          verifiedVehicles: remaining,
        };
      })
    );
  };

  const handleSaveAllQueuedLinks = async () => {
    const linksToSave: OemVehicleLinkPayload[] = [];
    const pendingSnapshot = new Map<string, SelectedVehicleDraft[]>();

    for (const row of rows) {
      if (row.pendingVehicles.length === 0) continue;
      pendingSnapshot.set(row.normalizedCode, row.pendingVehicles);
      const combinedNotes = [
        row.sku ? `SKU: ${row.sku}` : "",
        row.compatibilityNote ? `Compatibilità CSV: ${row.compatibilityNote}` : "",
        row.notes || row.label || "",
      ]
        .filter(Boolean)
        .join(" | ");

      for (const vehicle of row.pendingVehicles) {
        linksToSave.push({
          oem_code: row.rawCode,
          vehicle_id: vehicle.vehicle_id,
          source: "seller_csv_batch",
          notes: combinedNotes || undefined,
        });
      }
    }

    if (linksToSave.length === 0) {
      toast.info("Nessun abbinamento in coda da salvare.");
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSavingBatch(true);
    setProgressPhase("save");
    setErrorMessage(null);
    setProgress({
      processed: 0,
      total: linksToSave.length,
      chunkIndex: 0,
      totalChunks: Math.ceil(linksToSave.length / chunkSize),
    });

    const res = await upsertOemVehicleLinks(linksToSave, {
      chunkSize,
      signal: controller.signal,
      onProgress: (info) => setProgress(info),
    });

    setIsSavingBatch(false);
    setProgressPhase(null);

    if (res.aborted) {
      toast.info("Salvataggio batch annullato.");
      return;
    }

    if (res.error) {
      setErrorMessage(res.error);
      toast.error("Errore durante il salvataggio batch degli abbinamenti.");
      return;
    }

    // Promuove le auto salvate nello stato locale da pending -> verified
    setRows((prev) =>
      prev.map((row) => {
        const savedDrafts = pendingSnapshot.get(row.normalizedCode);
        if (!savedDrafts || savedDrafts.length === 0) return row;

        const mergedMap = new Map<number, VerifiedVehicleMatch>();
        for (const v of row.verifiedVehicles) {
          mergedMap.set(v.vehicle_id, v);
        }
        for (const d of savedDrafts) {
          mergedMap.set(d.vehicle_id, {
            vehicle_id: d.vehicle_id,
            marca: d.marca,
            modello: d.modello,
            versione: d.versione,
            catalog_oem_code: row.rawCode,
            verified: true,
          });
        }

        const mergedList = Array.from(mergedMap.values()).sort((a, b) =>
          `${a.marca} ${a.modello} ${a.versione}`.localeCompare(
            `${b.marca} ${b.modello} ${b.versione}`,
            "it"
          )
        );

        return {
          ...row,
          status: "abbinato",
          verifiedVehicles: mergedList,
          pendingVehicles: [],
        };
      })
    );

    toast.success(
      `Salvataggio completato: ${res.savedCount} abbinamenti OEM ↔ Auto registrati su Supabase.`
    );
  };

  const isBusy = isMatching || isSavingBatch;
  const progressPercent =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.processed / progress.total) * 100))
      : 0;

  return (
    <div role="tabpanel" aria-label="Importa CSV e Abbinamenti OEM" className="p-5 sm:p-6">
      {/* 1. Area Caricamento CSV / Lista Codici OEM */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start">
        <div className="max-w-2xl">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Importazione CSV e Abbinamento Codici OEM ↔ Veicoli
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Carica un file CSV oppure incolla una lista di codici OEM (uno per riga):
            il sistema verifica a blocchi le auto già compatibili e i suggerimenti del
            catalogo, permettendoti di salvare gli abbinamenti verificati con un clic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Carica file CSV codici OEM"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={handleDownloadSampleCsv}
            className="h-9 bg-white text-xs text-slate-700"
          >
            <Download className="h-3.5 w-3.5" />
            Modello CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={handleLoadSampleInTextarea}
            className="h-9 bg-white text-xs text-slate-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Prova con esempio
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
            className="h-9 bg-[#1E3A8A] text-xs font-semibold text-white hover:bg-[#1E3A8A]/90"
          >
            <Upload className="h-3.5 w-3.5" />
            Carica CSV
          </Button>
        </div>
      </div>

      {/* Input testo diretto + parametri chunk */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor="bulk-oem-textarea"
              className="text-xs font-semibold text-slate-700"
            >
              Incolla lista codici OEM o contenuto CSV
              {uploadedFileName && (
                <span className="ml-2 font-mono font-normal text-slate-500">
                  ({uploadedFileName})
                </span>
              )}
            </label>
            {rawInput.trim().length > 0 && !isBusy && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                Svuota
              </button>
            )}
          </div>
          <textarea
            id="bulk-oem-textarea"
            rows={4}
            value={rawInput}
            disabled={isBusy}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={
              "Incolla qui i codici OEM (uno per riga) o un CSV con colonne sku;codice_oem;descrizione;categoria;compatibilita_veicoli\nEs:\nFRE-1K0615301T-A1;1K0615301T;Disco freno anteriore;freni;VW Golf V/VI 1.6-2.0 TDI"
            }
            className="w-full rounded-lg border border-slate-200 bg-[#F9FAFB] px-3.5 py-2.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#1E3A8A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#F9FAFB] p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Dimensione blocco (chunk)
              </span>
              <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
                {CHUNK_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    disabled={isBusy}
                    onClick={() => setChunkSize(size)}
                    className={cn(
                      "rounded px-2 py-1 font-mono text-[11px] font-medium tabular-nums transition-colors cursor-pointer",
                      chunkSize === size
                        ? "bg-[#1E3A8A] text-white"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              I codici vengono normalizzati in maiuscolo alfanumerico e verificati a
              blocchi su <span className="font-mono text-slate-700">match_oem_codes_batch</span>{" "}
              senza bloccare l&apos;interfaccia.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              disabled={isBusy || rawInput.trim().length === 0}
              onClick={() => void handleAnalyzeRawText(rawInput)}
              className="h-9 w-full bg-[#1E3A8A] text-xs font-semibold text-white hover:bg-[#1E3A8A]/90"
            >
              {isMatching ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Verifica in corso...
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5" />
                  Verifica codici su Supabase
                </>
              )}
            </Button>

            {rows.length > 0 && !isBusy && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void runBatchVerification(rows)}
                className="h-8 w-full bg-white text-xs text-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Riesegui verifica sui {rows.length} codici
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Barra avanzamento a blocchi (visibile solo durante verifica o salvataggio) */}
      {isBusy && progress && (
        <div className="mt-5 rounded-xl border border-[#1E3A8A]/20 bg-[#1E3A8A]/[0.03] px-4 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-2 font-semibold text-[#1E3A8A]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {progressPhase === "save"
                ? "Salvataggio abbinamenti OEM ↔ Auto a blocchi..."
                : "Verifica codici OEM su Supabase a blocchi..."}
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-600 tabular-nums">
                Blocco {progress.chunkIndex}/{Math.max(1, progress.totalChunks)} ·{" "}
                {progress.processed}/{progress.total} ({progressPercent}%)
              </span>
              <button
                type="button"
                onClick={handleCancelOperation}
                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:text-red-600 cursor-pointer"
              >
                <X className="h-3 w-3" />
                Annulla
              </button>
            </div>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-[#1E3A8A] transition-transform duration-150 origin-left"
              style={{ transform: `scaleX(${progressPercent / 100})` }}
            />
          </div>
        </div>
      )}

      {/* Banner errore non bloccante */}
      {errorMessage && (
        <div
          role="alert"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-700"
        >
          <span className="inline-flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span className="leading-relaxed">{errorMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold text-red-700 hover:underline cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* 2. Barra Filtri Stato + Salvataggio Batch */}
      {rows.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 xl:flex-row xl:items-center">
            {/* Controllo segmentato stato */}
            <div
              role="group"
              aria-label="Filtra righe per stato abbinamento"
              className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-[#F9FAFB] p-1 self-start"
            >
              {(
                [
                  { id: "tutti", label: "Tutti", count: counts.tutti },
                  { id: "abbinato", label: "Abbinato", count: counts.abbinato },
                  {
                    id: "suggerito",
                    label: "Suggerito da catalogo",
                    count: counts.suggerito,
                  },
                  {
                    id: "da_abbinare",
                    label: "Da abbinare",
                    count: counts.da_abbinare,
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatusFilter(item.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
                    statusFilter === item.id
                      ? "bg-white text-[#1E3A8A] shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <span>{item.label}</span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-500">
                    ({item.count})
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-60">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Cerca SKU, codice OEM o auto..."
                  className="h-9 pl-8 text-xs"
                />
              </div>

              <Button
                type="button"
                variant="success"
                size="sm"
                disabled={isBusy || counts.totalPendingLinks === 0}
                onClick={() => void handleSaveAllQueuedLinks()}
                className="h-9 shrink-0 text-xs font-semibold"
              >
                {isSavingBatch ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Salvataggio batch...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Salva in blocco ({counts.totalPendingLinks})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 3. Tabella Anteprima Codici OEM */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            {filteredRows.length > 0 ? (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F9FAFB] font-semibold text-slate-500">
                    <th className="py-3 pl-4 pr-3">SKU</th>
                    <th className="px-3 py-3">Codice OEM</th>
                    <th className="px-3 py-3">Stato</th>
                    <th className="px-3 py-3">Auto compatibili / Suggerimenti</th>
                    <th className="px-3 py-3 text-right">In coda</th>
                    <th className="py-3 pl-3 pr-4 text-right">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRows.map((row) => {
                    const topVerified = row.verifiedVehicles.slice(0, 2);
                    const remainingVerified = Math.max(
                      0,
                      row.verifiedVehicles.length - topVerified.length
                    );

                    // Suggerimenti marca/modello unici dal catalogo
                    const uniqueSuggestions = Array.from(
                      new Map(
                        row.catalogSuggestions.map((s) => [
                          `${s.marca.toUpperCase()}|${s.modello.toUpperCase()}`,
                          s,
                        ])
                      ).values()
                    );
                    const topSuggestions = uniqueSuggestions.slice(0, 2);
                    const remainingSuggestions = Math.max(
                      0,
                      uniqueSuggestions.length - topSuggestions.length
                    );

                    return (
                      <tr
                        key={row.rowId}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="py-3 pl-4 pr-3 align-top whitespace-nowrap">
                          <div className="font-mono text-xs font-medium text-slate-900">
                            {row.sku}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            {row.skuAutoGenerated ? "Generato auto" : "Da CSV"}
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="font-mono text-xs font-semibold text-[#1E3A8A]">
                            {row.rawCode}
                          </div>
                          {row.rawCode.toUpperCase() !== row.normalizedCode && (
                            <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                              Norm: {row.normalizedCode}
                            </div>
                          )}
                          {(row.label || row.brandHint) && (
                            <div className="mt-0.5 max-w-[220px] truncate text-[11px] text-slate-500">
                              {[row.label, row.brandHint, row.modelHint]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 align-top whitespace-nowrap">
                          {row.status === "abbinato" ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#16A34A]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Abbinato
                            </span>
                          ) : row.status === "suggerito" ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#1E3A8A]">
                              <Compass className="h-3.5 w-3.5" />
                              Suggerito da catalogo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                              Da abbinare
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 align-top">
                          {row.verifiedVehicles.length > 0 ? (
                            <div className="space-y-0.5 text-slate-700">
                              {topVerified.map((v) => (
                                <p key={v.vehicle_id} className="truncate max-w-md">
                                  <strong className="font-semibold text-slate-900">
                                    {v.marca}
                                  </strong>{" "}
                                  {v.modello}
                                  {v.versione ? ` · ${v.versione}` : ""}
                                </p>
                              ))}
                              {remainingVerified > 0 && (
                                <p className="text-[11px] text-slate-500 tabular-nums">
                                  +{remainingVerified}{" "}
                                  {remainingVerified === 1
                                    ? "altra versione verificata"
                                    : "altre versioni verificate"}
                                </p>
                              )}
                            </div>
                          ) : topSuggestions.length > 0 ? (
                            <div className="space-y-0.5 text-slate-600">
                              {topSuggestions.map((s, idx) => (
                                <p
                                  key={`${s.marca}-${s.modello}-${idx}`}
                                  className="truncate max-w-md"
                                >
                                  <strong className="font-medium text-slate-800">
                                    {s.marca}
                                  </strong>
                                  {s.modello ? ` · ${s.modello}` : ""}
                                  {s.cross_reference
                                    ? ` (rif. ${s.cross_reference})`
                                    : ""}
                                </p>
                              ))}
                              {remainingSuggestions > 0 && (
                                <p className="text-[11px] text-slate-400 tabular-nums">
                                  +{remainingSuggestions} altri suggerimenti da catalogo
                                </p>
                              )}
                            </div>
                          ) : !row.compatibilityNote ? (
                            <span className="text-slate-400">
                              Nessun veicolo ancora collegato
                            </span>
                          ) : null}

                          {row.compatibilityNote && (
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <p
                                title={row.compatibilityNote}
                                className="max-w-md truncate text-[11px] text-slate-500"
                              >
                                Nota CSV: {row.compatibilityNote}
                              </p>
                              {row.verifiedVehicles.length === 0 && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => setDrawerCodeNorm(row.normalizedCode)}
                                  className="text-[11px] font-medium text-[#1E3A8A] hover:underline disabled:opacity-50 cursor-pointer"
                                >
                                  Auto-abbina da CSV
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right align-top whitespace-nowrap tabular-nums">
                          {row.pendingVehicles.length > 0 ? (
                            <span className="font-mono font-semibold text-[#1E3A8A]">
                              +{row.pendingVehicles.length} da salvare
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 pl-3 pr-4 text-right align-top whitespace-nowrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => setDrawerCodeNorm(row.normalizedCode)}
                            className="h-8 bg-white px-2.5 text-xs font-medium text-slate-700 hover:border-[#1E3A8A]/40 hover:text-[#1E3A8A]"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            {row.verifiedVehicles.length > 0
                              ? "Gestisci auto"
                              : "Abbina auto"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-10 text-center text-xs text-slate-500">
                Nessun codice OEM corrisponde ai filtri selezionati.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stato vuoto iniziale prima del caricamento di un CSV */}
      {rows.length === 0 && !isBusy && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-[#F9FAFB] px-6 py-10 text-center">
          <FileSpreadsheet className="h-8 w-8 text-slate-400" />
          <h3 className="mt-3 font-display text-sm font-semibold text-slate-900">
            Nessun elenco OEM caricato
          </h3>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
            Carica un file CSV oppure incolla i tuoi codici OEM nel riquadro sopra per
            controllare in blocco le compatibilità auto e salvare i nuovi abbinamenti su{" "}
            <span className="font-mono text-slate-700">oem_vehicle_compatibility</span>.
          </p>
        </div>
      )}

      {/* Drawer di abbinamento Marca -> Modello -> Versione */}
      <OemVehicleLinkDrawer
        open={Boolean(activeDrawerRow)}
        onOpenChange={(open) => {
          if (!open) setDrawerCodeNorm(null);
        }}
        oemCode={activeDrawerRow?.rawCode ?? ""}
        normalizedCode={activeDrawerRow?.normalizedCode ?? ""}
        sku={activeDrawerRow?.sku}
        skuAutoGenerated={activeDrawerRow?.skuAutoGenerated}
        partLabel={activeDrawerRow?.label}
        compatibilityNote={activeDrawerRow?.compatibilityNote}
        notes={activeDrawerRow?.notes}
        verifiedVehicles={activeDrawerRow?.verifiedVehicles ?? []}
        catalogSuggestions={activeDrawerRow?.catalogSuggestions ?? []}
        pendingVehicles={activeDrawerRow?.pendingVehicles ?? []}
        onQueueVehicles={handleQueueVehiclesForRow}
        onSavedVehicles={handleSavedVehiclesForRow}
        onRemovedVehicle={handleRemovedVehicleForRow}
      />
    </div>
  );
}

export default SellerOemBulkImport;
