import {
  Bike,
  Car,
  ChevronDown,
  Loader2,
  RotateCcw,
  Search,
  Truck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CategorySelector } from "@/src/components/CategorySelector";
import {
  AUTO_TABLE_NAME,
  VEHICLES_BRANDS_VIEW,
  fetchDistinctVehicleBrands,
  fetchVehicleModels,
  fetchVehicleVersions,
  logSupabaseError,
  supabase as defaultSupabase,
} from "@/src/lib/supabaseClient";
import { normalizeOemCode } from "@/src/services/oemCatalogService";
import {
  normalizeVinInput,
  parseAndValidateVin,
  resolveBrandFromWmi,
  VIN_LENGTH,
} from "@/src/services/vinService";

/**
 * Configurazione dei 3 tab veicolo.
 * Mantiene sempre la struttura compatta a 3 selettori a cascata, adattando
 * etichette, placeholder e testo del pulsante CTA al tipo di veicolo attivo.
 */
export const VEHICLE_TABS = [
  {
    id: "auto",
    label: "Auto",
    shortLabel: "Auto",
    icon: Car,
    queryPlaceholder: "Codice OEM, pezzo o motore...",
    brandLabel: "Marca",
    brandPlaceholder: "Tutte le marche",
    modelLabel: "Modello",
    modelPlaceholder: "Tutti i modelli",
    modelDisabledPlaceholder: "Modello (scegli marca)",
    engineLabel: "Motorizzazione",
    enginePlaceholder: "Tutte le motorizzazioni",
    engineDisabledPlaceholder: "Motorizzazione (scegli modello)",
    categoryPlaceholder: "Tutte le categorie Auto",
    ctaLabel: "Cerca ricambi Auto",
  },
  {
    id: "moto",
    label: "Moto & Scooter",
    shortLabel: "Moto",
    icon: Bike,
    queryPlaceholder: "Codice ricambio, telaio o sigla motore...",
    brandLabel: "Marca Moto",
    brandPlaceholder: "Tutte le marche moto",
    modelLabel: "Modello",
    modelPlaceholder: "Tutti i modelli",
    modelDisabledPlaceholder: "Modello (scegli marca)",
    engineLabel: "Cilindrata / Versione",
    enginePlaceholder: "Tutte le cilindrate / versioni",
    engineDisabledPlaceholder: "Cilindrata / Versione (scegli modello)",
    categoryPlaceholder: "Tutte le categorie Moto",
    ctaLabel: "Cerca ricambi Moto",
  },
  {
    id: "camion",
    label: "Camion & Veicoli Industriali",
    shortLabel: "Camion",
    icon: Truck,
    queryPlaceholder: "Codice OEM, VIN/Telaio o matricola motore...",
    brandLabel: "Costruttore",
    brandPlaceholder: "Tutti i costruttori",
    modelLabel: "Gamma / Modello",
    modelPlaceholder: "Tutte le gamme / modelli",
    modelDisabledPlaceholder: "Gamma / Modello (scegli costruttore)",
    engineLabel: "Motore / Configurazione",
    enginePlaceholder: "Tutti i motori / configurazioni",
    engineDisabledPlaceholder: "Motore / Config. (scegli modello)",
    categoryPlaceholder: "Tutte le categorie Camion",
    ctaLabel: "Cerca ricambi Camion",
  },
];

/**
 * Dataset locale di riserva utilizzato esclusivamente se Supabase non è configurato
 * o se la tabella `public.veicoli_sito` non restituisce ancora righe.
 */
