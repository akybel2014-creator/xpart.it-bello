import { Link } from "react-router-dom";
import { PageLayout } from "@/src/pages/PageLayout";

/**
 * Pagina Informativa Privacy GDPR (`/privacy-policy`).
 */
export function PrivacyPolicy() {
  return (
    <PageLayout
      eyebrow="Conformità Regolamento UE 2016/679 (GDPR)"
      title="Informativa sulla Privacy"
      subtitle="Come raccogliamo, trattiamo e proteggiamo i dati personali e aziendali degli utenti e degli account B2B registrati su CasaLavoroPRO."
      breadcrumbLabel="Privacy Policy"
      updatedAt="Gennaio 2026"
    >
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <section className="space-y-2.5">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            1. Titolare del trattamento
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Il Titolare del trattamento dei dati è <strong className="text-slate-800">CasaLavoroPRO S.r.l.</strong>,
            con sede operativa in Italia. Per qualsiasi richiesta relativa alla tutela dei
            dati personali è possibile scrivere a{" "}
            <span className="font-mono text-xs text-[#1E3A8A]">
              privacy@casalavoropro.it
            </span>{" "}
            oppure utilizzare la pagina{" "}
            <Link to="/contatti" className="font-medium text-[#1E3A8A] hover:underline">
              Contatti
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2.5 border-t border-slate-100 pt-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            2. Tipologie di dati trattati
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
            <li>
              <strong className="text-slate-800">Dati identificativi e aziendali:</strong>{" "}
              nome e cognome del referente, ragione sociale, Partita IVA, Codice Fiscale,
              Codice SDI/PEC, indirizzi di spedizione e fatturazione.
            </li>
            <li>
              <strong className="text-slate-800">Dati operativi e transazionali:</strong>{" "}
              ordini effettuati, preventivi richiesti, storico spedizioni e riferimenti di
              pagamento (i dati della carta non vengono mai salvati sui nostri server ma
              gestiti in sicurezza dal provider certificato).
            </li>
            <li>
              <strong className="text-slate-800">Dati tecnici di navigazione:</strong>{" "}
              log di sicurezza, indirizzo IP anonimizzato e preferenze tecniche necessarie
              al funzionamento del portale.
            </li>
          </ul>
        </section>

        <section className="space-y-2.5 border-t border-slate-100 pt-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            3. Finalità e base giuridica del trattamento
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            I dati sono trattati per: (a) erogazione dei servizi del marketplace,
            gestione degli ordini e comunicazioni tra officina e autodemolitore
            (esecuzione di un contratto, art. 6.1.b GDPR); (b) adempimenti fiscali,
            contabili e di fatturazione elettronica (obbligo legale, art. 6.1.c GDPR);
            (c) prevenzione frodi e sicurezza dell&apos;infrastruttura (legittimo interesse,
            art. 6.1.f GDPR).
          </p>
        </section>

        <section className="space-y-2.5 border-t border-slate-100 pt-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            4. Conservazione e condivisione dei dati
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            I dati fiscali e di fatturazione sono conservati per 10 anni come previsto
            dalla legge italiana. I dati di spedizione vengono condivisi unicamente con
            i fornitori verificati titolari dell&apos;ordine e con i corrieri incaricati
            della consegna. I dati non vengono mai ceduti a terzi per finalità
            pubblicitarie.
          </p>
        </section>

        <section className="space-y-2.5 border-t border-slate-100 pt-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            5. Diritti dell&apos;interessato (Art. 15–22 GDPR)
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            In qualunque momento puoi esercitare il diritto di accesso, rettifica,
            cancellazione, limitazione, opposizione e portabilità dei dati, nonché
            proporre reclamo all&apos;Autorità Garante per la Protezione dei Dati
            Personali. Per gestire le preferenze tecniche consulta anche la nostra{" "}
            <Link
              to="/cookie-policy"
              className="font-medium text-[#1E3A8A] hover:underline"
            >
              Cookie Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </PageLayout>
  );
}

export default PrivacyPolicy;
