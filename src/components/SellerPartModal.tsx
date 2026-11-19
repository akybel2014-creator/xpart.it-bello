import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  CategorySelector,
  type CategoriaSito,
} from "@/src/components/CategorySelector";
import type { PartCondition } from "@/src/data/parts";
import {
  STUDIO_IMAGE_PRESETS,
  type RicambioRecord,
} from "@/src/data/sellerData";
import { useVehicleCascade } from "@/src/hooks/useVehicleCascade";

export interface SellerPartFormValues {
  titolo: string;
  codice_oem: string;
  categoria: string;
  categoria_id?: string;
  categoria_slug?: string;
  marca: string;
  modello: string;
  motore: string;
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
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaSito | null>(
    null
  );
  const [marca, setMarca] = useState("");
  const [modello, setModello] = useState("");
  const [motore, setMotore] = useState("");
  const [annoInizio, setAnnoInizio] = useState("2018");
  const [annoFine, setAnnoFine] = useState("2023");
  const [condizione, setCondizione] = useState<PartCondition>("Usato Grado A");
  const [prezzo, setPrezzo] = useState("");
  const [citta, setCitta] = useState(defaultCity);
  const [fotoUrl, setFotoUrl] = useState(STUDIO_IMAGE_PRESETS[0].url);

  const {
    brands,
    models,
    engines,
    loadingBrands,
    loadingModels,
    loadingEngines,
  } = useVehicleCascade({
    selectedBrand: marca,
    selectedModel: modello,
  });

  useEffect(() => {
    if (!open) return;
    if (editingPart) {
      setTitolo(editingPart.titolo);
      setCodiceOem(editingPart.codice_oem);
      setSelectedCategoria(
        editingPart.categoria
          ? {
              id: editingPart.categoria_id || "",
              nome: editingPart.categoria,
              slug: editingPart.categoria_slug || "",
              macro_gruppo: "Principale",
            }
          : null
      );
      setMarca(editingPart.marca);
      setModello(editingPart.modello);
      setMotore(editingPart.motore || "");
      setAnnoInizio(String(editingPart.anno_inizio));
      setAnnoFine(String(editingPart.anno_fine));
      setCondizione(editingPart.condizione);
      setPrezzo(String(editingPart.prezzo));
      setCitta(editingPart.citta);
      setFotoUrl(editingPart.foto_url);
    } else {
      setTitolo("");
      setCodiceOem("");
      setSelectedCategoria(null);
      setMarca("");
      setModello("");
      setMotore("");
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
    if (!selectedCategoria?.nome) {
      toast.error("Seleziona Macro-categoria e Sottocategoria dal catalogo.");
      return;
    }
    if (!marca || !modello) {
      toast.error("Seleziona Marca e Modello dal database veicoli.");
      return;
    }
    if (engines.length > 0 && !motore) {
      toast.error("Seleziona la motorizzazione / versione compatibile.");
      return;
    }

    const startYear = Number(annoInizio) || 2018;
    const endYear = Math.max(startYear, Number(annoFine) || startYear);

    onSave(
      {
        titolo: titolo.trim(),
        codice_oem: codiceOem.trim() || "OEM-N/D",
        categoria: selectedCategoria.nome,
        categoria_id: selectedCategoria.id || undefined,
        categoria_slug: selectedCategoria.slug || undefined,
        marca,
        modello,
        motore: motore || "Motorizzazione standard",
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
            Seleziona il veicolo compatibile dal database ufficiale e inserisci i dati
            tecnici del ricambio.
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

            {/* Selezione Categoria a due livelli (public.categorie_sito) */}
            <div className="sm:col-span-2">
              <CategorySelector
                variant="form"
                value={selectedCategoria}
                onCategorySelect={setSelectedCategoria}
              />
            </div>

            {/* Codice OEM */}
            <div className="sm:col-span-2">
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

            {/* Menu a Cascata 1: Marca (da tabella Supabase `auto`) */}
            <div>
              <label
                htmlFor="part-brand"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Marca veicolo *
              </label>
              <Select
                value={loadingBrands ? undefined : marca}
                disabled={loadingBrands}
                onValueChange={(value) => {
                  setMarca(value);
                  setModello("");
                  setMotore("");
                }}
              >
                <SelectTrigger id="part-brand">
                  {loadingBrands ? (
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1E3A8A]" />
                      <span>Caricamento in corso...</span>
                    </span>
                  ) : (
                    <SelectValue placeholder="Seleziona marca" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {brands.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Menu a Cascata 2: Modello (abilitato dopo la scelta della marca) */}
            <div>
              <label
                htmlFor="part-model"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Modello veicolo *
              </label>
              <Select
                value={loadingModels ? undefined : modello}
                disabled={!marca || loadingModels}
                onValueChange={(value) => {
                  setModello(value);
                  setMotore("");
                }}
              >
                <SelectTrigger id="part-model">
                  {loadingModels ? (
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1E3A8A]" />
                      <span>Caricamento in corso...</span>
                    </span>
                  ) : (
                    <SelectValue
                      placeholder={marca ? "Seleziona modello" : "Prima scegli la marca"}
                    />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {models.map((mod) => (
                    <SelectItem key={mod} value={mod}>
                      {mod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Menu a Cascata 3: Motore / Versione (abilitato dopo il modello) */}
            <div className="sm:col-span-2">
              <label
                htmlFor="part-engine"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Motore / Versione *
              </label>
              <Select
                value={loadingEngines ? undefined : motore}
                disabled={!marca || !modello || loadingEngines}
                onValueChange={setMotore}
              >
                <SelectTrigger id="part-engine">
                  {loadingEngines ? (
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1E3A8A]" />
                      <span>Caricamento in corso...</span>
                    </span>
                  ) : (
                    <SelectValue
                      placeholder={
                        modello
                          ? "Seleziona motorizzazione / variante"
                          : "Prima scegli il modello"
                      }
                    />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {engines.map((eng) => (
                    <SelectItem key={eng.value} value={eng.value}>
                      {eng.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {/* Selettore rapido foto studio */}
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
