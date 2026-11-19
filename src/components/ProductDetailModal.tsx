import {
  CheckCircle2,
  FileSpreadsheet,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
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
  if (!part) return null;

  return (
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
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Codice Interno</span>
                <span className="font-mono font-medium text-slate-900">{part.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Codice OEM</span>
                <span className="font-mono font-semibold text-[#1E3A8A]">{part.oemCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Codice Motore</span>
                <span className="font-mono text-slate-900">{part.engineCode}</span>
              </div>
              <div className="flex items-center justify-between">
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
                {part.brand} {part.model} · Compatibilità {part.yearFrom}–{part.yearTo}
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

            <Separator className="my-5" />

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
                <span>Sede logistica: {part.seller.city} · Garanzia {part.warrantyMonths} mesi</span>
              </div>
            </div>

            {/* Contiguous Purchase Module */}
            <div className="mt-auto pt-6">
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
  );
}
