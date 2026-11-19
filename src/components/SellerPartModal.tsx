import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { PartCondition } from "@/src/data/parts";
import {
  SELLER_CATEGORIES,
  STUDIO_IMAGE_PRESETS,
  type RicambioRecord,
} from "@/src/data/sellerData";

export interface SellerPartFormValues {
  titolo: string;
  codice_oem: string;
  categoria: string;
  marca: string;
  modello: string;
  anno_inizio: number;
  anno_fine: number;
  condizione: PartCondition;
  prezzo: number;
  citta: string;
  foto_url: string;
}

interface SellerPartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPart: RicambioRecord | null;
  defaultCity: string;
  onSave: (values: SellerPartFormValues, editingId?: string) => void;
}

const CONDITIONS: PartCondition[] = [
  "Usato Grado A",
  "Usato Grado B",
  "Ricondizionato OEM",
];

export function SellerPartModal({
  open,
  onOpenChange,
  editingPart,
  defaultCity,
  onSave,
}: SellerPartModalProps) {
  const [titolo, setTitolo] = useState("");
  const [codiceOem, setCodiceOem] = useState("");
  const [categoria, setCategoria] = useState(SELLER_CATEGORIES[0]);
  const [marca, setMarca] = useState("");
  const [modello, setModello] = useState("");
  const [annoInizio, setAnnoInizio] = useState("2018");
  const [annoFine, setAnnoFine] = useState("2023");
  const [condizione, setCondizione] = useState<PartCondition>("Usato Grado A");
  const [prezzo, setPrezzo] = useState("");
  const [citta, setCitta] = useState(defaultCity);
  const [fotoUrl, setFotoUrl] = useState(STUDIO_IMAGE_PRESETS[0].url);

  useEffect(() => {
    if (!open) return;
    if (editingPart) {
      setTitolo(editingPart.titolo);
      setCodiceOem(editingPart.codice_oem);
      setCategoria(editingPart.categoria);
      setMarca(editingPart.marca);
      setModello(editingPart.modello);
      setAnnoInizio(String(editingPart.anno_inizio));
      setAnnoFine(String(editingPart.anno_fine));
      setCondizione(editingPart.condizione);
      setPrezzo(String(editingPart.prezzo));
      setCitta(editingPart.citta);
      setFotoUrl(editingPart.foto_url);
    } else {
      setTitolo("");
      setCodiceOem("");
      setCategoria(SELLER_CATEGORIES[0]);
      setMarca("");
      setModello("");
      setAnnoInizio("2018");
      setAnnoFine("2023");
      setCondizione("Usato Grado A");
      setPrezzo("");
      setCitta(defaultCity);
      setFotoUrl(STUDIO_IMAGE_PRESETS[0].url);
    }
  }, [open, editingPart, defaultCity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startYear = Number(annoInizio) || 2018;
    const endYear = Math.max(startYear, Number(annoFine) || startYear);

    onSave(
      {
        titolo: titolo.trim(),
        codice_oem: codiceOem.trim() || "OEM-N/D",
        categoria,
        marca: marca.trim(),
        modello: modello.trim(),
        anno_inizio: startYear,
        anno_fine: endYear,
        condizione,
        prezzo: Math.max(1, Number(prezzo) || 0),
        citta: citta.trim() || defaultCity,
        foto_url: fotoUrl.trim() || STUDIO_IMAGE_PRESETS[0].url,
      },
      editingPart?.id
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingPart ? "Modifica Ricambio a Catalogo" : "Pubblica Nuovo Ricambio"}
          </DialogTitle>
          <DialogDescription>
            Inserisci i dati tecnici e la compatibilità del ricambio per renderlo visibile
            alle officine acquirenti.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Titolo */}
            <div className="sm:col-span-2">
              <label
                htmlFor="part-title"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Titolo ricambio *
              </label>
              <Input
                id="part-title"
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                placeholder="Es. Alternatore Bosch 180A 14V con Puleggia Frizionata"
                required
              />
            </div>

            {/* Categoria */}
            <div>
              <label
                htmlFor="part-category"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Categoria *
              </label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger id="part-category">
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent>
                  {SELLER_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Codice OEM opzionale */}
            <div>
              <label
                htmlFor="part-oem"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Codice OEM
              </label>
              <Input
                id="part-oem"
                value={codiceOem}
                onChange={(e) => setCodiceOem(e.target.value)}
                placeholder="Es. 0125811056"
                className="font-mono"
              />
            </div>

            {/* Marca */}
            <div>
              <label
                htmlFor="part-brand"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Marca veicolo *
              </label>
              <Input
                id="part-brand"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Es. BMW"
                required
              />
            </div>

            {/* Modello */}
            <div>
              <label
                htmlFor="part-model"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Modello veicolo *
              </label>
              <Input
                id="part-model"
                value={modello}
                onChange={(e) => setModello(e.target.value)}
                placeholder="Es. Serie 3 G20"
                required
              />
            </div>

            {/* Anno inizio */}
            <div>
              <label
                htmlFor="part-year-start"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Anno inizio *
              </label>
              <Input
                id="part-year-start"
                type="number"
                min={1990}
                max={2026}
                value={annoInizio}
                onChange={(e) => setAnnoInizio(e.target.value)}
                className="tabular-nums"
                required
              />
            </div>

            {/* Anno fine */}
            <div>
              <label
                htmlFor="part-year-end"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Anno fine *
              </label>
              <Input
                id="part-year-end"
                type="number"
                min={1990}
                max={2026}
                value={annoFine}
                onChange={(e) => setAnnoFine(e.target.value)}
                className="tabular-nums"
                required
              />
            </div>

            {/* Condizione */}
            <div>
              <label
                htmlFor="part-condition"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Condizione *
              </label>
              <Select
                value={condizione}
                onValueChange={(v) => setCondizione(v as PartCondition)}
              >
                <SelectTrigger id="part-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((cond) => (
                    <SelectItem key={cond} value={cond}>
                      {cond}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prezzo */}
            <div>
              <label
                htmlFor="part-price"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Prezzo Netto (€) *
              </label>
              <Input
                id="part-price"
                type="number"
                min={1}
                step="1"
                value={prezzo}
                onChange={(e) => setPrezzo(e.target.value)}
                placeholder="Es. 245"
                className="tabular-nums"
                required
              />
            </div>

            {/* Città */}
            <div>
              <label
                htmlFor="part-city"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Città di ritiro / spedizione *
              </label>
              <Input
                id="part-city"
                value={citta}
                onChange={(e) => setCitta(e.target.value)}
                placeholder="Es. Milano"
                required
              />
            </div>

            {/* URL Foto */}
            <div>
              <label
                htmlFor="part-photo"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                URL foto ricambio *
              </label>
              <Input
                id="part-photo"
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                placeholder="https://... oppure percorso locale"
                required
              />
            </div>
          </div>

          {/* Selettore rapido foto studio per test immediato */}
          <div className="rounded-lg border border-slate-200 bg-[#F9FAFB] p-3">
            <span className="block text-[11px] font-medium text-slate-500">
              Anteprima rapida foto studio (opzionale):
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STUDIO_IMAGE_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => setFotoUrl(preset.url)}
                  className={`rounded-md border px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                    fotoUrl === preset.url
                      ? "border-[#1E3A8A] bg-[#1E3A8A] text-white font-medium"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>
            <Button type="submit" variant="success">
              {editingPart ? "Salva modifiche" : "Pubblica ricambio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