const FALLBACK_VEICOLI_SITO = [
  // AUTO
  { id: "fb-auto-1", tipo_veicolo: "auto", marca: "Alfa Romeo", modello: "Giulia (952)", motorizzazione: "2.2 JTDm 180 CV · Cod. 55268532" },
  { id: "fb-auto-2", tipo_veicolo: "auto", marca: "Alfa Romeo", modello: "Giulietta (940)", motorizzazione: "1.6 JTDm 120 CV · Cod. 55280444" },
  { id: "fb-auto-3", tipo_veicolo: "auto", marca: "Audi", modello: "A3 (8V)", motorizzazione: "2.0 TDI 150 CV · Cod. CRLB" },
  { id: "fb-auto-4", tipo_veicolo: "auto", marca: "Audi", modello: "A4 (B9)", motorizzazione: "2.0 TDI 190 CV · Cod. DETA" },
  { id: "fb-auto-5", tipo_veicolo: "auto", marca: "BMW", modello: "Serie 3 (G20)", motorizzazione: "320d 190 CV · Cod. B47D20" },
  { id: "fb-auto-6", tipo_veicolo: "auto", marca: "Fiat", modello: "500X (334)", motorizzazione: "1.6 MultiJet 120 CV · Cod. 55260384" },
  { id: "fb-auto-7", tipo_veicolo: "auto", marca: "Fiat", modello: "Panda (319)", motorizzazione: "1.3 MultiJet 95 CV · Cod. 330A1000" },
  { id: "fb-auto-8", tipo_veicolo: "auto", marca: "Mercedes-Benz", modello: "Classe A (W177)", motorizzazione: "A 180 d 116 CV · Cod. OM608" },
  { id: "fb-auto-9", tipo_veicolo: "auto", marca: "Volkswagen", modello: "Golf VII (5G1)", motorizzazione: "2.0 TDI 150 CV · Cod. CRLB" },
  { id: "fb-auto-10", tipo_veicolo: "auto", marca: "Volkswagen", modello: "Golf VII (5G1)", motorizzazione: "1.6 TDI 115 CV · Cod. DDYA" },

  // MOTO & SCOOTER
  { id: "fb-moto-1", tipo_veicolo: "moto", marca: "Aprilia", modello: "RS 660", motorizzazione: "659cc · 100 CV (2021-2025)" },
  { id: "fb-moto-2", tipo_veicolo: "moto", marca: "BMW Motorrad", modello: "R 1250 GS", motorizzazione: "1254cc Boxer · ShiftCam (2019-2024)" },
  { id: "fb-moto-3", tipo_veicolo: "moto", marca: "Ducati", modello: "Multistrada V4", motorizzazione: "1158cc · Granturismo 170 CV" },
  { id: "fb-moto-4", tipo_veicolo: "moto", marca: "Honda", modello: "SH 150i", motorizzazione: "150cc · eSP+ ABS (2020-2025)" },
  { id: "fb-moto-5", tipo_veicolo: "moto", marca: "Honda", modello: "CB 500 X", motorizzazione: "471cc · Bicilindrico Euro 5" },
  { id: "fb-moto-6", tipo_veicolo: "moto", marca: "KTM", modello: "790 Duke", motorizzazione: "799cc · LC8c 105 CV" },
  { id: "fb-moto-7", tipo_veicolo: "moto", marca: "Kymco", modello: "Agility 125 R16", motorizzazione: "125cc · 4T Euro 5" },
  { id: "fb-moto-8", tipo_veicolo: "moto", marca: "Piaggio", modello: "Beverly 300 HPE", motorizzazione: "278cc · HPE Euro 5 (2021-2025)" },
  { id: "fb-moto-9", tipo_veicolo: "moto", marca: "Piaggio", modello: "Vespa GTS 300", motorizzazione: "278cc · SuperTech HPE" },
  { id: "fb-moto-10", tipo_veicolo: "moto", marca: "SYM", modello: "Symphony ST 125", motorizzazione: "125cc · Raffreddamento liquido" },
  { id: "fb-moto-11", tipo_veicolo: "moto", marca: "Yamaha", modello: "TMAX 560", motorizzazione: "562cc · Tech MAX (2020-2025)" },
  { id: "fb-moto-12", tipo_veicolo: "moto", marca: "Yamaha", modello: "MT-07", motorizzazione: "689cc · CP2 Euro 5" },

  // CAMION & VEICOLI INDUSTRIALI
  { id: "fb-camion-1", tipo_veicolo: "camion", marca: "DAF", modello: "XF / XG", motorizzazione: "MX-13 480 CV · 4x2 Trattore" },
  { id: "fb-camion-2", tipo_veicolo: "camion", marca: "Iveco", modello: "Daily", motorizzazione: "3.0 F1C 180 CV · 35C Ruota Gemellata" },
  { id: "fb-camion-3", tipo_veicolo: "camion", marca: "Iveco", modello: "Eurocargo", motorizzazione: "Tector 7 250 CV · 4x2 Motrice 120E" },
  { id: "fb-camion-4", tipo_veicolo: "camion", marca: "Iveco", modello: "S-Way / Stralis", motorizzazione: "Cursor 13 490 CV · 4x2 Trattore" },
  { id: "fb-camion-5", tipo_veicolo: "camion", marca: "Iveco", modello: "T-Way / Trakker", motorizzazione: "Cursor 13 510 CV · 8x4 Ribaltabile/Cava" },
  { id: "fb-camion-6", tipo_veicolo: "camion", marca: "MAN", modello: "TGX", motorizzazione: "D2676 510 CV · 4x2 Trattore" },
  { id: "fb-camion-7", tipo_veicolo: "camion", marca: "Mercedes-Benz", modello: "Actros MP5", motorizzazione: "OM471 480 CV · 4x2 Trattore" },
  { id: "fb-camion-8", tipo_veicolo: "camion", marca: "Mercedes-Benz", modello: "Arocs", motorizzazione: "OM473 530 CV · 8x4 Cava/Cantiere" },
  { id: "fb-camion-9", tipo_veicolo: "camion", marca: "Renault Trucks", modello: "T High", motorizzazione: "DTI 13 480 CV · 4x2 Trattore" },
  { id: "fb-camion-10", tipo_veicolo: "camion", marca: "Scania", modello: "R / S Series", motorizzazione: "DC13 500 CV · 6x2 Motrice" },
  { id: "fb-camion-11", tipo_veicolo: "camion", marca: "Volvo Trucks", modello: "FH", motorizzazione: "D13K 500 CV · 4x2 Trattore I-Shift" },
];

// Cache in memoria per rendere istantaneo il cambio tab/marca/modello
const cacheMarche = new Map();
const cacheModelli = new Map();
const cacheMotorizzazioni = new Map();

/**
 * Funzione di query riutilizzabile per filtrare la tabella Supabase `public.parts`
 * partendo dall'oggetto restituito da `VehicleSearchBox`.
 */
