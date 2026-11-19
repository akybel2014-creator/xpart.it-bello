import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import type { AutoPart } from "@/src/data/parts";

export interface CartItem {
  part: AutoPart;
  quantity: number;
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onUpdateQty: (partId: string, delta: number) => void;
  onRemoveItem: (partId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout?: () => void;
}

const FREE_SHIPPING_THRESHOLD = 600;

export function CartDrawer({
  open,
  onOpenChange,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
}: CartDrawerProps) {
  const [confirmedOrderCode, setConfirmedOrderCode] = useState<string | null>(null);

  const subtotalNet = items.reduce(
    (sum, item) => sum + item.part.priceNet * item.quantity,
    0
  );
  const vatAmount = Math.round(subtotalNet * 0.22);
  const shippingCost = subtotalNet === 0 || subtotalNet >= FREE_SHIPPING_THRESHOLD ? 0 : 28;
  const totalGross = subtotalNet + vatAmount + shippingCost;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalNet);

  const handleConfirmOrder = () => {
    const code = `CLP-${Math.floor(2000 + Math.random() * 7999)}`;
    setConfirmedOrderCode(code);
    onClearCart();
    toast.success(`Ordine B2B #${code} inviato ai demolitori verificati.`);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmedOrderCode(null);
        onOpenChange(next);
      }}
    >
      <SheetContent side="right" className="flex flex-col p-0">
        <SheetHeader className="border-b border-slate-200 px-6 py-5">
          <SheetTitle>Carrello Ricambi B2B</SheetTitle>
          <SheetDescription>
            Fatturazione elettronica automatica verso Officina Rossi S.r.l.
          </SheetDescription>
        </SheetHeader>

        {confirmedOrderCode ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#16A34A]/10 text-[#16A34A]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
              Ordine #{confirmedOrderCode} Confermato
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
              I ricambi sono stati riservati presso i centri di autodemolizione. Riceverai la
              lettera di vettura entro 2 ore lavorative.
            </p>
            <Button
              type="button"
              className="mt-6"
              onClick={() => {
                setConfirmedOrderCode(null);
                onOpenChange(false);
              }}
            >
              Torna al Catalogo
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <ShoppingBag className="h-10 w-10 text-slate-300" />
            <h3 className="mt-4 font-display text-base font-semibold text-slate-900">
              Il tuo carrello è vuoto
            </h3>
            <p className="mt-1.5 max-w-xs text-sm text-slate-500">
              Aggiungi ricambi dal catalogo per verificare costi di trasporto e richiedere
              spedizione combinata.
            </p>
          </div>
        ) : (
          <>
            {/* Free B2B Pallet/Express Threshold */}
            <div className="border-b border-slate-100 bg-[#F9FAFB] px-6 py-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0 text-[#1E3A8A]" />
                {remainingForFreeShipping > 0 ? (
                  <span>
                    Aggiungi <strong className="tabular-nums text-slate-900">€{remainingForFreeShipping}</strong>{" "}
                    netti per ottenere la spedizione B2B gratuita.
                  </span>
                ) : (
                  <span className="font-medium text-[#16A34A]">
                    Spedizione corriere espresso B2B gratuita attiva.
                  </span>
                )}
              </div>
            </div>

            {/* Itemized List */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {items.map(({ part, quantity }) => (
                <div
                  key={part.id}
                  className="flex gap-3.5 rounded-xl border border-slate-200/80 bg-white p-3"
                >
                  <img
                    src={part.image}
                    alt={part.title}
                    referrerPolicy="no-referrer"
                    className="h-16 w-20 shrink-0 rounded-lg border border-slate-100 bg-[#F9FAFB] object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="font-mono text-[11px] text-slate-500">
                        OEM {part.oemCode}
                      </p>
                      <h4 className="line-clamp-1 text-sm font-semibold text-slate-900">
                        {part.title}
                      </h4>
                      <p className="text-xs text-slate-500">{part.seller.name}</p>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(part.id, -1)}
                          aria-label="Riduci quantità"
                          className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold tabular-nums text-slate-900">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(part.id, 1)}
                          aria-label="Aumenta quantità"
                          disabled={quantity >= part.stock}
                          className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tabular-nums text-[#1E3A8A]">
                          €{(part.priceNet * quantity).toLocaleString("it-IT")}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(part.id)}
                          aria-label="Rimuovi articolo"
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary & Checkout */}
            <div className="border-t border-slate-200 bg-[#F9FAFB] px-6 py-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Imponibile ricambi</span>
                  <span className="tabular-nums font-medium text-slate-900">
                    €{subtotalNet.toLocaleString("it-IT")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IVA (22%)</span>
                  <span className="tabular-nums font-medium text-slate-900">
                    €{vatAmount.toLocaleString("it-IT")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Spedizione Corriere B2B</span>
                  <span className="tabular-nums font-medium text-slate-900">
                    {shippingCost === 0 ? "Gratuita" : `€${shippingCost}`}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>Totale Ordine</span>
                  <span className="tabular-nums text-[#1E3A8A]">
                    €{totalGross.toLocaleString("it-IT")}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={() => {
                  if (onProceedToCheckout) {
                    onProceedToCheckout();
                  } else {
                    handleConfirmOrder();
                  }
                }}
                className="mt-4 w-full"
              >
                Procedi al Checkout Sicuro
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
