import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  MessageCircle,
  MoreHorizontal,
  Package,
  PackageCheck,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  SellerPartModal,
  type SellerPartFormValues,
} from "@/src/components/SellerPartModal";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  INITIAL_SELLER_PREVENTIVI,
  INITIAL_SELLER_RICAMBI,
  SELLER_PROFILE,
  type PreventivoRecord,
  type PreventivoStato,
  type RicambioRecord,
  type RicambioStato,
} from "@/src/data/sellerData";
import { cn } from "@/src/lib/utils";

type DashboardTab = "ricambi" | "preventivi";

const QUOTE_STATUS_OPTIONS: PreventivoStato[] = [
  "Nuovo",
  "In contatto",
  "Venduto",
  "Archiviato",
];

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\s+/g, "");
  if (digits.startsWith("+39") && digits.length >= 12) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return phone;
}

function getWhatsAppUrl(phone: string, partTitle: string): string {
  const cleaned = phone.replace(/[^\d]/g, "");
  const text = encodeURIComponent(
    `Buongiorno, le rispondiamo in merito alla richiesta preventivo per: ${partTitle} su CasaLavoroPRO.`
  );
  return `https://wa.me/${cleaned}?text=${text}`;
}

export function SellerDashboard() {
  // Stati React predisposti per integrazione diretta con Supabase
  // Es. useEffect(() => { supabase.from('ricambi').select('*').eq('user_id', userId) ... }, [userId])
  const [userId] = useState<string>(SELLER_PROFILE.user_id);
  const [ricambi, setRicambi] = useState<RicambioRecord[]>(INITIAL_SELLER_RICAMBI);
  const [preventivi, setPreventivi] = useState<PreventivoRecord[]>(
    INITIAL_SELLER_PREVENTIVI
  );

  // Controlli UI
  const [activeTab, setActiveTab] = useState<DashboardTab>("ricambi");
  const [searchQuery, setSearchQuery] = useState("");
  const [partStatusFilter, setPartStatusFilter] = useState<"Tutti" | RicambioStato>(
    "Tutti"
  );
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<
    "Tutti" | PreventivoStato
  >("Tutti");
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Stato Modale Crea / Modifica Ricambio
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<RicambioRecord | null>(null);

  // Metriche KPI calcolate dinamicamente
  const kpi = useMemo(() => {
    const totalParts = ricambi.length;
    const availableParts = ricambi.filter((r) => r.stato === "Disponibile").length;
    const soldParts = ricambi.filter((r) => r.stato === "Venduto").length;
    const newQuotes = preventivi.filter((p) => p.stato === "Nuovo").length;
    const closedDeals = preventivi.filter((p) => p.stato === "Venduto").length;

    return {
      totalParts,
      availableParts,
      soldParts,
      newQuotes,
      closedDeals,
    };
  }, [ricambi, preventivi]);

  // Ricambi filtrati per ricerca e stato
  const filteredRicambi = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ricambi.filter((item) => {
      if (partStatusFilter !== "Tutti" && item.stato !== partStatusFilter) {
        return false;
      }
      if (!q) return true;
      const haystack =
        `${item.titolo} ${item.codice_oem} ${item.marca} ${item.modello} ${item.categoria}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [ricambi, searchQuery, partStatusFilter]);

  // Preventivi filtrati per ricerca e stato
  const filteredPreventivi = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return preventivi.filter((item) => {
      if (quoteStatusFilter !== "Tutti" && item.stato !== quoteStatusFilter) {
        return false;
      }
      if (!q) return true;
      const haystack =
        `${item.cliente_nome} ${item.cliente_azienda} ${item.ricambio_titolo} ${item.codice_oem}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [preventivi, searchQuery, quoteStatusFilter]);

  // Azioni CRUD pronte per essere collegate alle chiamate Supabase (insert / update / delete)
  const handleSavePart = (values: SellerPartFormValues, editingId?: string) => {
    if (editingId) {
      // Supabase: await supabase.from('ricambi').update(values).eq('id', editingId).eq('user_id', userId)
      setRicambi((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...values } : item
        )
      );
      toast.success(`Ricambio "${values.titolo}" aggiornato.`);
      setEditingPart(null);
      return;
    }

    // Supabase: await supabase.from('ricambi').insert({ ...values, user_id: userId, stato: 'Disponibile' })
    const newRecord: RicambioRecord = {
      id: `ric_${Date.now()}`,
      user_id: userId,
      ...values,
      stato: "Disponibile",
      created_at: new Date().toISOString(),
    };
    setRicambi((prev) => [newRecord, ...prev]);
    setActiveTab("ricambi");
    toast.success(`Ricambio "${values.titolo}" pubblicato a catalogo.`);
  };

  const handleTogglePartStatus = (part: RicambioRecord) => {
    const nextStatus: RicambioStato =
      part.stato === "Disponibile" ? "Venduto" : "Disponibile";
    // Supabase: await supabase.from('ricambi').update({ stato: nextStatus }).eq('id', part.id)
    setRicambi((prev) =>
      prev.map((item) =>
        item.id === part.id ? { ...item, stato: nextStatus } : item
      )
    );
    toast.success(`Stato aggiornato a "${nextStatus}" per ${part.titolo}.`);
  };

  const handleDeletePart = (part: RicambioRecord) => {
    // Supabase: await supabase.from('ricambi').delete().eq('id', part.id).eq('user_id', userId)
    setRicambi((prev) => prev.filter((item) => item.id !== part.id));
    toast.success(`Ricambio "${part.titolo}" rimosso dal catalogo.`);
  };

  const handleQuoteStatusChange = (
    quoteId: string,
    nextStatus: PreventivoStato
  ) => {
    // Supabase: await supabase.from('preventivi').update({ stato: nextStatus }).eq('id', quoteId).eq('user_id', userId)
    setPreventivi((prev) =>
      prev.map((item) =>
        item.id === quoteId ? { ...item, stato: nextStatus } : item
      )
    );
    toast.success(`Stato preventivo aggiornato a "${nextStatus}".`);
  };

  const openCreateModal = () => {
    setEditingPart(null);
    setPartModalOpen(true);
  };

  const openEditModal = (part: RicambioRecord) => {
    setEditingPart(part);
    setPartModalOpen(true);
  };

  return (
    <section
      aria-label="Pannello Fornitore"
      className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
    >
      {/* 1. Intestazione Dashboard */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Pannello Fornitore
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {SELLER_PROFILE.businessName}
            </span>
            {SELLER_PROFILE.verified && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[#16A34A]/25 bg-[#16A34A]/10 px-2 py-0.5 text-xs font-semibold text-[#16A34A]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Fornitore Verificato
              </span>
            )}
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>{SELLER_PROFILE.city}</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="font-mono text-xs text-slate-500">
              P.IVA {SELLER_PROFILE.vatNumber}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="success"
          size="lg"
          onClick={openCreateModal}
          className="shrink-0 font-semibold"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Aggiungi ricambio
        </Button>
      </div>

      {/* 2. Tre KPI Cards Riassuntive */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <Card className="border-slate-200 bg-white shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Ricambi a catalogo
              </span>
              <Package className="h-4 w-4 text-[#1E3A8A]" />
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="font-display text-3xl font-bold tabular-nums text-slate-900">
                {kpi.totalParts}
              </span>
              <span className="text-xs text-slate-500 tabular-nums">
                {kpi.availableParts} disponibili · {kpi.soldParts} venduti
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-500">
                Nuovi preventivi
              </span>
              {kpi.newQuotes > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  Richiede risposta
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-[#16A34A]/25 bg-[#16A34A]/10 px-2 py-0.5 text-xs font-semibold text-[#16A34A]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tutto gestito
                </span>
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="font-display text-3xl font-bold tabular-nums text-[#1E3A8A]">
                {kpi.newQuotes}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("preventivi");
                  setQuoteStatusFilter("Nuovo");
                }}
                className="text-xs font-medium text-[#1E3A8A] hover:underline cursor-pointer"
              >
                Vedi richieste nuove
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Trattative concluse
              </span>
              <PackageCheck className="h-4 w-4 text-[#16A34A]" />
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="font-display text-3xl font-bold tabular-nums text-[#16A34A]">
                {kpi.closedDeals}
              </span>
              <span className="text-xs text-slate-500 tabular-nums">
                su {preventivi.length} richieste ricevute
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Sezione Tabellare con Tab */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white">
        {/* Barra Tab + Filtri di ricerca */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 pt-4 pb-4 lg:flex-row lg:items-center">
          <div
            role="tablist"
            aria-label="Sezioni pannello fornitore"
            className="inline-flex rounded-lg border border-slate-200 bg-[#F9FAFB] p-1 self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "ricambi"}
              onClick={() => setActiveTab("ricambi")}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer",
                activeTab === "ricambi"
                  ? "bg-white text-[#1E3A8A] shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span>I Miei Ricambi</span>
              <span className="font-mono text-xs tabular-nums text-slate-500">
                ({ricambi.length})
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "preventivi"}
              onClick={() => setActiveTab("preventivi")}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer",
                activeTab === "preventivi"
                  ? "bg-white text-[#1E3A8A] shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span>Richieste Preventivo</span>
              <span
                className={cn(
                  "font-mono text-xs tabular-nums",
                  kpi.newQuotes > 0 ? "font-semibold text-[#16A34A]" : "text-slate-500"
                )}
              >
                ({preventivi.length})
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "ricambi"
                    ? "Filtra per titolo, OEM o marca..."
                    : "Cerca cliente, officina o ricambio..."
                }
                aria-label="Cerca nella tabella"
                className="h-9 pl-9 text-xs"
              />
            </div>

            {activeTab === "ricambi" ? (
              <div className="w-full sm:w-40">
                <Select
                  value={partStatusFilter}
                  onValueChange={(v) =>
                    setPartStatusFilter(v as "Tutti" | RicambioStato)
                  }
                >
                  <SelectTrigger className="h-9 text-xs" aria-label="Filtra stato ricambio">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tutti">Tutti gli stati</SelectItem>
                    <SelectItem value="Disponibile">Disponibile</SelectItem>
                    <SelectItem value="Venduto">Venduto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="w-full sm:w-44">
                <Select
                  value={quoteStatusFilter}
                  onValueChange={(v) =>
                    setQuoteStatusFilter(v as "Tutti" | PreventivoStato)
                  }
                >
                  <SelectTrigger className="h-9 text-xs" aria-label="Filtra stato preventivo">
                    <SelectValue placeholder="Stato preventivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tutti">Tutti gli stati</SelectItem>
                    {QUOTE_STATUS_OPTIONS.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: I Miei Ricambi */}
        {activeTab === "ricambi" && (
          <div role="tabpanel" aria-label="I Miei Ricambi">
            {filteredRicambi.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#F9FAFB] text-xs font-semibold text-slate-500">
                      <th className="py-3 pl-5 pr-3">Ricambio</th>
                      <th className="px-3 py-3">Compatibilità Vettura</th>
                      <th className="px-3 py-3 text-right">Prezzo Netto</th>
                      <th className="px-3 py-3">Stato</th>
                      <th className="py-3 pl-3 pr-5 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRicambi.map((part) => (
                      <tr
                        key={part.id}
                        className="transition-colors duration-150 hover:bg-slate-50/80"
                      >
                        <td className="py-3.5 pl-5 pr-3">
                          <div className="flex items-center gap-3.5">
                            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-[#F9FAFB]">
                              {!brokenImages[part.id] ? (
                                <img
                                  src={part.foto_url}
                                  alt={part.titolo}
                                  referrerPolicy="no-referrer"
                                  onError={() =>
                                    setBrokenImages((prev) => ({
                                      ...prev,
                                      [part.id]: true,
                                    }))
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-400">
                                  <Wrench className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 line-clamp-1">
                                {part.titolo}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                                <span className="font-mono">OEM {part.codice_oem}</span>
                                <span aria-hidden="true">·</span>
                                <span>{part.categoria}</span>
                                <span aria-hidden="true">·</span>
                                <span>{part.citta}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 align-middle">
                          <p className="font-medium text-slate-800 whitespace-nowrap">
                            {part.marca} {part.modello}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                            {part.anno_inizio}–{part.anno_fine} · {part.condizione}
                          </p>
                        </td>

                        <td className="px-3 py-3.5 text-right align-middle whitespace-nowrap">
                          <span className="font-mono text-sm font-semibold tabular-nums text-[#1E3A8A]">
                            €{part.prezzo.toLocaleString("it-IT")}
                          </span>
                        </td>

                        <td className="px-3 py-3.5 align-middle whitespace-nowrap">
                          {part.stato === "Disponibile" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#16A34A]/25 bg-[#16A34A]/10 px-2.5 py-1 text-xs font-semibold text-[#16A34A]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Disponibile
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              <PackageCheck className="h-3.5 w-3.5" />
                              Venduto
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 pl-3 pr-5 text-right align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Azioni per ${part.titolo}`}
                                className="h-8 w-8 text-slate-500 hover:text-slate-900"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openEditModal(part)}>
                                <Edit3 className="h-4 w-4 text-slate-500" />
                                Modifica
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleTogglePartStatus(part)}
                              >
                                <PackageCheck className="h-4 w-4 text-slate-500" />
                                {part.stato === "Disponibile"
                                  ? "Segna come Venduto"
                                  : "Segna Disponibile"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeletePart(part)}
                                className="text-red-600 focus:bg-red-50 focus:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Elimina
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <Package className="h-9 w-9 text-slate-300" />
                <h3 className="mt-3 font-display text-base font-semibold text-slate-900">
                  Nessun ricambio trovato
                </h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Modifica i filtri di ricerca oppure pubblica un nuovo ricambio nel
                  tuo inventario.
                </p>
                <Button
                  type="button"
                  variant="success"
                  size="sm"
                  onClick={openCreateModal}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4" />
                  Aggiungi ricambio
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Richieste Preventivo */}
        {activeTab === "preventivi" && (
          <div role="tabpanel" aria-label="Richieste Preventivo">
            {filteredPreventivi.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {filteredPreventivi.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex flex-col justify-between gap-4 p-5 transition-colors duration-150 hover:bg-slate-50/70 lg:flex-row lg:items-center"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Cliente & Telefono */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-display text-sm font-semibold text-slate-900">
                          {quote.cliente_nome}
                        </span>
                        <span className="text-xs font-medium text-slate-600">
                          {quote.cliente_azienda}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="font-mono text-xs tabular-nums text-slate-500">
                          {quote.data_richiesta}
                        </span>
                      </div>

                      {/* Ricambio di riferimento */}
                      <div className="text-sm text-slate-800">
                        <span className="text-xs font-medium text-slate-500">
                          Ricambio:{" "}
                        </span>
                        <span className="font-semibold text-[#1E3A8A]">
                          {quote.ricambio_titolo}
                        </span>
                        <span className="ml-2 font-mono text-xs text-slate-500">
                          (OEM {quote.codice_oem})
                        </span>
                      </div>

                      {/* Messaggio cliente */}
                      <p className="text-xs leading-relaxed text-slate-600">
                        &ldquo;{quote.messaggio}&rdquo;
                      </p>

                      {/* Azioni dirette Chiamata & WhatsApp */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a
                          href={`tel:${quote.cliente_telefono}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#1E3A8A]/40 hover:text-[#1E3A8A]"
                        >
                          <Phone className="h-3.5 w-3.5 text-[#1E3A8A]" />
                          <span className="tabular-nums">
                            {formatPhoneDisplay(quote.cliente_telefono)}
                          </span>
                        </a>

                        <a
                          href={getWhatsAppUrl(
                            quote.cliente_telefono,
                            quote.ricambio_titolo
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#16A34A]/30 bg-[#16A34A]/8 px-2.5 py-1.5 text-xs font-semibold text-[#16A34A] transition-colors hover:bg-[#16A34A]/15"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Selettore Stato Preventivo */}
                    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-3 lg:flex-col lg:items-end lg:border-t-0 lg:pt-0">
                      <span className="text-[11px] font-medium text-slate-500">
                        Stato trattativa
                      </span>
                      <div className="w-40">
                        <Select
                          value={quote.stato}
                          onValueChange={(val) =>
                            handleQuoteStatusChange(
                              quote.id,
                              val as PreventivoStato
                            )
                          }
                        >
                          <SelectTrigger
                            aria-label={`Stato preventivo per ${quote.cliente_nome}`}
                            className={cn(
                              "h-9 text-xs font-semibold",
                              quote.stato === "Nuovo" &&
                                "border-amber-300 bg-amber-50/70 text-amber-900",
                              quote.stato === "In contatto" &&
                                "border-[#1E3A8A]/30 bg-[#1E3A8A]/5 text-[#1E3A8A]",
                              quote.stato === "Venduto" &&
                                "border-[#16A34A]/35 bg-[#16A34A]/10 text-[#16A34A]",
                              quote.stato === "Archiviato" &&
                                "border-slate-200 bg-slate-100 text-slate-600"
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QUOTE_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <MessageCircle className="h-9 w-9 text-slate-300" />
                <h3 className="mt-3 font-display text-base font-semibold text-slate-900">
                  Nessuna richiesta preventivo trovata
                </h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Le richieste inviate dalle officine appariranno qui pronte per la
                  gestione commerciale.
                </p>
                {(quoteStatusFilter !== "Tutti" || searchQuery) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuoteStatusFilter("Tutti");
                      setSearchQuery("");
                    }}
                    className="mt-4"
                  >
                    Mostra tutte le richieste
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Modale a comparsa Crea / Modifica Ricambio */}
      <SellerPartModal
        open={partModalOpen}
        onOpenChange={(open) => {
          setPartModalOpen(open);
          if (!open) setEditingPart(null);
        }}
        editingPart={editingPart}
        defaultCity={SELLER_PROFILE.city}
        onSave={handleSavePart}
      />
    </section>
  );
}