export async function cercaRicambiPartsSuSupabase(
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
    .eq("tipo_veicolo", filtri.tipo_veicolo || "auto");

  if (filtri.marca) {
    queryBuilder = queryBuilder.ilike("marca", filtri.marca);
  }
  if (filtri.modello) {
    queryBuilder = queryBuilder.ilike("modello", `%${filtri.modello}%`);
  }
  if (filtri.veicolo_id && !String(filtri.veicolo_id).startsWith("fb-")) {
    queryBuilder = queryBuilder.eq("veicolo_id", filtri.veicolo_id);
  } else if (filtri.motorizzazione) {
    queryBuilder = queryBuilder.ilike(
      "motorizzazione",
      `%${filtri.motorizzazione}%`
    );
  }
  if (filtri.categoria_id) {
    queryBuilder = queryBuilder.eq("categoria_id", filtri.categoria_id);
  }

  const testoPulito = (filtri.query || "").trim();
  if (testoPulito) {
    const oemNormalizzato = normalizeOemCode(testoPulito);
    const condizioni = [`titolo.ilike.%${testoPulito}%`];
    if (oemNormalizzato.length >= 2) {
      condizioni.push(`codice_oe.ilike.%${oemNormalizzato}%`);
    }
    queryBuilder = queryBuilder.or(condizioni.join(","));
  }

  const { data, error } = await queryBuilder.limit(60);
  return { data: data ?? [], error };
}

/**
 * VehicleSearchBox
 * Componente modulare di ricerca veicoli a 3 selettori a cascata sempre compatti
 * collegato a `public.veicoli_sito` e `public.categorie_sito` su Supabase.
 *
 * Restituisce sempre al padre:
 * { tipo_veicolo, marca, modello, motorizzazione, veicolo_id, query, categoria_id, categoria_slug, categoria_nome }
 */
