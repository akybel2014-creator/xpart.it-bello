import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import type { AutoPart } from "@/src/data/parts";

interface QuoteModalProps {
  part: AutoPart | null;
  onClose: () => void;
}

export function QuoteModal({ part, onClose }: QuoteModalProps) {
  const [quantity, setQuantity] = useState("1");
  const [vatNumber, setVatNumber] = useState("IT04829100964");
  const [notes, setNotes] = useState("");

  if (!part) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      `Richiesta preventivo per ${part.title} inviata a ${part.seller.name}.`
    );
    setNotes("");
    setQuantity("1");
    onClose();
  };

  return (
    <Dialog open={Boolean(part)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Richiedi Preventivo B2B</DialogTitle>
          <DialogDescription>
            {part.title} · OEM {part.oemCode} ({part.seller.name})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="quote-qty"
                className="mb-1.5 block text-xs font-medium text-slate-700"
              >
                Quantità richiesta
              </label>
              <Input
                id="quote-qty"
                type="number"
                min={1}
                max={20}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="quote-vat"
                className="mb-1.5 block text-xs font-medium text-slate-700"
              >
                Partita IVA Officina
              </label>
              <Input
                id="quote-vat"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="quote-notes"
              className="mb-1.5 block text-xs font-medium text-slate-700"
            >
              Numero di telaio (VIN) o note tecniche per verifica compatibilità
            </label>
            <textarea
              id="quote-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Inserisci il numero di telaio a 17 caratteri o richieste su spedizione espressa..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-[#1E3A8A] focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit">Invia Richiesta</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface SellPartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SellPartModal({ open, onOpenChange }: SellPartModalProps) {
  const [partTitle, setPartTitle] = useState("");
  const [oemCode, setOemCode] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      `Annuncio "${partTitle}" (OEM ${oemCode}) inviato per verifica tecnica.`
    );
    setPartTitle("");
    setOemCode("");
    setPrice("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pubblica un Ricambio sul Marketplace B2B</DialogTitle>
          <DialogDescription>
            Riservato ad autodemolitori autorizzati e ricambisti certificati.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="sell-title"
              className="mb-1.5 block text-xs font-medium text-slate-700"
            >
              Descrizione Ricambio
            </label>
            <Input
              id="sell-title"
              value={partTitle}
              onChange={(e) => setPartTitle(e.target.value)}
              placeholder="Es. Cambio manuale 6M Fiat Ducato 2.3 MJT"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="sell-oem"
                className="mb-1.5 block text-xs font-medium text-slate-700"
              >
                Codice OEM
              </label>
              <Input
                id="sell-oem"
                value={oemCode}
                onChange={(e) => setOemCode(e.target.value)}
                placeholder="Es. 55264310"
                required
              />
            </div>
            <div>
              <label
                htmlFor="sell-price"
                className="mb-1.5 block text-xs font-medium text-slate-700"
              >
                Prezzo Netto (€)
              </label>
              <Input
                id="sell-price"
                type="number"
                min={10}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="350"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>
            <Button type="submit">Invia per Pubblicazione</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
