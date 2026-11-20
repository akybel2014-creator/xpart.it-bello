import {
  Bike,
  Car,
  ChevronDown,
  CloudSun,
  Compass,
  Info,
  Loader2,
  RotateCcw,
  Search,
  Snowflake,
  Sun,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AUTO_TABLE_NAME,
  fetchDistinctVehicleBrands,
  fetchVehicleModels,
  fetchVehicleVersions,
  logSupabaseError,
  supabase as defaultSupabase,
} from "@/src/lib/supabaseClient";

/**
 * Tipologie veicolo per il selettore Pneumatici.
 */
export const TYRE_VEHICLE_TABS = [
  { id: "auto", label: "Auto", icon: Car, supabaseTipo: "auto" },
  { id: "suv", label: "4x4 / SUV", icon: Compass, supabaseTipo: "auto" },
  { id: "furgone", label: "Furgone", icon: Truck, supabaseTipo: "camion" },
  { id: "moto", label: "Moto", icon: Bike, supabaseTipo: "moto" },
];

/**
 * Opzioni stagione con icone pulite e accenti cromatici coerenti.
 */
export const TYRE_SEASONS = [
  {
    id: "estive",
    label: "Estive",
    icon: Sun,
    activeClass: "border-orange-500 bg-orange-50 text-orange-800 ring-1 ring-orange-500/20",
    iconActiveClass: "text-orange-500",
  },
  {
    id: "invernali",
    label: "Invernali",
    icon: Snowflake,
    activeClass: "border-[#1E3A8A] bg-[#1E3A8A]/8 text-[#1E3A8A] ring-1 ring-[#1E3A8A]/20",
    iconActiveClass: "text-[#1E3A8A]",
  },
  {
    id: "4stagioni",
    label: "4 Stagioni",
    icon: CloudSun,
    activeClass: "border-sky-600 bg-sky-50 text-sky-900 ring-1 ring-sky-600/20",
    iconActiveClass: "text-sky-600",
  },
];

const CAR_WIDTHS = [
  "155", "165", "175", "185", "195", "205", "215", "225",
  "235", "245", "255", "265", "275", "285", "295", "305", "315",
];
const CAR_HEIGHTS = ["30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80"];
const CAR_DIAMETERS = ["13", "14", "15", "16", "17", "18", "19", "20", "21", "22"];

const MOTO_WIDTHS = [
  "80", "90", "100", "110", "120", "130", "140", "150", "160", "170", "180", "190", "200",
];
const MOTO_HEIGHTS = ["50", "55", "60", "65", "70", "75", "80", "90"];
const MOTO_DIAMETERS = ["10", "12", "13", "14", "15", "16", "17", "18", "19", "21"];

const CAR_TYRE_BRANDS = [
  "Michelin",
  "Pirelli",
  "Continental",
  "Bridgestone",
  "Goodyear",
  "Hankook",
  "Dunlop",
  "Yokohama",
  "BFGoodrich",
  "Falken",
  "Kleber",
  "Kumho",
  "Nexen",
];

const MOTO_TYRE_BRANDS = [
  "Michelin",
  "Pirelli",
  "Metzeler",
  "Bridgestone",
  "Continental",
  "Dunlop",
  "Mitas",
];

/**
 * Fallback locale leggero per la modalità "Per veicolo" se `veicoli_sito` non è raggiungibile.
 */
