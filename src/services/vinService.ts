/**
 * Servizio lato client per la normalizzazione, validazione, scomposizione (WMI/VDS/VIS)
 * e associazione WMI -> Marca rispetto a `public.vehicles` e `public.vehicles_marche`.
 *
 * Perimetro: esclusivamente SITO (nessun riferimento a `public.parts`).
 */

export const VIN_LENGTH = 17;

export type VinValidationStatus =
  | "empty"
  | "invalid_chars"
  | "incomplete"
  | "valid";

export interface ParsedVinResult {
  /** Input normalizzato in uppercase alfanumerico (max 17 caratteri) */
  normalized: string;
  /** Lunghezza corrente della stringa normalizzata */
  length: number;
  /** Stato di validazione corrente */
  status: VinValidationStatus;
  /** True solo se esattamente 17 caratteri e privo di I, O, Q */
  isValid: boolean;
  /** Caratteri non ammessi rilevati (tra I, O, Q) */
  invalidChars: string[];
  /** World Manufacturer Identifier (caratteri 1-3) */
  wmi: string;
  /** Vehicle Descriptor Section (caratteri 4-9) */
  vds: string;
  /** Vehicle Identifier Section (caratteri 10-17) */
  vis: string;
  /** Marca canonica associata al WMI se riconosciuto, altrimenti null */
  mappedBrand: string | null;
  /** Micro-copy discreto di stato pronto per la UI */
  message: string | null;
}

/**
 * Mappa WMI (primi 3 caratteri del VIN) -> Marca costruttore canonica.
 * Il successivo matching verso `public.vehicles."Marca"` e `public.vehicles_marche`
 * avviene in modo case-insensitive e tollerante a separatori/accenti.
 */
export const WMI_TO_BRAND_MAP: Record<string, string> = {
  // Gruppo Volkswagen / VAG
  WVW: "VOLKSWAGEN",
  WV1: "VOLKSWAGEN",
  WV2: "VOLKSWAGEN",
  WV3: "VOLKSWAGEN",
  "3VW": "VOLKSWAGEN",
  "1VW": "VOLKSWAGEN",
  "9BW": "VOLKSWAGEN",
  WAU: "AUDI",
  WUA: "AUDI",
  TRU: "AUDI",
  VSS: "SEAT",
  TMB: "SKODA",
  WP0: "PORSCHE",
  WP1: "PORSCHE",

  // Gruppo Stellantis / FCA / PSA
  ZFA: "FIAT",
  ZFC: "FIAT",
  ZFB: "FIAT",
  "3C3": "FIAT",
  ZAR: "ALFA ROMEO",
  ZLA: "LANCIA",
  ZAM: "MASERATI",
  ZFF: "FERRARI",
  ZHW: "LAMBORGHINI",
  ZAP: "PIAGGIO",
  ZCF: "IVECO",
  ZC2: "CHRYSLER",
  "1C4": "JEEP",
  "1J4": "JEEP",
  "1J8": "JEEP",
  ZAC: "JEEP",
  VF3: "PEUGEOT",
  VR3: "PEUGEOT",
  VF7: "CITROEN",
  VR7: "CITROEN",
  VF8: "MATRA",
  VR1: "DS",
  W0L: "OPEL",
  W0V: "OPEL",
  VXK: "OPEL",
  VXE: "OPEL",
  VSX: "OPEL",

  // Renault / Dacia / Nissan / Mitsubishi
  VF1: "RENAULT",
  VF6: "RENAULT",
  VMK: "RENAULT",
  UU1: "DACIA",
  SJN: "NISSAN",
  JN1: "NISSAN",
  VSK: "NISSAN",
  JMB: "MITSUBISHI",
  XM0: "MITSUBISHI",

  // BMW / MINI / Mercedes-Benz / Smart
  WBA: "BMW",
  WBS: "BMW",
  WBY: "BMW",
  WBX: "BMW",
  WB1: "BMW",
  "5UX": "BMW",
  WMW: "MINI",
  WDB: "MERCEDES-BENZ",
  WDD: "MERCEDES-BENZ",
  WDC: "MERCEDES-BENZ",
  WDF: "MERCEDES-BENZ",
  W1K: "MERCEDES-BENZ",
  W1N: "MERCEDES-BENZ",
  W1V: "MERCEDES-BENZ",
  W1T: "MERCEDES-BENZ",
  VSA: "MERCEDES-BENZ",
  "4JG": "MERCEDES-BENZ",
  WME: "SMART",
  TCC: "SMART",

  // Ford
  WF0: "FORD",
  WF1: "FORD",
  NM0: "FORD",
  "1FA": "FORD",
  "1FM": "FORD",
  "1FT": "FORD",
  MAJ: "FORD",

  // Volvo / Land Rover / Jaguar / Saab
  YV1: "VOLVO",
  YV2: "VOLVO",
  YV4: "VOLVO",
  LVY: "VOLVO",
  SAL: "LAND ROVER",
  SAJ: "JAGUAR",
  YS3: "SAAB",

  // Giapponesi & Coreane
  JTD: "TOYOTA",
  JTE: "TOYOTA",
  JTM: "TOYOTA",
  SB1: "TOYOTA",
  NMT: "TOYOTA",
  VNK: "TOYOTA",
  JTH: "LEXUS",
  JTJ: "LEXUS",
  JHM: "HONDA",
  SHH: "HONDA",
  SHS: "HONDA",
  JMZ: "MAZDA",
  JM1: "MAZDA",
  JS1: "SUZUKI",
  JSA: "SUZUKI",
  TSM: "SUZUKI",
  JF1: "SUBARU",
  JF2: "SUBARU",
  KMH: "HYUNDAI",
  TMA: "HYUNDAI",
  NLH: "HYUNDAI",
  MAL: "HYUNDAI",
  KNA: "KIA",
  KNB: "KIA",
  KNC: "KIA",
  KND: "KIA",
  U5Y: "KIA",
  U6Y: "KIA",
  KPT: "SSANGYONG",

  // Altri costruttori diffusi
  "5YJ": "TESLA",
  LRW: "TESLA",
  XP7: "TESLA",
  "7SA": "TESLA",
  KL1: "CHEVROLET",
  "1G1": "CHEVROLET",
  LSJ: "MG",
  WMA: "MAN",
  XLR: "DAF",
  YS2: "SCANIA",
};

