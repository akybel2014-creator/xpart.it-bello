import { ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";

const LINK_CLASS =
  "text-sm text-slate-500 hover:text-blue-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/40 rounded";

/**
 * Footer professionale B2B a 4 colonne + Barra Inferiore di Copyright.
 * Coerente con lo stile dell'header CasaLavoroPRO (blu navy #1E3A8A e grigi neutri).
 * Responsive: 4 colonne su desktop (lg), 2 colonne su tablet (sm), 1 colonna su mobile.
 */
export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Colonna 1: Brand e Presentazione */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/40 rounded-md"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A8A] font-display text-sm font-bold tracking-tight text-white">
                CL
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                CasaLavoro<span className="text-[#1E3A8A]">PRO</span>
              </span>
            </Link>

            <div>
              <span className="inline-flex items-center rounded-md border border-[#1E3A8A]/20 bg-[#1E3A8A]/5 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#1E3A8A]">
                Sezione Automotive B2B
              </span>
            </div>

            <p className="text-sm leading-relaxed text-slate-500">
              Il marketplace digitale per la ricerca e fornitura di ricambi auto
              originali, nuovi e usati garantiti, collegando officine,
              professionisti e autodemolitori verificati.
            </p>

            {/* Badge di affidabilità sobri */}
            <div className="flex flex-col gap-2 pt-1 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#16A34A]" />
                <span>Supporto B2B dedicato per officine e P.IVA</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0 text-[#1E3A8A]" />
                <span>Spedizioni tracciate con corriere espresso</span>
              </span>
            </div>
          </div>

          {/* Colonna 2: Catalogo & Ricerca */}
          <div>
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-900">
              Catalogo &amp; Ricerca
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to="/ricerca" className={LINK_CLASS}>
                  Ricerca per Codice OEM
                </Link>
              </li>
              <li>
                <Link to="/catalogo" className={LINK_CLASS}>
                  Tutti i Ricambi
                </Link>
              </li>
              <li>
                <Link to="/categorie" className={LINK_CLASS}>
                  Sfoglia Categorie e Sottocategorie
                </Link>
              </li>
              <li>
                <Link to="/demolitori" className={LINK_CLASS}>
                  Directory Centri Autodemolizione Verificati
                </Link>
              </li>
              <li>
                <Link to="/marche" className={LINK_CLASS}>
                  Marche e Modelli supportati
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonna 3: Per i Fornitori e le Officine */}
          <div>
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-900">
              Per i Fornitori e le Officine
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to="/pannello-fornitore" className={LINK_CLASS}>
                  Accedi al Gestionale Venditore
                </Link>
              </li>
              <li>
                <Link to="/diventa-fornitore" className={LINK_CLASS}>
                  Come vendere i tuoi ricambi
                </Link>
              </li>
              <li>
                <Link to="/officine-b2b" className={LINK_CLASS}>
                  Condizioni e vantaggi per Partite IVA
                </Link>
              </li>
              <li>
                <Link to="/garanzia-e-resi" className={LINK_CLASS}>
                  Condizioni di reso entro 14 giorni e garanzia sui pezzi
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonna 4: Supporto e Note Legali */}
          <div>
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-900">
              Supporto e Note Legali
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to="/chi-siamo" className={LINK_CLASS}>
                  Chi siamo e il progetto
                </Link>
              </li>
              <li>
                <Link to="/contatti" className={LINK_CLASS}>
                  Assistenza clienti e form di contatto
                </Link>
              </li>
              <li>
                <Link to="/termini-di-servizio" className={LINK_CLASS}>
                  Condizioni Generali di Servizio B2B
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className={LINK_CLASS}>
                  Informativa sulla Privacy GDPR
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className={LINK_CLASS}>
                  Gestione Cookie
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barra Inferiore (Bottom Bar) */}
      <div className="border-t border-slate-200/80 bg-[#F9FAFB]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>© 2026 CasaLavoroPRO. Tutti i diritti riservati.</p>
          <p className="font-medium text-slate-600">
            Spedizioni rapide in 24/48h con corriere espresso · Pagamenti sicuri
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
