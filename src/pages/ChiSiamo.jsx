import { Building2, CheckCircle2, Database, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { PageLayout } from "@/src/pages/PageLayout";

/**
 * Pagina Chi Siamo (`/chi-siamo`).
 * Racconta la mission della piattaforma B2B CasaLavoroPRO – Sezione Automotive.
 */
export function ChiSiamo() {
  return (
    <PageLayout
      eyebrow="Il Progetto CasaLavoroPRO"
      title="Semplifichiamo l'approvvigionamento ricambi per le officine italiane"
      subtitle="Mettiamo in collegamento diretto autoriparatori, carrozzerie e centri di autodemolizione certificati con ricerca per codice OEM, tracciabilità trasparente e spedizioni rapide."
      breadcrumbLabel="Chi Siamo"
    >
      <div className="space-y-8">
        {/* Blocco Mission */}
        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-12 shadow-xs">
          <div className="space-y-4 lg:col-span-7">
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">
              La nostra missione: zero perdite di tempo in officina
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Ogni giorno migliaia di officine meccaniche e carrozzerie perdono ore al
              telefono per verificare la disponibilità di un cambio, di un faro LED o di
              una centralina compatibile. CasaLavoroPRO – Sezione Automotive nasce per
              eliminare telefonate a vuoto, foto sfocate e tempi incerti.
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              Aggreghiamo in un unico catalogo digitale l&apos;inventario reale di
              autodemolitori e ricambisti professionali verificati in tutta Italia,
              indicizzando ogni articolo per <strong className="text-slate-800">codice OEM</strong>,{" "}
              <strong className="text-slate-800">codici equivalenti (cross-reference)</strong> e
              compatibilità veicolo per Auto, Moto &amp; Scooter e Veicoli Industriali.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 rounded-xl border border-slate-200/80 bg-[#F9FAFB] p-5 lg:col-span-5">
            <div className="flex items-start gap-3">
              <Database className="mt-0.5 h-5 w-5 shrink-0 text-[#1E3A8A]" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Catalogo OEM strutturato
                </p>
                <p className="text-xs text-slate-500">
                  Ricerca flessibile su codici originali ed equivalenti con normalizzazione
                  automatica.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#16A34A]" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Solo operatori verificati
                </p>
                <p className="text-xs text-slate-500">
                  Controllo P.IVA, autorizzazioni ambientali e standard di imballaggio B2B.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[#1E3A8A]" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Economia circolare concreta
                </p>
                <p className="text-xs text-slate-500">
                  Rimettiamo in circolo componenti originali testati, riducendo costi di
                  riparazione e impatto ambientale.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Valori operativi */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <Building2 className="h-5 w-5 text-[#1E3A8A]" />
            <h3 className="mt-3 font-display text-sm font-semibold text-slate-900">
              Progettato per il B2B
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Prezzi netti trasparenti, fatturazione elettronica immediata e preventivi
              rapidi per lavorazioni urgenti.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
            <h3 className="mt-3 font-display text-sm font-semibold text-slate-900">
              Tracciabilità totale
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Ogni ordine dispone di stato aggiornato, riferimento spedizione e copertura
              garanzia verificabile.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <ShieldCheck className="h-5 w-5 text-[#1E3A8A]" />
            <h3 className="mt-3 font-display text-sm font-semibold text-slate-900">
              Rete in crescita continua
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Gestisci un centro di autodemolizione? Integra il tuo magazzino in pochi
              minuti dal pannello fornitore.
            </p>
          </div>
        </div>

        {/* CTA sobria */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-xs">
          <div>
            <p className="font-display text-base font-semibold text-slate-900">
              Vuoi iniziare a cercare o vendere ricambi su CasaLavoroPRO?
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Esplora subito il catalogo OEM oppure contatta il nostro team B2B per
              convenzioni dedicate.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/ricerca"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1E3A8A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1E3A8A]/90"
            >
              Vai alla Ricerca OEM
            </Link>
            <Link
              to="/contatti"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Contatta il team
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default ChiSiamo;
