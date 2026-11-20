import {
  CheckCircle2,
  FileSpreadsheet,
  Link2,
  Loader2,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { OemVehicleLinkDrawer } from "@/src/components/OemVehicleLinkDrawer";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import type { AutoPart } from "@/src/data/parts";
import {
  buildSitePartSku,
  matchOemCodesBatch,
  normalizeOemCode,
  type CatalogSuggestionMatch,
  type VerifiedVehicleMatch,
} from "@/src/services/oemCompatibilityService";

interface ProductDetailModalProps {
  part: AutoPart | null;
  onClose: () => void;
  onAddToCart: (part: AutoPart) => void;
  onRequestQuote: (part: AutoPart) => void;
}

export function ProductDetailModal({
  part,
  onClose,
  onAddToCart,
  onRequestQuote,
}: ProductDetailModalProps) {
  const [verifiedVehicles, setVerifiedVehicles] = useState<VerifiedVehicleMatch[]>(
    []
  );
  const [catalogSuggestions, setCatalogSuggestions] = useState<
    CatalogSuggestionMatch[]
  >([]);
  const [loadingCompat, setLoadingCompat] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const normalizedOem = part ? normalizeOemCode(part.oemCode) : "";
  const partSku = part
    ? buildSitePartSku({
        category: part.category,
        oemCode: part.oemCode,
        fallbackId: part.id,
      })
    : "";

  // Carica in modo non bloccante le compatibilità verificate da `match_oem_codes_batch`
  useEffect(() => {
    if (!part || !normalizedOem) {
      setVerifiedVehicles([]);
      setCatalogSuggestions([]);
      setLoadingCompat(false);
      return;
    }

    let cancelled = false;
    setLoadingCompat(true);

    matchOemCodesBatch([normalizedOem], { chunkSize: 50 })
      .then((res) => {
        if (cancelled) return;
        const entry = res.resultsByCode[normalizedOem];
        setVerifiedVehicles(
          Array.isArray(entry?.verifiedVehicles) ? entry.verifiedVehicles : []
        );
        setCatalogSuggestions(
          Array.isArray(entry?.catalogSuggestions)
            ? entry.catalogSuggestions
            : []
        );
      })
      .catch(() => {
        if (!cancelled) {
          setVerifiedVehicles([]);
          setCatalogSuggestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCompat(false);
      });

    return () => {
      cancelled = true;
    };
  }, [part, normalizedOem]);

  if (!part) return null;

  const handleSavedVehicles = (
    _normCode: string,
    newlyVerified: VerifiedVehicleMatch[]
  ) => {
    setVerifiedVehicles((prev) => {
      const merged = new Map<number, VerifiedVehicleMatch>();
      for (const v of prev) merged.set(v.vehicle_id, v);
      for (const v of newlyVerified) merged.set(v.vehicle_id, v);
      return Array.from(merged.values()).sort((a, b) =>
        `${a.marca} ${a.modello} ${a.versione}`.localeCompare(
          `${b.marca} ${b.modello} ${b.versione}`,
          "it"
        )
      );
    });
  };

  const handleRemovedVehicle = (_normCode: string, removedVehicleId: number) => {
    setVerifiedVehicles((prev) =>
      prev.filter((v) => v.vehicle_id !== removedVehicleId)
    );
  };

  return (
    <>
      <Dialog open={Boolean(part)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* Left 4:3 Photo Column */}
            <div className="flex flex-col justify-between bg-[#F9FAFB] p-6 md:col-span-5 border-b md:border-b-0 md:border-r border-slate-200/80">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img
                  src={part.image}
                  alt={part.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">SKU</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {partSku}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Codice OEM</span>
                  <span className="font-mono font-semibold text-[#1E3A8A]">
                    {part.oemCode}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Codice Motore</span>
                  <span className="font-mono text-slate-900">
                    {part.engineCode}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Km Veicolo Donatore</span>
                  <span className="tabular-nums font-medium text-slate-900">
                    {part.mileageKm === 0
                      ? "0 km (Rigenerato)"
                      : `${part.mileageKm.toLocaleString("it-IT")} km`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Specifications & Purchase Column */}
            <div className="flex flex-col p-6 md:col-span-7">
              <DialogHeader>
                <p className="text-xs font-medium text-slate-500">
                  {part.brand} {part.model} · Compatibilità {part.yearFrom}–
                  {part.yearTo}
                </p>
                <DialogTitle className="mt-1 text-xl leading-snug">
                  {part.title}
                </DialogTitle>
                <DialogDescription className="mt-2 leading-relaxed text-slate-600">
                  {part.description}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 text-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                  {part.condition}
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-800 tabular-nums">
                  <Truck className="h-4 w-4 text-[#1E3A8A]" />
                  Partenza entro {part.seller.dispatchHours}h
                </span>
              </div>

              {/* Blocco Veicoli Compatibili (da `oem_vehicle_compatibility` + fallback scheda) */}
              <div className="mt-4 rounded-xl border border-slate-200/80 bg-[#F9FAFB] p-3.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">
                    Veicoli compatibili{" "}
                    {verifiedVehicles.length > 0 && (
                      <span className="font-mono text-[#16A34A] tabular-nums">
                        ({verifiedVehicles.length} verificati)
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    <Link2 className="h-3 w-3" />
                    Gestisci abbinamenti
                  </button>
                </div>

                {loadingCompat ? (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1E3A8A]" />
                    <span>Verifica compatibilità sul parco veicoli...</span>
                  </div>
                ) : verifiedVehicles.length > 0 ? (
                  <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-slate-700">
                    {verifiedVehicles.map((veh) => (
                      <li
                        key={veh.vehicle_id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="truncate">
                          <strong className="font-medium text-slate-900">
                            {veh.marca}
                          </strong>{" "}
                          {veh.modello}
                          {veh.versione ? ` · ${veh.versione}` : ""}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-400">
                          #{veh.vehicle_id}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-slate-600">
                    {part.brand} {part.model} ({part.yearFrom}–{part.yearTo}) · Motore{" "}
                    <span className="font-mono text-slate-800">
                      {part.engineCode}
                    </span>
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Verified Seller Block */}
              <div className="rounded-xl border border-slate-200/80 bg-[#F9FAFB] p-3.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                    {part.seller.name}
                  </span>
                  <span className="font-mono font-medium text-slate-700">
                    Valutazione {part.seller.rating}/5
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    Sede logistica: {part.seller.city} · Garanzia{" "}
                    {part.warrantyMonths} mesi
                  </span>
                </div>
              </div>

              {/* Contiguous Purchase Module */}
              <div className="mt-auto pt-5">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="font-display text-2xl font-bold tabular-nums text-[#1E3A8A]">
                      €{part.priceNet.toLocaleString("it-IT")}
                    </span>
                    <span className="ml-1.5 text-xs text-slate-500">+ IVA 22%</span>
                  </div>
                  <span className="text-xs font-medium text-[#16A34A] tabular-nums">
                    Disponibilità immediata: {part.stock} pz
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => {
                      onAddToCart(part);
                      onClose();
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Aggiungi al Carrello
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      onClose();
                      onRequestQuote(part);
                    }}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Richiedi Preventivo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drawer abbinamenti veicoli accessibile direttamente dalla scheda ricambio */}
      <OemVehicleLinkDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        oemCode={part.oemCode}
        normalizedCode={normalizedOem}
        sku={partSku}
        partLabel={part.title}
        compatibilityNote={`${part.brand} ${part.model} (${part.yearFrom}–${part.yearTo}) · Motore ${part.engineCode}`}
        verifiedVehicles={verifiedVehicles}
        catalogSuggestions={catalogSuggestions}
        pendingVehicles={[]}
        onSavedVehicles={handleSavedVehicles}
        onRemovedVehicle={handleRemovedVehicle}
      />
    </>
  );
}