const FALLBACK_VEHICLES = [
  { tipo: "auto", marca: "Alfa Romeo", modello: "Giulia (952)", motorizzazione: "2.2 JTDm 180 CV" },
  { tipo: "auto", marca: "Audi", modello: "A3 (8V)", motorizzazione: "2.0 TDI 150 CV" },
  { tipo: "auto", marca: "BMW", modello: "Serie 3 (G20)", motorizzazione: "320d 190 CV" },
  { tipo: "auto", marca: "Fiat", modello: "500X (334)", motorizzazione: "1.6 MultiJet 120 CV" },
  { tipo: "auto", marca: "Volkswagen", modello: "Golf VII (5G1)", motorizzazione: "2.0 TDI 150 CV" },
  { tipo: "camion", marca: "Fiat Professional", modello: "Ducato (250)", motorizzazione: "2.3 MultiJet 140 CV" },
  { tipo: "camion", marca: "Iveco", modello: "Daily", motorizzazione: "3.0 F1C 180 CV · 35C" },
  { tipo: "camion", marca: "Mercedes-Benz", modello: "Sprinter (907)", motorizzazione: "315 CDI 150 CV" },
  { tipo: "moto", marca: "BMW Motorrad", modello: "R 1250 GS", motorizzazione: "1254cc Boxer" },
  { tipo: "moto", marca: "Ducati", modello: "Multistrada V4", motorizzazione: "1158cc" },
  { tipo: "moto", marca: "Honda", modello: "SH 150i", motorizzazione: "150cc eSP+" },
  { tipo: "moto", marca: "Yamaha", modello: "TMAX 560", motorizzazione: "562cc" },
];

/**
 * Helper riutilizzabile per interrogare la tabella Supabase `public.parts`
 * applicando i filtri pneumatici scelti nel componente `TyreSelector`.
 */
export async function cercaPneumaticiSuSupabase(
  filtri,
  client = defaultSupabase
) {
  if (!client) {
    return {
      data: [],
      error: new Error("Client Supabase non configurato."),
    };
  }

  let queryBuilder = client
    .from("parts")
    .select("*")
    .ilike("categoria_slug", "%pneumatic%");

  if (filtri.marca && filtri.marca !== "tutti") {
    queryBuilder = queryBuilder.ilike("marca", filtri.marca);
  }

  if (filtri.modalita === "veicolo") {
    if (filtri.marca_veicolo) {
      queryBuilder = queryBuilder.ilike("marca", filtri.marca_veicolo);
    }
    if (filtri.modello_veicolo) {
      queryBuilder = queryBuilder.ilike("modello", `%${filtri.modello_veicolo}%`);
    }
  } else {
    const misura = `${filtri.larghezza}/${filtri.altezza} R${filtri.diametro}`;
    const misuraCompatta = `${filtri.larghezza}/${filtri.altezza}R${filtri.diametro}`;
    queryBuilder = queryBuilder.or(
      `titolo.ilike.%${misura}%,titolo.ilike.%${misuraCompatta}%`
    );
  }

  if (filtri.stagione && filtri.stagione !== "tutte") {
    queryBuilder = queryBuilder.ilike("titolo", `%${filtri.stagione}%`);
  }

  const { data, error } = await queryBuilder.limit(60);
  return { data: data ?? [], error };
}

/**
 * TyreSelector
 * Selettore dedicato alla ricerca Pneumatici per portale B2B automotive.
 * Supporta 4 categorie veicolo (Auto, 4x4/SUV, Furgone, Moto), modalità
 * "Per dimensione" / "Per veicolo", stagione con toggle visivi, produttore
 * e guida interattiva alla lettura della misura stampata sullo pneumatico.
 */
