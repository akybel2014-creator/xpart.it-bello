import { CheckCircle2, Clock, PackageCheck, RotateCcw, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { PageLayout } from "@/src/pages/PageLayout";

/**
 * Pagina Garanzia e Resi (`/garanzia-e-resi`).
 * Spiega in dettaglio garanzie sui ricambi usati (test al banco, gradi d'uso),
 * garanzie sui ricambi nuovi/ricondizionati e procedura di reso entro 14 giorni.
 */
export function GaranziaResi() {
  return (
    <PageLayout
      eyebrow="Tutela Acquisti B2B"
      title="Garanzia sui Ricambi e Procedura di Reso"
      subtitle="Standard chiari di ispezione, copertura trasparente su ricambi usati, ricondizionati e nuovi, con diritto di reso gestito entro 14 giorni dalla consegna."
      breadcrumbLabel="Garanzia e Resi"
      updatedAt="Gennaio 2026"
    >
      {/* Riepilogo rapido 3 card */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
          <h2 className="mt-3 font-display text-sm font-semibold text-slate-900">
            Garanzia fino a 24 mesi
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Copertura minima di 12 mesi sui ricambi usati certificati e fino a 24 mesi
            su unità nuove OEM e ricondizionate.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <PackageCheck className="h-5 w-5 text-[#1E3A8A]" />
          <h2 className="mt-3 font-display text-sm font-semibold text-slate-900">
            Ispezione e test al banco
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Ogni componente viene verificato dai demolitori partner prima della
            pubblicazione con codice OEM e sigillo di tracciabilità.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <RotateCcw className="h-5 w-5 text-[#1E3A8A]" />
          <h2 className="mt-3 font-display text-sm font-semibold text-slate-900">
            Reso garantito entro 14 giorni
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Procedura digitale semplificata con ritiro tramite corriere espresso e
            rimborso o sostituzione rapida.
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <section className="space-y-2.5">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            1. Garanzia sui ricambi usati originali
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            I ricambi usati provengono esclusivamente da autodemolitori autorizzati e
            vengono classificati con grado di usura trasparente prima della messa in
            vendita:
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
            <li>
              <strong className="text-slate-800">Usato Grado A:</strong> componente
              testato al banco o su veicolo funzionante, integro negli attacchi e privo di
              difetti funzionali. Garanzia standard <strong className="text-slate-800">12 mesi</strong>.
            </li>
            <li>
              <strong className="text-slate-800">Usato Grado B:</strong> componente
              pienamente funzionante con normali segni estetici compatibili con il
              chilometraggio dichiarato. Garanzia standard <strong className="text-slate-800">6–12 mesi</strong>.
            </li>
            <li>
              Ogni pezzo è contrassegnato da un <strong className="text-slate-800">sigillo identificativo</strong>{" "}
              del fornitore che non deve essere rimosso o manomesso per mantenere valida
              la copertura.
            </li>
          </ul>
        </section>

        <section className="space-y-2.5 border-t border-slate-100 pt-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            2. Garanzia sui ricambi nuovi e ricondizionati OEM
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            I ricambi nuovi OEM e le unità ricondizionate (turbine, alternatori, scatole
            sterzo, iniettori, cambi revisionati) beneficiano di una garanzia compresa tra{" "}
            <strong className="text-slate-800">12 e 24 mesi</strong> secondo quanto
            riportato nella scheda prodotto. Per mantenere valida la garanzia su parti
            meccaniche ed elettroniche è richiesto il montaggio a regola d&apos;arte presso
            officina qualificata con sostituzione dei materiali di consumo raccomandati
            dal costruttore (oli, guarnizioni, filtri).
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            3. Procedura di reso entro 14 giorni
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Se il componente ricevuto non è compatibile o presenta un&apos;anomalia non
            segnalata nella scheda, puoi richiedere il reso entro{" "}
            <strong className="text-slate-800">14 giorni di calendario</strong> dalla
            data di consegna seguendo 3 passaggi:
          </p>
          <ol className="space-y-2.5 pt-1 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
              <span>
                <strong className="text-slate-800">Apertura pratica:</strong> invia il
                numero ordine, il codice OEM e una breve descrizione (con foto se
                danneggiato) tramite la pagina{" "}
                <Link to="/contatti" className="font-medium text-[#1E3A8A] hover:underline">
                  Assistenza Clienti
                </Link>
                .
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />
              <span>
                <strong className="text-slate-800">Autorizzazione e ritiro:</strong> entro
                24 ore lavorative riceverai l&apos;etichetta di reso e la prenotazione del
                corriere presso la tua officina.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />
              <span>
                <strong className="text-slate-800">Verifica e rimborso:</strong> al rientro
                del ricambio integro e completo di sigillo, emettiamo nota di credito e
                rimborso sul metodo di pagamento originale entro 3–5 giorni lavorativi
                (oppure spediamo immediatamente il ricambio sostitutivo).
              </span>
            </li>
          </ol>
        </section>
      </div>
    </PageLayout>
  );
}

export default GaranziaResi;
