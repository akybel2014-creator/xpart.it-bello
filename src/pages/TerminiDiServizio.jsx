import { Link } from "react-router-dom";
import { PageLayout } from "@/src/pages/PageLayout";

/**
 * Pagina Condizioni Generali di Servizio B2B (`/termini-di-servizio`).
 * Disciplina il rapporto tra acquirenti professionali (officine, carrozzerie, rivenditori)
 * e venditori/centri di autodemolizione verificati su CasaLavoroPRO.
 */
export function TerminiDiServizio() {
  return (
    <PageLayout
      eyebrow="Documentazione Legale B2B"
      title="Condizioni Generali di Servizio"
      subtitle="Termini d'uso del marketplace CasaLavoroPRO – Sezione Automotive per officine, operatori professionali e centri di autodemolizione convenzionati."
      breadcrumbLabel="Termini di Servizio"
      updatedAt="Gennaio 2026"
    >
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <section className="space-y-2.5">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            1. Oggetto e ambito di applicazione
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            CasaLavoroPRO – Sezione Automotive opera quale piattaforma digitale di
            intermediazione tecnica B2B per la ricerca, la comparazione e la fornitura
            di ricambi originali nuovi, ricondizionati e usati garantiti per autovetture,
            motocicli e veicoli industriali. L&apos;accesso alle funzionalità di acquisto
            e vendita comporta l&apos;accettazione integrale delle presenti Condizioni
            Generali.
          </p>
        </section>

        <section className="space-y-2.5 border-t border-slate-100 pt-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            2. Obblighi degli acquirenti (Officine e Professionisti)
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
            <li>
              Verificare la piena compatibilità del ricambio tramite{" "}
              <strong className="font-semibold text-slate-800">codice OEM</strong>, codice
              motore o numero di telaio (VIN) prima della conferma d&apos;ordine.
            </li>
            <li>
              Fornire dati aziendali e di fatturazione elettronica (Ragione Sociale,
              Partita IVA, Codice SDI o PEC) veritieri e aggiornati.
            </li>
            <li>
              Ispezionare l&apos;integrità del collo alla consegna del corriere espresso,
              apponendo riserva specifica sul documento di trasporto in caso di imballo
              danneggiato.
            </li>
          </ul>
        </section>

        <section className="space-y-2.5 border-t border-slate-100 pt-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            3. Obblighi dei venditori e centri di autodemolizione
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
            <li>
              Possedere regolari autorizzazioni ambientali e iscrizione camerale per
              l&apos;attività di autodemolizione o commercio ricambi.
            </li>
            <li>
              Pubblicare schede veritiere comprensive di codice OEM corretto, stato
              d&apos;uso reale (Grado A, Grado B, Ricondizionato OEM), foto originali del
              pezzo e chilometri del veicolo donatore ove disponibili.
            </li>
            <li>
              Imballare ogni componente in modo idoneo al trasporto espresso (es. casse
              su bancale per cambi, motori e lamierati) e affidare la spedizione entro
              24/48 ore lavorative dalla conferma del pagamento.
            </li>
          </ul>
        </section>

        <section className="space-y-2.5 border-t border-slate-100 pt-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            4. Ordini, pagamenti e fatturazione elettronica
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            I prezzi indicati nel catalogo B2B sono espressi al netto dell&apos;IVA, salvo
            diversa indicazione nel riepilogo di checkout. L&apos;elaborazione dei pagamenti
            avviene tramite provider certificati PCI-DSS (carta aziendale o SEPA). La
            fattura elettronica viene emessa direttamente dal fornitore titolare del
            ricambio secondo la normativa vigente.
          </p>
        </section>

        <section className="space-y-2.5 border-t border-slate-100 pt-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            5. Garanzie, resi e foro competente
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Le procedure di sostituzione, rimborso e reso entro 14 giorni sono disciplinate
            nella sezione dedicata{" "}
            <Link
              to="/garanzia-e-resi"
              className="font-medium text-[#1E3A8A] hover:underline"
            >
              Garanzia e Resi
            </Link>
            . Per ogni controversia relativa all&apos;interpretazione o esecuzione delle
            presenti condizioni fra soggetti B2B è competente in via esclusiva il Foro di
            Milano, fatta salva l&apos;applicazione della legge italiana.
          </p>
        </section>
      </div>
    </PageLayout>
  );
}

export default TerminiDiServizio;