export function TyreSelector({
  initialVeicolo = "auto",
  supabaseClient = defaultSupabase,
  executePartsQuery = false,
  onSearch,
  onReset,
  className = "",
}) {
  // Stato principale selettore pneumatici
  const [veicolo, setVeicolo] = useState(initialVeicolo);
  const [modalita, setModalita] = useState("dimensione"); // "dimensione" | "veicolo"

  // Misure (default standard europeo 205/55 R16 per Auto)
  const [larghezza, setLarghezza] = useState("205");
  const [altezza, setAltezza] = useState("55");
  const [diametro, setDiametro] = useState("16");

  // Stagione e produttore gomma
  const [stagione, setStagione] = useState("estive"); // "estive" | "invernali" | "4stagioni" | "tutte"
  const [marca, setMarca] = useState("tutti");

  // Stato selettori "Per veicolo"
  const [marcaVeicolo, setMarcaVeicolo] = useState("");
  const [modelloVeicolo, setModelloVeicolo] = useState("");
  const [motorizzazioneVeicolo, setMotorizzazioneVeicolo] = useState("");
  const [listaMarcheVeicolo, setListaMarcheVeicolo] = useState([]);
  const [listaModelliVeicolo, setListaModelliVeicolo] = useState([]);
  const [listaMotoriVeicolo, setListaMotoriVeicolo] = useState([]);
  const [loadingVeicoli, setLoadingVeicoli] = useState(false);

  // Stato invio ricerca e tooltip guida
  const [isSearching, setIsSearching] = useState(false);
  const [showGuideDetail, setShowGuideDetail] = useState(false);

  const isMoto = veicolo === "moto";
  const activeTabMeta = useMemo(
    () => TYRE_VEHICLE_TABS.find((t) => t.id === veicolo) ?? TYRE_VEHICLE_TABS[0],
    [veicolo]
  );

  const widthOptions = isMoto ? MOTO_WIDTHS : CAR_WIDTHS;
  const heightOptions = isMoto ? MOTO_HEIGHTS : CAR_HEIGHTS;
  const diameterOptions = isMoto ? MOTO_DIAMETERS : CAR_DIAMETERS;
  const brandOptions = isMoto ? MOTO_TYRE_BRANDS : CAR_TYRE_BRANDS;

  // Cambio tab veicolo: adatta i valori di misura di default se si passa a/da Moto
  const handleVehicleTabChange = (nextVeicolo) => {
    if (nextVeicolo === veicolo) return;
    setVeicolo(nextVeicolo);
    setMarca("tutti");
    setMarcaVeicolo("");
    setModelloVeicolo("");
    setMotorizzazioneVeicolo("");

    if (nextVeicolo === "moto") {
      setLarghezza("120");
      setAltezza("70");
      setDiametro("17");
    } else if (veicolo === "moto") {
      setLarghezza("205");
      setAltezza("55");
      setDiametro("16");
    } else if (nextVeicolo === "suv") {
      setLarghezza("235");
      setAltezza("55");
      setDiametro("18");
    } else if (nextVeicolo === "furgone") {
      setLarghezza("215");
      setAltezza("65");
      setDiametro("16");
    } else {
      setLarghezza("205");
      setAltezza("55");
      setDiametro("16");
    }
  };

  // Carica marche veicolo (`public.vehicles_marche` -> `public.vehicles` per Auto/SUV/Furgone)
  useEffect(() => {
    if (modalita !== "veicolo") return;
    let cancelled = false;

    async function loadVehicleBrands() {
      setLoadingVeicoli(true);
      try {
        if (supabaseClient) {
          if (activeTabMeta.supabaseTipo === "auto") {
            const liveBrands = await fetchDistinctVehicleBrands(supabaseClient);
            if (liveBrands.length > 0) {
              if (!cancelled) setListaMarcheVeicolo(liveBrands);
              return;
            }
          } else {
            const { data, error } = await supabaseClient
              .from("veicoli_sito")
              .select("marca")
              .eq("tipo_veicolo", activeTabMeta.supabaseTipo)
              .eq("attivo", true)
              .order("marca", { ascending: true })
              .limit(1000);

            if (error && error.code !== "PGRST205" && error.code !== "42P01") {
              logSupabaseError("TyreSelector:marche", "veicoli_sito", error);
            }

            if (!error && Array.isArray(data) && data.length > 0) {
              const distinct = Array.from(
                new Set(data.map((r) => r.marca?.trim()).filter(Boolean))
              ).sort((a, b) => a.localeCompare(b, "it"));
              if (!cancelled) {
                setListaMarcheVeicolo(distinct);
                return;
              }
            }
          }
        }

        const fb = Array.from(
          new Set(
            FALLBACK_VEHICLES.filter(
              (v) => v.tipo === activeTabMeta.supabaseTipo
            ).map((v) => v.marca)
          )
        ).sort((a, b) => a.localeCompare(b, "it"));
        if (!cancelled) setListaMarcheVeicolo(fb);
      } catch (err) {
        logSupabaseError(
          "TyreSelector:loadVehicleBrands",
          activeTabMeta.supabaseTipo === "auto" ? AUTO_TABLE_NAME : "veicoli_sito",
          err
        );
        const fb = Array.from(
          new Set(
            FALLBACK_VEHICLES.filter(
              (v) => v.tipo === activeTabMeta.supabaseTipo
            ).map((v) => v.marca)
          )
        ).sort((a, b) => a.localeCompare(b, "it"));
        if (!cancelled) setListaMarcheVeicolo(fb);
      } finally {
        if (!cancelled) setLoadingVeicoli(false);
      }
    }

    loadVehicleBrands();
    return () => {
      cancelled = true;
    };
  }, [modalita, activeTabMeta.supabaseTipo, supabaseClient]);

  // Carica modelli per marca in modalità "Per veicolo"
  useEffect(() => {
    if (modalita !== "veicolo" || !marcaVeicolo) {
      setListaModelliVeicolo([]);
      return;
    }
    let cancelled = false;

    async function loadVehicleModels() {
      try {
        if (supabaseClient) {
          if (activeTabMeta.supabaseTipo === "auto") {
            const liveModels = await fetchVehicleModels(marcaVeicolo, supabaseClient);
            if (liveModels.length > 0) {
              if (!cancelled) setListaModelliVeicolo(liveModels);
              return;
            }
          } else {
            const { data, error } = await supabaseClient
              .from("veicoli_sito")
              .select("modello")
              .eq("tipo_veicolo", activeTabMeta.supabaseTipo)
              .eq("marca", marcaVeicolo)
              .eq("attivo", true)
              .order("modello", { ascending: true })
              .limit(500);

            if (error && error.code !== "PGRST205" && error.code !== "42P01") {
              logSupabaseError("TyreSelector:modelli", "veicoli_sito", error);
            }

            if (!error && Array.isArray(data) && data.length > 0) {
              const distinct = Array.from(
                new Set(data.map((r) => r.modello?.trim()).filter(Boolean))
              ).sort((a, b) => a.localeCompare(b, "it"));
              if (!cancelled) {
                setListaModelliVeicolo(distinct);
                return;
              }
            }
          }
        }

        const fb = Array.from(
          new Set(
            FALLBACK_VEHICLES.filter(
              (v) =>
                v.tipo === activeTabMeta.supabaseTipo &&
                v.marca.toLowerCase() === marcaVeicolo.toLowerCase()
            ).map((v) => v.modello)
          )
        );
        if (!cancelled) setListaModelliVeicolo(fb);
      } catch (err) {
        logSupabaseError(
          "TyreSelector:loadVehicleModels",
          activeTabMeta.supabaseTipo === "auto" ? AUTO_TABLE_NAME : "veicoli_sito",
          err
        );
        if (!cancelled) setListaModelliVeicolo([]);
      }
    }

    loadVehicleModels();
    return () => {
      cancelled = true;
    };
  }, [modalita, activeTabMeta.supabaseTipo, marcaVeicolo, supabaseClient]);

  // Carica motorizzazioni / versioni per marca + modello in modalità "Per veicolo"
  useEffect(() => {
    if (modalita !== "veicolo" || !marcaVeicolo || !modelloVeicolo) {
      setListaMotoriVeicolo([]);
      return;
    }
    let cancelled = false;

    async function loadVehicleEngines() {
      try {
        if (supabaseClient) {
          if (activeTabMeta.supabaseTipo === "auto") {
            const versions = await fetchVehicleVersions(
              marcaVeicolo,
              modelloVeicolo,
              supabaseClient
            );
            if (versions.length > 0) {
              if (!cancelled) {
                setListaMotoriVeicolo(versions.map((v) => v.versione));
              }
              return;
            }
          } else {
            const { data, error } = await supabaseClient
              .from("veicoli_sito")
              .select("motorizzazione")
              .eq("tipo_veicolo", activeTabMeta.supabaseTipo)
              .eq("marca", marcaVeicolo)
              .eq("modello", modelloVeicolo)
              .eq("attivo", true)
              .order("motorizzazione", { ascending: true })
              .limit(300);

            if (error && error.code !== "PGRST205" && error.code !== "42P01") {
              logSupabaseError("TyreSelector:versioni", "veicoli_sito", error);
            }

            if (!error && Array.isArray(data) && data.length > 0) {
              const distinct = Array.from(
                new Set(data.map((r) => r.motorizzazione?.trim()).filter(Boolean))
              );
              if (!cancelled) {
                setListaMotoriVeicolo(distinct);
                return;
              }
            }
          }
        }

        const fb = FALLBACK_VEHICLES.filter(
          (v) =>
            v.tipo === activeTabMeta.supabaseTipo &&
            v.marca.toLowerCase() === marcaVeicolo.toLowerCase() &&
            v.modello.toLowerCase() === modelloVeicolo.toLowerCase()
        ).map((v) => v.motorizzazione);
        if (!cancelled) setListaMotoriVeicolo(fb);
      } catch (err) {
        logSupabaseError(
          "TyreSelector:loadVehicleEngines",
          activeTabMeta.supabaseTipo === "auto" ? AUTO_TABLE_NAME : "veicoli_sito",
          err
        );
        if (!cancelled) setListaMotoriVeicolo([]);
      }
    }

    loadVehicleEngines();
    return () => {
      cancelled = true;
    };
  }, [modalita, activeTabMeta.supabaseTipo, marcaVeicolo, modelloVeicolo, supabaseClient]);

  // Toggle stagione: cliccando la stagione già attiva torna su "tutte"
  const handleSeasonToggle = (seasonId) => {
    setStagione((prev) => (prev === seasonId ? "tutte" : seasonId));
  };

  const handleReset = () => {
    setVeicolo("auto");
    setModalita("dimensione");
    setLarghezza("205");
    setAltezza("55");
    setDiametro("16");
    setStagione("estive");
    setMarca("tutti");
    setMarcaVeicolo("");
    setModelloVeicolo("");
    setMotorizzazioneVeicolo("");
    onReset?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      veicolo,
      modalita,
      larghezza: modalita === "dimensione" ? larghezza : "",
      altezza: modalita === "dimensione" ? altezza : "",
      diametro: modalita === "dimensione" ? diametro : "",
      stagione,
      marca,
      marca_veicolo: modalita === "veicolo" ? marcaVeicolo : "",
      modello_veicolo: modalita === "veicolo" ? modelloVeicolo : "",
      motorizzazione_veicolo: modalita === "veicolo" ? motorizzazioneVeicolo : "",
      misura_formattata:
        modalita === "dimensione"
          ? `${larghezza}/${altezza} R${diametro}`
          : [marcaVeicolo, modelloVeicolo, motorizzazioneVeicolo]
              .filter(Boolean)
              .join(" "),
    };

    if (executePartsQuery && supabaseClient) {
      setIsSearching(true);
      try {
        const res = await cercaPneumaticiSuSupabase(payload, supabaseClient);
        onSearch?.(payload, res);
      } finally {
        setIsSearching(false);
      }
      return;
    }

    onSearch?.(payload);
  };

  const selectClass =
    "h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-9 text-sm font-medium text-slate-900 transition-colors duration-150 hover:border-slate-300 focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25 disabled:cursor-not-allowed disabled:bg-slate-100/80 disabled:text-slate-400 cursor-pointer";

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-[#F9FAFB] shadow-xs ${className}`}
    >
      {/* 1. Barra superiore: Tab Veicolo Pneumatici + Toggle Modalità (Per dimensione / Per veicolo) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-3 py-2.5 sm:px-4 rounded-t-2xl">
        {/* Tab Veicolo: Auto | 4x4 / SUV | Furgone | Moto */}
        <div
          role="tablist"
          aria-label="Tipologia veicolo pneumatici"
          className="flex flex-wrap items-center gap-1.5"
        >
          {TYRE_VEHICLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === veicolo;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleVehicleTabChange(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  active
                    ? "border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-xs"
                    : "border-slate-200/80 bg-[#F9FAFB] text-slate-600 hover:border-slate-300 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active ? "text-white" : "text-slate-500"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toggle Modalità: Per dimensione (default) / Per veicolo */}
        <div
          role="group"
          aria-label="Modalità di ricerca pneumatici"
          className="inline-flex rounded-lg border border-slate-200 bg-[#F9FAFB] p-0.5"
        >
          <button
            type="button"
            onClick={() => setModalita("dimensione")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              modalita === "dimensione"
                ? "bg-white text-[#1E3A8A] shadow-xs ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Per dimensione
          </button>
          <button
            type="button"
            onClick={() => setModalita("veicolo")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              modalita === "veicolo"
                ? "bg-white text-[#1E3A8A] shadow-xs ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Per veicolo
          </button>
        </div>
      </div>

      {/* 2. Form di ricerca Pneumatici */}
      <form onSubmit={handleSubmit} className="p-3.5 sm:p-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
          {/* Colonna principale controlli (8 colonne su desktop) */}
          <div className="space-y-4 lg:col-span-8">
            {/* Riga 1: 3 Selettori Misure OPPURE 3 Selettori Veicolo */}
            {modalita === "dimensione" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Larghezza */}
                <div>
                  <label
                    htmlFor="tyre-width"
                    className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    <span>Larghezza</span>
                    <span className="font-mono text-[10px] font-normal text-slate-400">
                      mm
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      id="tyre-width"
                      aria-label="Larghezza pneumatico"
                      value={larghezza}
                      onChange={(e) => setLarghezza(e.target.value)}
                      className={selectClass}
                    >
                      {widthOptions.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Altezza / Serie */}
                <div>
                  <label
                    htmlFor="tyre-height"
                    className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    <span>Altezza / Serie</span>
                    <span className="font-mono text-[10px] font-normal text-slate-400">
                      %
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      id="tyre-height"
                      aria-label="Altezza o serie pneumatico"
                      value={altezza}
                      onChange={(e) => setAltezza(e.target.value)}
                      className={selectClass}
                    >
                      {heightOptions.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Diametro R */}
                <div>
                  <label
                    htmlFor="tyre-diameter"
                    className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    <span>Diametro (R)</span>
                    <span className="font-mono text-[10px] font-normal text-slate-400">
                      pollici
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      id="tyre-diameter"
                      aria-label="Diametro cerchio R"
                      value={diametro}
                      onChange={(e) => setDiametro(e.target.value)}
                      className={selectClass}
                    >
                      {diameterOptions.map((d) => (
                        <option key={d} value={d}>
                          R{d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            ) : (
              /* Modalità "Per veicolo": 3 selettori a cascata Marca -> Modello -> Motorizzazione */
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="tyre-veh-brand"
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Marca Veicolo
                  </label>
                  <div className="relative">
                    <select
                      id="tyre-veh-brand"
                      value={marcaVeicolo}
                      disabled={loadingVeicoli}
                      onChange={(e) => {
                        setMarcaVeicolo(e.target.value);
                        setModelloVeicolo("");
                        setMotorizzazioneVeicolo("");
                      }}
                      className={selectClass}
                    >
                      <option value="">
                        {loadingVeicoli ? "Caricamento..." : "Seleziona marca"}
                      </option>
                      {listaMarcheVeicolo.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="tyre-veh-model"
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Modello
                  </label>
                  <div className="relative">
                    <select
                      id="tyre-veh-model"
                      value={modelloVeicolo}
                      disabled={!marcaVeicolo}
                      onChange={(e) => {
                        setModelloVeicolo(e.target.value);
                        setMotorizzazioneVeicolo("");
                      }}
                      className={selectClass}
                    >
                      <option value="">
                        {!marcaVeicolo ? "Scegli prima marca" : "Tutti i modelli"}
                      </option>
                      {listaModelliVeicolo.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="tyre-veh-engine"
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Motorizzazione
                  </label>
                  <div className="relative">
                    <select
                      id="tyre-veh-engine"
                      value={motorizzazioneVeicolo}
                      disabled={!modelloVeicolo}
                      onChange={(e) => setMotorizzazioneVeicolo(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">
                        {!modelloVeicolo ? "Scegli prima modello" : "Tutte le versioni"}
                      </option>
                      {listaMotoriVeicolo.map((eng) => (
                        <option key={eng} value={eng}>
                          {eng}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Riga 2: Selettore Stagione (toggle visivi) + Produttore gomma */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
              {/* Toggle Stagione */}
              <div className="sm:col-span-7">
                <span className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <span>Stagione</span>
                  {stagione === "tutte" && (
                    <span className="font-normal normal-case text-slate-400">
                      Tutte le stagioni
                    </span>
                  )}
                </span>
                <div
                  role="group"
                  aria-label="Seleziona stagione pneumatici"
                  className="grid grid-cols-3 gap-2"
                >
                  {TYRE_SEASONS.map((s) => {
                    const Icon = s.icon;
                    const active = stagione === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleSeasonToggle(s.id)}
                        className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                          active
                            ? s.activeClass
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            active ? s.iconActiveClass : "text-slate-400"
                          }`}
                        />
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tendina Produttore / Marca gomma */}
              <div className="sm:col-span-5">
                <label
                  htmlFor="tyre-brand"
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  Produttore Pneumatico
                </label>
                <div className="relative">
                  <select
                    id="tyre-brand"
                    aria-label="Seleziona marca pneumatico"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className={selectClass}
                  >
                    <option value="tutti">Tutti i produttori</option>
                    {brandOptions.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Colonna destra (4 colonne su desktop): Guida visiva lettura gomma + Pulsante CTA */}
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/90 bg-white p-4 lg:col-span-4">
            {/* Guida visiva interattiva: Come leggere la gomma */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Info className="h-3.5 w-3.5 text-[#1E3A8A]" />
                  Come leggere la gomma
                </span>
                <button
                  type="button"
                  onClick={() => setShowGuideDetail((prev) => !prev)}
                  className="text-[11px] font-medium text-[#1E3A8A] hover:underline cursor-pointer"
                >
                  {showGuideDetail ? "Nascondi dettagli" : "Guida rapida"}
                </button>
              </div>

              {/* Mini illustrazione fianco pneumatico con misura live */}
              <div className="mt-2.5 flex items-center gap-3 rounded-lg border border-slate-100 bg-[#F9FAFB] px-3 py-2.5">
                <svg
                  viewBox="0 0 64 64"
                  aria-hidden="true"
                  className="h-12 w-12 shrink-0"
                >
                  <circle cx="32" cy="32" r="29" fill="#1E293B" />
                  <circle
                    cx="32"
                    cy="32"
                    r="23"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  <circle cx="32" cy="32" r="15" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
                  <circle cx="32" cy="32" r="5" fill="#1E3A8A" />
                  <line x1="32" y1="17" x2="32" y2="27" stroke="#64748B" strokeWidth="2" />
                  <line x1="32" y1="37" x2="32" y2="47" stroke="#64748B" strokeWidth="2" />
                  <line x1="17" y1="32" x2="27" y2="32" stroke="#64748B" strokeWidth="2" />
                  <line x1="37" y1="32" x2="47" y2="32" stroke="#64748B" strokeWidth="2" />
                </svg>

                <div className="min-w-0">
                  <div className="font-mono text-base font-bold tracking-tight text-slate-900">
                    <span className="text-[#1E3A8A]">{larghezza}</span>
                    <span className="text-slate-400"> / </span>
                    <span className="text-orange-600">{altezza}</span>
                    <span className="text-slate-400"> </span>
                    <span className="text-slate-900">R{diametro}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    <strong className="font-semibold text-[#1E3A8A]">{larghezza}</strong>{" "}
                    (larghezza) /{" "}
                    <strong className="font-semibold text-orange-600">{altezza}</strong>{" "}
                    (altezza){" "}
                    <strong className="font-semibold text-slate-800">R{diametro}</strong>{" "}
                    (diametro)
                  </p>
                </div>
              </div>

              {showGuideDetail && (
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Trovi questi tre numeri sul fianco dello pneumatico o nella sezione
                  pneumatici ammessi del libretto di circolazione (es.{" "}
                  <span className="font-mono font-medium text-slate-700">205/55 R16</span>).
                </p>
              )}
            </div>

            {/* Pulsante CTA principale + Reset */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleReset}
                title="Ripristina valori pneumatici"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Reset</span>
              </button>
              <button
                type="submit"
                disabled={isSearching}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1E3A8A]/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/40 disabled:opacity-60 cursor-pointer"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>Cerca Pneumatici</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default TyreSelector;