const DISALLOWED_VIN_CHAR_REGEX = /[IOQ]/g;

/**
 * Normalizza un input VIN in uppercase alfanumerico (`[^A-Z0-9]`)
 * limitandolo a 17 caratteri. Mantiene temporaneamente eventuali `I`, `O`, `Q`
 * così la UI può segnalarli chiaramente all'utente.
 */
export function normalizeVinInput(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, VIN_LENGTH);
}

/**
 * Normalizza un nome marca per confronti case-insensitive tolleranti a accenti e trattini
 * (es. "Citroën" === "CITROEN", "Mercedes-Benz" === "MERCEDES BENZ").
 */
function normalizeBrandKey(brand: string): string {
  return (brand || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * Valida e scompone un codice VIN (17 caratteri):
 * - WMI (caratteri 1-3)
 * - VDS (caratteri 4-9)
 * - VIS (caratteri 10-17)
 */
export function parseAndValidateVin(raw: unknown): ParsedVinResult {
  const normalized = normalizeVinInput(raw);
  const length = normalized.length;

  if (length === 0) {
    return {
      normalized: "",
      length: 0,
      status: "empty",
      isValid: false,
      invalidChars: [],
      wmi: "",
      vds: "",
      vis: "",
      mappedBrand: null,
      message: null,
    };
  }

  const invalidMatches = normalized.match(DISALLOWED_VIN_CHAR_REGEX) ?? [];
  const invalidChars = Array.from(new Set(invalidMatches));

  const wmi = normalized.slice(0, 3);
  const vds = normalized.slice(3, 9);
  const vis = normalized.slice(9, 17);
  const mappedBrand = wmi.length === 3 ? WMI_TO_BRAND_MAP[wmi] ?? null : null;

  if (invalidChars.length > 0) {
    return {
      normalized,
      length,
      status: "invalid_chars",
      isValid: false,
      invalidChars,
      wmi,
      vds,
      vis,
      mappedBrand: null,
      message: `Caratteri non ammessi nel VIN (${invalidChars.join(", ")}): i telai non contengono I, O o Q.`,
    };
  }

  if (length < VIN_LENGTH) {
    return {
      normalized,
      length,
      status: "incomplete",
      isValid: false,
      invalidChars: [],
      wmi,
      vds,
      vis,
      mappedBrand,
      message: `VIN incompleto: ${length}/${VIN_LENGTH} caratteri.`,
    };
  }

  return {
    normalized,
    length,
    status: "valid",
    isValid: true,
    invalidChars: [],
    wmi,
    vds,
    vis,
    mappedBrand,
    message: null,
  };
}

/**
 * Cerca in modo difensivo e case-insensitive la corrispondenza esatta della marca
 * ricavata dal WMI nell'elenco di marche caricate da `public.vehicles_marche` / `public.vehicles`.
 * Restituisce `null` silenziosamente se il WMI non è noto o la marca non è presente in elenco.
 */
export function resolveBrandFromWmi(
  mappedBrand: string | null | undefined,
  availableBrands: unknown
): string | null {
  if (!mappedBrand || !Array.isArray(availableBrands) || availableBrands.length === 0) {
    return null;
  }

  const targetKey = normalizeBrandKey(mappedBrand);
  if (!targetKey) return null;

  const validBrands = availableBrands.filter(
    (b): b is string => typeof b === "string" && b.trim().length > 0
  );

  // 1. Match esatto normalizzato (case-insensitive, ignora trattini/spazi/accenti)
  const exact = validBrands.find((b) => normalizeBrandKey(b) === targetKey);
  if (exact) return exact;

  // 2. Match parziale sicuro (es. "MERCEDES-BENZ" vs "MERCEDES")
  const partial = validBrands.find((b) => {
    const key = normalizeBrandKey(b);
    return key.length >= 3 && (key.includes(targetKey) || targetKey.includes(key));
  });

  return partial ?? null;
}
