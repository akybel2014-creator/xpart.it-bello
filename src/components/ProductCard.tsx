import {
  CheckCircle2,
  FileSpreadsheet,
  ShieldCheck,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardFooter } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import type { AutoPart } from "@/src/data/parts";

interface ProductCardProps {
  part: AutoPart;
  onAddToCart: (part: AutoPart) => void;
  onRequestQuote: (part: AutoPart) => void;
  onInspectPart: (part: AutoPart) => void;
}

export function ProductCard({
  part,
  onAddToCart,
  onRequestQuote,
  onInspectPart,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-slate-200/90 bg-white transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      {/* 4:3 Studio Image Container */}
      <button
        type="button"
        onClick={() => onInspectPart(part)}
        aria-label={`Apri scheda tecnica ${part.title}`}
        className="relative aspect-[4/3] w-full overflow-hidden border-b border-slate-100 bg-[#F9FAFB] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1E3A8A]/40 cursor-pointer"
      >
        {!imgError ? (
          <img
            src={part.image}
            alt={`${part.title} - OEM ${part.oemCode}`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-slate-400">
            <Wrench className="h-8 w-8 text-slate-300" />
            <span className="font-mono text-xs font-medium text-slate-500">
              OEM {part.oemCode}
            </span>
          </div>
        )}
      </button>

      {/* Technical Details */}
      <CardContent className="flex flex-1 flex-col p-5">
        {/* Clean Unboxed Kicker Metadata */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-medium text-slate-700">
            {part.brand} {part.model}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[11px] text-slate-500">
            OEM {part.oemCode}
          </span>
        </div>

        {/* Title */}
        <button
          type="button"
          onClick={() => onInspectPart(part)}
          className="mt-1.5 text-left focus-visible:outline-none focus-visible:underline cursor-pointer"
        >
          <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-[#1E3A8A]">
            {part.title}
          </h3>
        </button>

        {/* Condition & Years Compatibility */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
            {part.condition}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="tabular-nums">
            Anni {part.yearFrom}–{part.yearTo}
          </span>
        </div>

        {/* Verified Seller Row */}
        <div className="mt-auto pt-4">
          <Separator className="mb-3" />
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex min-w-0 items-center gap-1.5">
              {part.seller.verified && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      tabIndex={0}
                      className="inline-flex shrink-0 items-center gap-1 font-medium text-[#16A34A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40 rounded"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span className="sr-only">Venditore verificato</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Demolitore verificato ISO 9001 · Spedizione {part.seller.dispatchHours}h
                  </TooltipContent>
                </Tooltip>
              )}
              <span className="truncate font-medium text-slate-700">
                {part.seller.name}
              </span>
            </div>
            <span className="shrink-0 text-slate-400">{part.seller.city}</span>
          </div>
        </div>
      </CardContent>

      {/* Price & B2B CTA Footer */}
      <CardFooter className="flex flex-col items-stretch gap-3 border-t border-slate-100 bg-[#F9FAFB]/60 p-5 pt-4">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="font-display text-xl font-bold tabular-nums text-[#1E3A8A]">
              €{part.priceNet.toLocaleString("it-IT")}
            </span>
            <span className="ml-1.5 text-xs text-slate-500">+ IVA</span>
          </div>
          <span className="text-xs font-medium text-[#16A34A] tabular-nums">
            {part.stock} disp. · {part.warrantyMonths} mesi garanzia
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => onAddToCart(part)}
            className="h-9 w-full text-xs font-semibold"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Aggiungi
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRequestQuote(part)}
            className="h-9 w-full bg-white text-xs font-medium text-slate-700 hover:border-[#1E3A8A]/40 hover:text-[#1E3A8A]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Preventivo
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
