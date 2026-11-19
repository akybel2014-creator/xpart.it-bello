import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Cookie,
  FileSpreadsheet,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AUTO_PARTS } from "@/src/data/parts";
import { PageLayout } from "@/src/pages/PageLayout";

/**
 * Pagina Gestione Cookie (`/cookie-policy`).
 */
export function CookiePolicy() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [preferencesEnabled, setPreferencesEnabled] = useState(true);

  const handleSave = () => {
    toast.success("Preferenze cookie salvate correttamente.");
  };

  return (
    <PageLayout
      eyebrow="Trasparenza Tecnica"
      title="Gestione Cookie"
      subtitle="Informativa sull'utilizzo dei cookie tecnici, funzionali e di analisi statistica anonimizzata su CasaLavoroPRO."
      breadcrumbLabel="Cookie Policy"
      updatedAt="Gennaio 2026"
    >
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-[#F9FAFB] p-4">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-[#1E3A8A]" />
          <p className="text-xs leading-relaxed text-slate-600">
            CasaLavoroPRO utilizza esclusivamente cookie strettamente necessari
            all&apos;autenticazione, al carrello B2B e alla sicurezza delle transazioni,
            oltre a eventuali cookie di preferenza e analisi aggregata configurabili qui
            sotto.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Cookie tecnici essenziali
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Necessari per sessione utente, sicurezza CSRF, carrello e checkout.
                Sempre attivi.
              </p>
            </div>
            <span className="rounded-md border border-[#16A34A]/25 bg-[#16A34A]/10 px-2.5 py-1 text-xs font-semibold text-[#15803D]">
              Sempre attivi
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Cookie di preferenza e cache ricerca
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Memorizzano localmente l&apos;elenco marche e gli ultimi filtri veicolo per
                velocizzare la consultazione del catalogo.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferencesEnabled}
              onChange={(e) => setPreferencesEnabled(e.target.checked)}
              aria-label="Attiva cookie di preferenza"
              className="h-4 w-4 accent-[#1E3A8A] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Analisi statistica aggregata
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Ci aiuta a migliorare la velocità di ricerca OEM e l&apos;affidabilità
                della piattaforma senza profilazione pubblicitaria.
              </p>
            </div>
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              aria-label="Attiva analisi statistica aggregata"
              className="h-4 w-4 accent-[#1E3A8A] cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1E3A8A] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1E3A8A]/92 cursor-pointer"
          >
            Salva preferenze
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

/**
 * Pagina Diventa Fornitore (`/diventa-fornitore`).
 */
export function DiventaFornitore() {
  return (
    <PageLayout
      eyebrow="Per Autodemolitori e Ricambisti"
      title="Vendi i tuoi ricambi a migliaia di officine italiane"
      subtitle="Pubblica il tuo magazzino con codici OEM verificati, ricevi ordini pagati in sicurezza e gestisci spedizioni e fatturazione da un unico pannello."
      breadcrumbLabel="Diventa Fornitore"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <Package className="h-5 w-5 text-[#1E3A8A]" />
            <h2 className="mt-3 font-display text-sm font-semibold text-slate-900">
              Caricamento rapido &amp; OEM
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Inserisci ricambi singoli dal Gestionale Venditore oppure sincronizza il
              tuo inventario con codici OEM e compatibilità veicolo.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
            <h2 className="mt-3 font-display text-sm font-semibold text-slate-900">
              Incassi sicuri e tracciati
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Pagamenti verificati tramite gateway certificato e accredito diretto su
              conto aziendale senza insoluti.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <Truck className="h-5 w-5 text-[#1E3A8A]" />
            <h2 className="mt-3 font-display text-sm font-semibold text-slate-900">
              Logistica B2B semplificata
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Spedizioni espresso e pallet gestite con lettere di vettura automatiche e
              tracking condiviso con l&apos;officina.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Pronto a testare il Gestionale Venditore?
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Accedi subito al pannello fornitore oppure contatta il team onboarding per
              attivare il tuo centro di autodemolizione.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/pannello-fornitore"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1E3A8A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1E3A8A]/90"
            >
              Apri Pannello Fornitore
            </Link>
            <Link
              to="/contatti"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Richiedi convenzione
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/**
 * Pagina Officine B2B (`/officine-b2b`).
 */
export function OfficineB2B() {
  return (
    <PageLayout
      eyebrow="Programma Partite IVA & Autoriparatori"
      title="Condizioni e vantaggi dedicati alle Officine B2B"
      subtitle="Listini netti trasparenti, fatturazione elettronica immediata, spedizioni combinate e priorità nella ricerca di componenti rari."
      breadcrumbLabel="Officine B2B"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            {
              icon: FileSpreadsheet,
              title: "Fatturazione elettronica automatica",
              desc: "Inserisci una sola volta P.IVA e Codice SDI: ogni ordine genera automaticamente la documentazione fiscale corretta.",
            },
            {
              icon: Truck,
              title: "Spedizione gratuita sopra €600 netti",
              desc: "Consegna espressa 24/48h direttamente in officina con imballaggio protettivo per meccanica, elettronica e carrozzeria.",
            },
            {
              icon: Building2,
              title: "Preventivi multi-fornitore",
              desc: "Richiedi disponibilità e verifica compatibilità VIN direttamente ai demolitori verificati dal catalogo.",
            },
            {
              icon: CheckCircle2,
              title: "Garanzia chiara e reso 14 giorni",
              desc: "Protezione sugli acquisti professionali con sostituzione rapida in caso di non conformità.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-start gap-3.5 rounded-xl border border-slate-100 bg-[#F9FAFB] p-4"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#1E3A8A]" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
          <Link
            to="/catalogo"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1E3A8A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1E3A8A]/90"
          >
            Esplora il Catalogo B2B
          </Link>
          <Link
            to="/garanzia-e-resi"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Consulta Garanzia e Resi
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

/**
 * Pagina Directory Centri Autodemolizione Verificati (`/demolitori`).
 */
export function DirectoryDemolitori() {
  const uniqueSellers = Array.from(
    new Map(AUTO_PARTS.map((p) => [p.seller.name, p.seller])).values()
  );

  return (
    <PageLayout
      eyebrow="Rete Nazionale Partner"
      title="Centri di Autodemolizione Verificati"
      subtitle="Tutti i fornitori presenti su CasaLavoroPRO sono sottoposti a verifica documentale, controllo autorizzazioni ambientali e monitoraggio continuo sui tempi di spedizione."
      breadcrumbLabel="Demolitori Verificati"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {uniqueSellers.map((seller) => (
          <div
            key={seller.name}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-base font-semibold text-slate-900">
                  {seller.name}
                </h2>
                {seller.verified && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#16A34A]/25 bg-[#16A34A]/10 px-2 py-0.5 text-[11px] font-semibold text-[#15803D]">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verificato
                  </span>
                )}
              </div>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {seller.city} · Evasione {seller.dispatchHours}h · Rating {seller.rating}/5
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">
                Fatturazione elettronica B2B attiva
              </span>
              <Link
                to="/catalogo"
                className="text-xs font-semibold text-[#1E3A8A] hover:underline"
              >
                Vedi ricambi →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}

/**
 * Pagina Marche e Modelli Supportati (`/marche`).
 */
export function MarcheSupportate() {
  const groups = [
    {
      title: "Auto",
      brands: [
        "Alfa Romeo", "Audi", "BMW", "Citroën", "Dacia", "Fiat", "Ford",
        "Hyundai", "Jeep", "Kia", "Lancia", "Mercedes-Benz", "Nissan",
        "Opel", "Peugeot", "Renault", "Seat", "Skoda", "Toyota", "Volkswagen", "Volvo",
      ],
    },
    {
      title: "Moto & Scooter",
      brands: [
        "Aprilia", "BMW Motorrad", "Ducati", "Honda", "Kawasaki",
        "KTM", "Kymco", "Piaggio", "Suzuki", "SYM", "Triumph", "Yamaha",
      ],
    },
    {
      title: "Camion & Veicoli Industriali",
      brands: [
        "DAF", "Fiat Professional", "Iveco", "MAN",
        "Mercedes-Benz Trucks", "Renault Trucks", "Scania", "Volvo Trucks",
      ],
    },
  ];

  return (
    <PageLayout
      eyebrow="Copertura Parco Circolante"
      title="Marche e Modelli Supportati"
      subtitle="Il database veicoli CasaLavoroPRO copre i principali costruttori europei e asiatici per autovetture, motoveicoli e mezzi industriali."
      breadcrumbLabel="Marche e Modelli"
    >
      <div className="space-y-6">
        {groups.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
          >
            <h2 className="font-display text-base font-semibold text-slate-900">
              {group.title}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.brands.map((brand) => (
                <Link
                  key={brand}
                  to="/ricerca"
                  className="rounded-lg border border-slate-200 bg-[#F9FAFB] px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#1E3A8A]/40 hover:bg-white hover:text-[#1E3A8A]"
                >
                  {brand}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
