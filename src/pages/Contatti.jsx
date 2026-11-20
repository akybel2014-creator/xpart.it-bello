import {
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { PageLayout } from "@/src/pages/PageLayout";

/**
 * Pagina Contatti e Assistenza Clienti B2B (`/contatti`).
 * Include form strutturato (Nome, Ragione Sociale, Email, Oggetto, Messaggio)
 * e recapiti operativi di supporto.
 */
export function Contatti() {
  const [searchParams] = useSearchParams();
  const [nome, setNome] = useState("");
  const [ragioneSociale, setRagioneSociale] = useState("");
  const [email, setEmail] = useState("");
  const [oggetto, setOggetto] = useState("Supporto ordine / compatibilità OEM");
  const [messaggio, setMessaggio] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Precompila il messaggio quando si arriva dal pulsante "Richiedi disponibilità" di una card OEM
  useEffect(() => {
    const oem = searchParams.get("oem");
    const marca = searchParams.get("marca");
    const modello = searchParams.get("modello");
    if (!oem) return;

    const veicolo = [marca, modello].filter(Boolean).join(" ");
    setOggetto("Supporto ordine / compatibilità OEM");
    setMessaggio(
      `Buongiorno, desidero verificare disponibilità, prezzo B2B e tempi di spedizione per il ricambio con codice OEM ${oem}${
        veicolo ? ` compatibile con ${veicolo}` : ""
      }.`
    );
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !messaggio.trim()) {
      toast.error("Compila i campi obbligatori (Nome, Email e Messaggio).");
      return;
    }

    setSubmitted(true);
    toast.success("Richiesta inviata. Il supporto B2B risponderà entro 4 ore lavorative.");
  };

  const resetForm = () => {
    setNome("");
    setRagioneSociale("");
    setEmail("");
    setOggetto("Supporto ordine / compatibilità OEM");
    setMessaggio("");
    setSubmitted(false);
  };

  const inputClass =
    "h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25";

  return (
    <PageLayout
      eyebrow="Assistenza Tecnica & Commerciale"
      title="Contatta il Supporto CasaLavoroPRO"
      subtitle="Hai bisogno di verificare la compatibilità di un codice OEM, aprire una pratica di reso o attivare un account fornitore? Scrivi al nostro team dedicato."
      breadcrumbLabel="Contatti"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Colonna sinistra: Form di contatto */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs lg:col-span-7">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16A34A]/10 text-[#16A34A]">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold text-slate-900">
                Messaggio ricevuto correttamente
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                Grazie <strong className="text-slate-800">{nome}</strong>. Abbiamo preso
                in carico la tua richiesta relativa a{" "}
                <strong className="text-slate-800">{oggetto}</strong> e ti risponderemo
                all&apos;indirizzo <span className="font-mono text-xs">{email}</span>.
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                Invia una nuova richiesta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-nome"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Nome e Cognome *
                  </label>
                  <input
                    id="contact-nome"
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Es. Marco Rossi"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-azienda"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Ragione Sociale / Officina
                  </label>
                  <input
                    id="contact-azienda"
                    type="text"
                    value={ragioneSociale}
                    onChange={(e) => setRagioneSociale(e.target.value)}
                    placeholder="Es. Officina Rossi S.r.l."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Email aziendale *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@officinarossi.it"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-oggetto"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Oggetto *
                  </label>
                  <select
                    id="contact-oggetto"
                    value={oggetto}
                    onChange={(e) => setOggetto(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Supporto ordine / compatibilità OEM">
                      Supporto ordine / compatibilità OEM
                    </option>
                    <option value="Richiesta reso o garanzia">
                      Richiesta reso o garanzia
                    </option>
                    <option value="Convenzione Officina B2B">
                      Convenzione Officina B2B
                    </option>
                    <option value="Onboarding Autodemolitore / Fornitore">
                      Onboarding Autodemolitore / Fornitore
                    </option>
                    <option value="Fatturazione e amministrazione">
                      Fatturazione e amministrazione
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-messaggio"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Messaggio *
                </label>
                <textarea
                  id="contact-messaggio"
                  rows={5}
                  required
                  value={messaggio}
                  onChange={(e) => setMessaggio(e.target.value)}
                  placeholder="Indica eventuale numero ordine, codice OEM o numero di telaio (VIN) per ricevere una risposta più rapida..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-slate-400">
                  * Campi obbligatori · Risposta media entro 4 ore lavorative.
                </p>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1E3A8A]/92 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  Invia richiesta
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Colonna destra: Recapiti diretti B2B */}
        <aside className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Recapiti Supporto B2B
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Assistenza tecnica dedicata ad autoriparatori e centri di autodemolizione.
            </p>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />
                <div>
                  <dt className="text-xs font-medium text-slate-400">Email Assistenza</dt>
                  <dd className="font-mono text-xs font-semibold text-slate-900">
                    supporto.automotive@casalavoropro.it
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />
                <div>
                  <dt className="text-xs font-medium text-slate-400">Linea Officine</dt>
                  <dd className="font-mono text-xs font-semibold text-slate-900">
                    +39 02 8974 1200
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />
                <div>
                  <dt className="text-xs font-medium text-slate-400">Orari Operativi</dt>
                  <dd className="text-xs font-medium text-slate-800">
                    Lun – Ven: 08:30 – 18:30 · Sab: 08:30 – 12:30
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />
                <div>
                  <dt className="text-xs font-medium text-slate-400">Sede Operativa</dt>
                  <dd className="text-xs text-slate-700">
                    Via dell&apos;Industria Meccanica 42, 20128 Milano (MI)
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Building2 className="h-4 w-4 text-[#16A34A]" />
              Sei un centro di autodemolizione?
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Per convenzioni commerciali e importazione massiva del tuo gestionale
              magazzino scrivi a{" "}
              <span className="font-mono font-medium text-slate-700">
                partner@casalavoropro.it
              </span>
              .
            </p>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}

export default Contatti;