export function VehicleSearchBox({
  initialTipoVeicolo = "auto",
  query: controlledQuery,
  isOemSearching = false,
  executePartsQuery = false,
  supabaseClient = defaultSupabase,
  onChange,
  onSearch,
  onReset,
  className = "",
}) {
  // Stato principale della ricerca
  const [tipoVeicolo, setTipoVeicolo] = useState(initialTipoVeicolo);
  const [internalQuery, setInternalQuery] = useState(controlledQuery ?? "");
  const [vinValue, setVinValue] = useState("");
  const [marca, setMarca] = useState("");
  const [modello, setModello] = useState("");
  const [veicoloId, setVeicoloId] = useState("");
  const [motorizzazione, setMotorizzazione] = useState("");
  const [selectedCategoriaObj, setSelectedCategoriaObj] = useState(null);
  const lastAutoAppliedVinRef = useRef("");

  // Opzioni caricate da Supabase (`public.veicoli_sito` / fallback `public.vehicles`)
  const [marche, setMarche] = useState([]);
  const [modelli, setModelli] = useState([]);
  const [motorizzazioni, setMotorizzazioni] = useState([]);

  // Stati di caricamento discreti per ciascuna tendina
  const [loadingMarche, setLoadingMarche] = useState(true);
  const [loadingModelli, setLoadingModelli] = useState(false);
  const [loadingMotorizzazioni, setLoadingMotorizzazioni] = useState(false);
  const [searchingParts, setSearchingParts] = useState(false);

  // Validazione e scomposizione VIN (WMI / VDS / VIS) lato client
  const parsedVin = useMemo(() => parseAndValidateVin(vinValue), [vinValue]);
  const vinMatchedBrand = useMemo(
    () =>
      parsedVin.isValid
        ? resolveBrandFromWmi(parsedVin.mappedBrand, marche)
        : null,
    [parsedVin.isValid, parsedVin.mappedBrand, marche]
  );

  // Sincronizza l'input testo se il componente padre modifica `query` dall'esterno
  // (es. click su un cross-reference OEM o pulsante Chiudi risultati OEM)
  useEffect(() => {
    if (controlledQuery !== undefined) {
      setInternalQuery(controlledQuery);
    }
  }, [controlledQuery]);

  const queryValue = controlledQuery !== undefined ? controlledQuery : internalQuery;

  const activeTab = useMemo(
    () => VEHICLE_TABS.find((tab) => tab.id === tipoVeicolo) ?? VEHICLE_TABS[0],
    [tipoVeicolo]
  );

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Costruisce il payload standardizzato da passare al componente padre
  const buildPayload = useCallback(
    (overrides = {}) => {
      const catObj =
        overrides.categoriaObj !== undefined
          ? overrides.categoriaObj
          : selectedCategoriaObj;
      const nextVin =
        overrides.vin !== undefined ? overrides.vin : parsedVin.normalized;
      const nextVinInfo =
        overrides.vin !== undefined ? parseAndValidateVin(overrides.vin) : parsedVin;

      return {
        tipo_veicolo: overrides.tipo_veicolo ?? tipoVeicolo,
        marca: overrides.marca !== undefined ? overrides.marca : marca,
        modello: overrides.modello !== undefined ? overrides.modello : modello,
        motorizzazione:
          overrides.motorizzazione !== undefined
            ? overrides.motorizzazione
            : motorizzazione,
        veicolo_id:
          overrides.veicolo_id !== undefined ? overrides.veicolo_id : veicoloId,
        query: overrides.query !== undefined ? overrides.query : queryValue,
        vin: nextVinInfo.isValid ? nextVin : "",
        vin_wmi: nextVinInfo.isValid ? nextVinInfo.wmi : "",
        categoria_id: catObj ? catObj.id : "",
        categoria_slug: catObj ? catObj.slug ?? "" : "",
        categoria_nome: catObj ? catObj.nome ?? "" : "",
      };
    },
    [
      tipoVeicolo,
      marca,
      modello,
      motorizzazione,
      veicoloId,
      queryValue,
      selectedCategoriaObj,
      parsedVin,
    ]
  );

  const notifyParentChange = useCallback(
    (overrides = {}) => {
      onChangeRef.current?.(buildPayload(overrides));
    },
    [buildPayload]
  );

  // Preselezione automatica della Marca quando il VIN valido (17 caratteri) viene riconosciuto su `public.vehicles_marche` / `public.vehicles`
  useEffect(() => {
    if (!parsedVin.isValid) {
      lastAutoAppliedVinRef.current = "";
      return;
    }
    if (!vinMatchedBrand) return;
    if (lastAutoAppliedVinRef.current === parsedVin.normalized) return;

    lastAutoAppliedVinRef.current = parsedVin.normalized;
    if (marca !== vinMatchedBrand) {
      setMarca(vinMatchedBrand);
      setModello("");
      setMotorizzazione("");
      setVeicoloId("");
      notifyParentChange({
        marca: vinMatchedBrand,
        modello: "",
        motorizzazione: "",
        veicolo_id: "",
        vin: parsedVin.normalized,
      });
    } else {
      notifyParentChange({ vin: parsedVin.normalized });
    }
  }, [parsedVin.isValid, parsedVin.normalized, vinMatchedBrand, marca, notifyParentChange]);

  // ---------------------------------------------------------------------------
  // 1. FETCH MARCHE DISTINTE (`public.vehicles_marche` -> `public.vehicles` per Auto,
  //    `public.veicoli_sito` per Moto/Camion)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadMarche() {
      const cached = cacheMarche.get(tipoVeicolo);
      if (cached) {
        setMarche(cached);
        setLoadingMarche(false);
        return;
      }

      setLoadingMarche(true);
      setMarche([]);

      try {
        if (!supabaseClient) {
          console.warn(
            "[Supabase][VehicleSearchBox] Client Supabase non configurato: uso elenco veicoli locale di fallback."
          );
        } else if (tipoVeicolo === "auto") {
          // Usa la vista ottimizzata `public.vehicles_marche` (1 query) con fallback automatico su `public.vehicles`
          const liveBrands = await fetchDistinctVehicleBrands(supabaseClient);
          if (liveBrands.length > 0) {
            cacheMarche.set(tipoVeicolo, liveBrands);
            if (!cancelled) setMarche(liveBrands);
            return;
          }
        } else {
          // Moto & Camion: interroga `public.veicoli_sito` se disponibile
          const { data: probeData, error: probeError } = await supabaseClient
            .from("veicoli_sito")
            .select("marca")
            .eq("tipo_veicolo", tipoVeicolo)
            .eq("attivo", true)
            .limit(1);

          if (probeError && probeError.code !== "PGRST205" && probeError.code !== "42P01") {
            logSupabaseError(`VehicleSearchBox:marche(${tipoVeicolo})`, "veicoli_sito", probeError);
          }

          if (!probeError && Array.isArray(probeData) && probeData.length > 0) {
            const brandSet = new Set();
            const pageSize = 1000;
            let offset = 0;

            while (true) {
              const { data, error } = await supabaseClient
                .from("veicoli_sito")
                .select("marca")
                .eq("tipo_veicolo", tipoVeicolo)
                .eq("attivo", true)
                .order("marca", { ascending: true })
                .range(offset, offset + pageSize - 1);

              if (error) {
                logSupabaseError(`VehicleSearchBox:marche(${tipoVeicolo})`, "veicoli_sito", error);
                throw error;
              }

              const rows = data ?? [];
              for (const row of rows) {
                const name = row.marca?.trim();
                if (name) brandSet.add(name);
              }

              if (rows.length < pageSize) break;
              offset += pageSize;
            }

            if (brandSet.size > 0) {
              const sorted = Array.from(brandSet).sort((a, b) =>
                a.localeCompare(b, "it")
              );
              cacheMarche.set(tipoVeicolo, sorted);
              if (!cancelled) setMarche(sorted);
              return;
            }
          }
        }

        // Fallback pulito se Supabase non è configurato o la tabella per moto/camion non esiste ancora
        const fallback = Array.from(
          new Set(
            FALLBACK_VEICOLI_SITO.filter(
              (v) => v.tipo_veicolo === tipoVeicolo
            ).map((v) => v.marca)
          )
        ).sort((a, b) => a.localeCompare(b, "it"));

        if (!cancelled) setMarche(fallback);
      } catch (err) {
        logSupabaseError(
          `VehicleSearchBox:loadMarche(${tipoVeicolo})`,
          tipoVeicolo === "auto" ? VEHICLES_BRANDS_VIEW : "veicoli_sito",
          err
        );
        const fallback = Array.from(
          new Set(
            FALLBACK_VEICOLI_SITO.filter(
              (v) => v.tipo_veicolo === tipoVeicolo
            ).map((v) => v.marca)
          )
        ).sort((a, b) => a.localeCompare(b, "it"));
        if (!cancelled) setMarche(fallback);
      } finally {
        if (!cancelled) setLoadingMarche(false);
      }
    }

    loadMarche();
    return () => {
      cancelled = true;
    };
  }, [tipoVeicolo, supabaseClient]);

  // ---------------------------------------------------------------------------
  // 2. FETCH MODELLI DISTINTI (`public.vehicles` per Auto, `public.veicoli_sito` per Moto/Camion)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!marca) {
      setModelli([]);
      setLoadingModelli(false);
      return;
    }

    let cancelled = false;
    const cacheKey = `${tipoVeicolo}::${marca}`;

    async function loadModelli() {
      const cached = cacheModelli.get(cacheKey);
      if (cached) {
        setModelli(cached);
        setLoadingModelli(false);
        return;
      }

      setLoadingModelli(true);
      setModelli([]);

      try {
        if (supabaseClient) {
          if (tipoVeicolo === "auto") {
            const liveModels = await fetchVehicleModels(marca, supabaseClient);
            if (liveModels.length > 0) {
              cacheModelli.set(cacheKey, liveModels);
              if (!cancelled) setModelli(liveModels);
              return;
            }
          } else {
            const { data: probeModel, error: probeModelErr } = await supabaseClient
              .from("veicoli_sito")
              .select("modello")
              .eq("tipo_veicolo", tipoVeicolo)
              .eq("marca", marca)
              .eq("attivo", true)
              .limit(1);

            if (probeModelErr && probeModelErr.code !== "PGRST205" && probeModelErr.code !== "42P01") {
              logSupabaseError(`VehicleSearchBox:modelli(${tipoVeicolo})`, "veicoli_sito", probeModelErr);
            }

            if (!probeModelErr && Array.isArray(probeModel) && probeModel.length > 0) {
              const modelSet = new Set();
              const pageSize = 1000;
              let offset = 0;

              while (true) {
                const { data, error } = await supabaseClient
                  .from("veicoli_sito")
                  .select("modello")
                  .eq("tipo_veicolo", tipoVeicolo)
                  .eq("marca", marca)
                  .eq("attivo", true)
                  .order("modello", { ascending: true })
                  .range(offset, offset + pageSize - 1);

                if (error) {
                  logSupabaseError(`VehicleSearchBox:modelli(${tipoVeicolo})`, "veicoli_sito", error);
                  throw error;
                }

                const rows = data ?? [];
                for (const row of rows) {
                  const name = row.modello?.trim();
                  if (name) modelSet.add(name);
                }

                if (rows.length < pageSize) break;
                offset += pageSize;
              }

              if (modelSet.size > 0) {
                const sorted = Array.from(modelSet).sort((a, b) =>
                  a.localeCompare(b, "it")
                );
                cacheModelli.set(cacheKey, sorted);
                if (!cancelled) setModelli(sorted);
                return;
              }
            }
          }
        }

        const fallback = Array.from(
          new Set(
            FALLBACK_VEICOLI_SITO.filter(
              (v) =>
                v.tipo_veicolo === tipoVeicolo &&
                v.marca.toLowerCase() === marca.toLowerCase()
            ).map((v) => v.modello)
          )
        ).sort((a, b) => a.localeCompare(b, "it"));

        if (!cancelled) setModelli(fallback);
      } catch (err) {
        logSupabaseError(
          `VehicleSearchBox:loadModelli(${tipoVeicolo}, ${marca})`,
          tipoVeicolo === "auto" ? AUTO_TABLE_NAME : "veicoli_sito",
          err
        );
        const fallback = Array.from(
          new Set(
            FALLBACK_VEICOLI_SITO.filter(
              (v) =>
                v.tipo_veicolo === tipoVeicolo &&
                v.marca.toLowerCase() === marca.toLowerCase()
            ).map((v) => v.modello)
          )
        ).sort((a, b) => a.localeCompare(b, "it"));
        if (!cancelled) setModelli(fallback);
      } finally {
        if (!cancelled) setLoadingModelli(false);
      }
    }

    loadModelli();
    return () => {
      cancelled = true;
    };
  }, [tipoVeicolo, marca, supabaseClient]);

  // ---------------------------------------------------------------------------
  // 3. FETCH MOTORIZZAZIONI / VERSIONI (`public.vehicles` per Auto, `public.veicoli_sito` per Moto/Camion)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!marca || !modello) {
      setMotorizzazioni([]);
      setLoadingMotorizzazioni(false);
      return;
    }

    let cancelled = false;
    const cacheKey = `${tipoVeicolo}::${marca}::${modello}`;

    async function loadMotorizzazioni() {
      const cached = cacheMotorizzazioni.get(cacheKey);
      if (cached) {
        setMotorizzazioni(cached);
        setLoadingMotorizzazioni(false);
        return;
      }

      setLoadingMotorizzazioni(true);
      setMotorizzazioni([]);

      try {
        if (supabaseClient) {
          if (tipoVeicolo === "auto") {
            const versions = await fetchVehicleVersions(marca, modello, supabaseClient);
            if (versions.length > 0) {
              const mapped = versions.map((v) => ({
                id: v.id,
                motorizzazione: v.versione,
              }));
              cacheMotorizzazioni.set(cacheKey, mapped);
              if (!cancelled) setMotorizzazioni(mapped);
              return;
            }
          } else {
            const { data, error } = await supabaseClient
              .from("veicoli_sito")
              .select("id, motorizzazione")
              .eq("tipo_veicolo", tipoVeicolo)
              .eq("marca", marca)
              .eq("modello", modello)
              .eq("attivo", true)
              .order("motorizzazione", { ascending: true })
              .limit(500);

            if (error && error.code !== "PGRST205" && error.code !== "42P01") {
              logSupabaseError(`VehicleSearchBox:motorizzazioni(${tipoVeicolo})`, "veicoli_sito", error);
            }

            if (!error && Array.isArray(data) && data.length > 0) {
              const deduped = new Map();
              for (const row of data) {
                const label = row.motorizzazione?.trim();
                if (label && !deduped.has(label)) {
                  deduped.set(label, { id: row.id, motorizzazione: label });
                }
              }

              if (deduped.size > 0) {
                const sorted = Array.from(deduped.values()).sort((a, b) =>
                  a.motorizzazione.localeCompare(b.motorizzazione, "it")
                );
                cacheMotorizzazioni.set(cacheKey, sorted);
                if (!cancelled) setMotorizzazioni(sorted);
                return;
              }
            }
          }
        }

        const fallback = FALLBACK_VEICOLI_SITO.filter(
          (v) =>
            v.tipo_veicolo === tipoVeicolo &&
            v.marca.toLowerCase() === marca.toLowerCase() &&
            v.modello.toLowerCase() === modello.toLowerCase()
        ).map((v) => ({ id: v.id, motorizzazione: v.motorizzazione }));

        if (!cancelled) setMotorizzazioni(fallback);
      } catch (err) {
        logSupabaseError(
          `VehicleSearchBox:loadMotorizzazioni(${tipoVeicolo}, ${marca}, ${modello})`,
          tipoVeicolo === "auto" ? AUTO_TABLE_NAME : "veicoli_sito",
          err
        );
        const fallback = FALLBACK_VEICOLI_SITO.filter(
          (v) =>
            v.tipo_veicolo === tipoVeicolo &&
            v.marca.toLowerCase() === marca.toLowerCase() &&
            v.modello.toLowerCase() === modello.toLowerCase()
        ).map((v) => ({ id: v.id, motorizzazione: v.motorizzazione }));
        if (!cancelled) setMotorizzazioni(fallback);
      } finally {
        if (!cancelled) setLoadingMotorizzazioni(false);
      }
    }

    loadMotorizzazioni();
    return () => {
      cancelled = true;
    };
  }, [tipoVeicolo, marca, modello, supabaseClient]);

  // ---------------------------------------------------------------------------
  // HANDLER INTERAZIONI UTENTE
  // ---------------------------------------------------------------------------

  // Cambio tab: azzera i 3 selettori a cascata + categoria + VIN e ricarica le marche del nuovo tipo_veicolo
  const handleSelectTab = (nextTipo) => {
    if (nextTipo === tipoVeicolo) return;
    setTipoVeicolo(nextTipo);
    setVinValue("");
    lastAutoAppliedVinRef.current = "";
    setMarca("");
    setModello("");
    setMotorizzazione("");
    setVeicoloId("");
    setSelectedCategoriaObj(null);

    notifyParentChange({
      tipo_veicolo: nextTipo,
      vin: "",
      marca: "",
      modello: "",
      motorizzazione: "",
      veicolo_id: "",
      categoriaObj: null,
    });
  };

  const handleVinChange = (rawNext) => {
    const cleaned = normalizeVinInput(rawNext);
    setVinValue(cleaned);
    const info = parseAndValidateVin(cleaned);

    if (!info.isValid) {
      lastAutoAppliedVinRef.current = "";
      notifyParentChange({ vin: "" });
      return;
    }

    const matched = resolveBrandFromWmi(info.mappedBrand, marche);
    if (matched) {
      lastAutoAppliedVinRef.current = info.normalized;
      if (marca !== matched) {
        setMarca(matched);
        setModello("");
        setMotorizzazione("");
        setVeicoloId("");
        notifyParentChange({
          vin: info.normalized,
          marca: matched,
          modello: "",
          motorizzazione: "",
          veicolo_id: "",
        });
        return;
      }
    }

    notifyParentChange({ vin: info.normalized });
  };

  const handleQueryInputChange = (nextValue) => {
    if (controlledQuery === undefined) {
      setInternalQuery(nextValue);
    }
    notifyParentChange({ query: nextValue });
  };

  const handleBrandChange = (nextMarca) => {
    setMarca(nextMarca);
    setModello("");
    setMotorizzazione("");
    setVeicoloId("");

    notifyParentChange({
      marca: nextMarca,
      modello: "",
      motorizzazione: "",
      veicolo_id: "",
    });
  };

  const handleModelChange = (nextModello) => {
    setModello(nextModello);
    setMotorizzazione("");
    setVeicoloId("");

    notifyParentChange({
      modello: nextModello,
      motorizzazione: "",
      veicolo_id: "",
    });
  };

  const handleMotorizzazioneChange = (nextVeicoloId) => {
    if (!nextVeicoloId) {
      setVeicoloId("");
      setMotorizzazione("");
      notifyParentChange({ veicolo_id: "", motorizzazione: "" });
      return;
    }

    const found = motorizzazioni.find(
      (item) => String(item.id) === String(nextVeicoloId)
    );
    const nextLabel = found?.motorizzazione ?? "";
    setVeicoloId(nextVeicoloId);
    setMotorizzazione(nextLabel);

    notifyParentChange({
      veicolo_id: nextVeicoloId,
      motorizzazione: nextLabel,
    });
  };

  const handleCategorySelect = (catObj) => {
    setSelectedCategoriaObj(catObj ?? null);
    notifyParentChange({
      categoriaObj: catObj ?? null,
    });
  };

  const handleReset = () => {
    if (controlledQuery === undefined) {
      setInternalQuery("");
    }
    setVinValue("");
    lastAutoAppliedVinRef.current = "";
    setMarca("");
    setModello("");
    setMotorizzazione("");
    setVeicoloId("");
    setSelectedCategoriaObj(null);

    const emptyPayload = {
      tipo_veicolo: tipoVeicolo,
      marca: "",
      modello: "",
      motorizzazione: "",
      veicolo_id: "",
      query: "",
      vin: "",
      vin_wmi: "",
      categoria_id: "",
      categoria_slug: "",
      categoria_nome: "",
    };

    onChangeRef.current?.(emptyPayload);
    onReset?.(emptyPayload);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = buildPayload();

    if (executePartsQuery && supabaseClient) {
      setSearchingParts(true);
      try {
        const partsResponse = await cercaRicambiPartsSuSupabase(
          payload,
          supabaseClient
        );
        onSearch?.(payload, partsResponse);
      } finally {
        setSearchingParts(false);
      }
      return;
    }

    onSearch?.(payload);
  };

  const hasAnyFilter = Boolean(
    queryValue.trim() ||
      vinValue.trim() ||
      marca ||
      modello ||
      veicoloId ||
      selectedCategoriaObj?.id
  );
  const normalizedOem = normalizeOemCode(queryValue);

  const selectBaseClass =
    "h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-9 text-sm text-slate-900 transition-colors duration-150 hover:border-slate-300 focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25 disabled:cursor-not-allowed disabled:bg-slate-100/80 disabled:text-slate-400 cursor-pointer";

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-[#F9FAFB] shadow-xs ${className}`}
    >
      {/* 1. Barra Tab Tipo Veicolo (Auto / Moto & Scooter / Camion & Veicoli Industriali) */}
      <div
        role="tablist"
        aria-label="Seleziona tipologia veicolo"
        className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 bg-white px-3 py-2.5 sm:px-4 rounded-t-2xl"
      >
        {VEHICLE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === tipoVeicolo;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/40 ${
                isActive
                  ? "border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-xs"
                  : "border-slate-200/80 bg-[#F9FAFB] text-slate-600 hover:border-slate-300 hover:bg-slate-100/70 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-white" : "text-slate-500"
                }`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Form di ricerca compatto con 3 selettori a cascata sempre identici */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-end">
          {/* Campo testo OEM / Descrizione */}
          <div className="lg:col-span-3">
            <label
              htmlFor="vsb-query"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              Codice OEM / Ricambio
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="vsb-query"
                type="text"
                value={queryValue}
                onChange={(e) => handleQueryInputChange(e.target.value)}
                placeholder={activeTab.queryPlaceholder}
                aria-label={activeTab.queryPlaceholder}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25"
              />
              {isOemSearching ? (
                <Loader2
                  aria-label="Ricerca codice OEM in corso"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#1E3A8A]"
                />
              ) : queryValue.trim() !== "" ? (
                <button
                  type="button"
                  onClick={() => handleQueryInputChange("")}
                  aria-label="Svuota campo ricerca"
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Selettore 1 a cascata: MARCA */}
          <div className="lg:col-span-3">
            <label
              htmlFor="vsb-marca"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              {activeTab.brandLabel}
            </label>
            <div className="relative">
              <select
                id="vsb-marca"
                aria-label={activeTab.brandLabel}
                value={marca}
                disabled={loadingMarche}
                onChange={(e) => handleBrandChange(e.target.value)}
                className={selectBaseClass}
              >
                <option value="">
                  {loadingMarche
                    ? "Caricamento marche..."
                    : activeTab.brandPlaceholder}
                </option>
                {marche.map((brandName) => (
                  <option key={brandName} value={brandName}>
                    {brandName}
                  </option>
                ))}
              </select>
              {loadingMarche ? (
                <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#1E3A8A]" />
              ) : (
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              )}
            </div>
          </div>

          {/* Selettore 2 a cascata: MODELLO (disabilitato finché manca la Marca) */}
          <div className="lg:col-span-3">
            <label
              htmlFor="vsb-modello"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              {activeTab.modelLabel}
            </label>
            <div className="relative">
              <select
                id="vsb-modello"
                aria-label={activeTab.modelLabel}
                value={modello}
                disabled={!marca || loadingModelli}
                onChange={(e) => handleModelChange(e.target.value)}
                className={selectBaseClass}
              >
                <option value="">
                  {loadingModelli
                    ? "Caricamento modelli..."
                    : !marca
                      ? activeTab.modelDisabledPlaceholder
                      : activeTab.modelPlaceholder}
                </option>
                {modelli.map((modelName) => (
                  <option key={modelName} value={modelName}>
                    {modelName}
                  </option>
                ))}
              </select>
              {loadingModelli ? (
                <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#1E3A8A]" />
              ) : (
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              )}
            </div>
          </div>

          {/* Selettore 3 a cascata: MOTORIZZAZIONE / CILINDRATA / CONFIGURAZIONE */}
          <div className="lg:col-span-3">
            <label
              htmlFor="vsb-motorizzazione"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              {activeTab.engineLabel}
            </label>
            <div className="relative">
              <select
                id="vsb-motorizzazione"
                aria-label={activeTab.engineLabel}
                value={veicoloId}
                disabled={!marca || !modello || loadingMotorizzazioni}
                onChange={(e) => handleMotorizzazioneChange(e.target.value)}
                className={selectBaseClass}
              >
                <option value="">
                  {loadingMotorizzazioni
                    ? "Caricamento versioni..."
                    : !modello
                      ? activeTab.engineDisabledPlaceholder
                      : activeTab.enginePlaceholder}
                </option>
                {motorizzazioni.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.motorizzazione}
                  </option>
                ))}
              </select>
              {loadingMotorizzazioni ? (
                <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#1E3A8A]" />
              ) : (
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              )}
            </div>
          </div>
        </div>

        {/* Seconda riga compatta: VIN (telaio 17 caratteri) + Selettore Categorie a 2 livelli + Pulsanti CTA e Reset */}
        <div className="mt-3 flex flex-col gap-3 border-t border-slate-200/80 pt-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
            {/* Input Ricerca / Filtro per VIN (telaio 17 caratteri) coerente con gli altri campi */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 xl:w-[290px] xl:shrink-0">
              <label
                htmlFor="vsb-vin"
                className="shrink-0 text-xs font-semibold text-slate-500"
              >
                VIN / Telaio:
              </label>
              <div className="relative flex-1">
                <input
                  id="vsb-vin"
                  type="text"
                  value={vinValue}
                  maxLength={VIN_LENGTH}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(e) => handleVinChange(e.target.value)}
                  placeholder="Numero telaio (17 car.)"
                  aria-label="Ricerca o filtro per VIN telaio a 17 caratteri"
                  aria-invalid={parsedVin.status === "invalid_chars"}
                  className={`h-10 w-full rounded-lg border bg-white pl-3 pr-14 font-mono text-xs uppercase tracking-wide text-slate-900 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 ${
                    parsedVin.status === "invalid_chars"
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : parsedVin.isValid
                        ? "border-[#16A34A]/50 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]/25"
                        : "border-slate-200 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]/25"
                  }`}
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {parsedVin.length > 0 && (
                    <span
                      className={`font-mono text-[10px] tabular-nums ${
                        parsedVin.status === "invalid_chars"
                          ? "text-red-600 font-semibold"
                          : parsedVin.isValid
                            ? "text-[#16A34A] font-semibold"
                            : "text-slate-400"
                      }`}
                    >
                      {parsedVin.length}/{VIN_LENGTH}
                    </span>
                  )}
                  {vinValue !== "" && (
                    <button
                      type="button"
                      onClick={() => handleVinChange("")}
                      aria-label="Svuota campo VIN"
                      className="flex h-5 w-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
              <span className="shrink-0 text-xs font-semibold text-slate-500">
                Categoria:
              </span>
              <CategorySelector
                variant="filter"
                value={selectedCategoriaObj}
                onCategorySelect={handleCategorySelect}
                supabaseClient={supabaseClient}
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasAnyFilter}
              title="Azzera i campi di ricerca"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              disabled={searchingParts}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1E3A8A]/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/40 disabled:opacity-60 sm:flex-initial cursor-pointer"
            >
              {searchingParts ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>{activeTab.ctaLabel}</span>
            </button>
          </div>
        </div>

        {/* Micro-copy discreto di validazione e scomposizione VIN (WMI / VDS / VIS) */}
        {parsedVin.status !== "empty" && (
          <div
            aria-live="polite"
            className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs"
          >
            {parsedVin.status === "invalid_chars" ? (
              <span className="font-medium text-red-600">{parsedVin.message}</span>
            ) : parsedVin.status === "incomplete" ? (
              <>
                <span className="text-amber-700 tabular-nums">
                  {parsedVin.message}
                </span>
                {parsedVin.wmi.length === 3 && (
                  <>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-slate-500">
                      WMI{" "}
                      <strong className="font-mono font-semibold text-slate-700">
                        {parsedVin.wmi}
                      </strong>
                      {parsedVin.mappedBrand ? ` (${parsedVin.mappedBrand})` : ""}
                    </span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="font-medium text-[#16A34A]">VIN valido</span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="text-slate-600">
                  WMI{" "}
                  <strong className="font-mono font-semibold text-[#1E3A8A]">
                    {parsedVin.wmi}
                  </strong>
                  <span aria-hidden="true" className="mx-1.5 text-slate-300">
                    /
                  </span>
                  VDS{" "}
                  <strong className="font-mono font-semibold text-slate-800">
                    {parsedVin.vds}
                  </strong>
                  <span aria-hidden="true" className="mx-1.5 text-slate-300">
                    /
                  </span>
                  VIS{" "}
                  <strong className="font-mono font-semibold text-slate-800">
                    {parsedVin.vis}
                  </strong>
                </span>
                {vinMatchedBrand && (
                  <>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-slate-600">
                      Marca preselezionata:{" "}
                      <strong className="font-semibold text-slate-900">
                        {vinMatchedBrand}
                      </strong>
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Anteprima compatta della normalizzazione OEM quando l'utente digita un codice */}
        {normalizedOem.length >= 2 && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Ricerca catalogo OEM normalizzata:</span>
            <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono font-semibold text-[#1E3A8A]">
              {normalizedOem}
            </span>
            {normalizedOem !== queryValue.trim() && (
              <span className="text-[11px] text-slate-400">
                (spazi e separatori rimossi automaticamente)
              </span>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default VehicleSearchBox;
