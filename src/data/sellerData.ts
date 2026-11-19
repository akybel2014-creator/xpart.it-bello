import type { PartCondition } from "@/src/data/parts";

export type RicambioStato = "Disponibile" | "Venduto";
export type PreventivoStato = "Nuovo" | "In contatto" | "Venduto" | "Archiviato";

/**
 * Schema pronto per tabella Supabase: `ricambi`
 */
export interface RicambioRecord {
  id: string;
  user_id: string;
  titolo: string;
  codice_oem: string;
  categoria: string;
  marca: string;
  modello: string;
  anno_inizio: number;
  anno_fine: number;
  condizione: PartCondition;
  prezzo: number;
  citta: string;
  foto_url: string;
  stato: RicambioStato;
  created_at: string;
}

/**
 * Schema pronto per tabella Supabase: `preventivi`
 */
export interface PreventivoRecord {
  id: string;
  user_id: string;
  ricambio_id: string;
  ricambio_titolo: string;
  codice_oem: string;
  cliente_nome: string;
  cliente_azienda: string;
  cliente_telefono: string;
  messaggio: string;
  data_richiesta: string;
  stato: PreventivoStato;
}

export interface SellerProfile {
  user_id: string;
  businessName: string;
  city: string;
  vatNumber: string;
  verified: boolean;
}

export const SELLER_PROFILE: SellerProfile = {
  user_id: "usr_padana_01",
  businessName: "Autodemolizione Padana S.r.l.",
  city: "Milano",
  vatNumber: "IT08923410152",
  verified: true,
};

export const SELLER_CATEGORIES: string[] = [
  "Motore & Sovralimentazione",
  "Impianto Frenante",
  "Illuminazione & Ottica",
  "Elettronica & Centraline",
  "Trasmissione & Cambio",
  "Sospensioni & Sterzo",
  "Carrozzeria & Lamierati",
];

export const STUDIO_IMAGE_PRESETS: { label: string; url: string }[] = [
  {
    label: "Turbocompressore",
    url: "/src/assets/images/part_turbo_garrett_1795100430082.jpg",
  },
  {
    label: "Pinza & Disco Freno",
    url: "/src/assets/images/part_brake_caliper_1795100430668.jpg",
  },
  {
    label: "Faro Matrix LED",
    url: "/src/assets/images/part_matrix_headlight_1795100429795.jpg",
  },
  {
    label: "Alternatore OEM",
    url: "/src/assets/images/part_alternator_oem_1795100429445.jpg",
  },
  {
    label: "Centralina ECU",
    url: "/src/assets/images/part_ecu_control_unit_1795100429898.jpg",
  },
  {
    label: "Cambio Automatico DSG",
    url: "/src/assets/images/part_dsg_gearbox_1795100441252.jpg",
  },
];

export const INITIAL_SELLER_RICAMBI: RicambioRecord[] = [
  {
    id: "ric_01",
    user_id: "usr_padana_01",
    titolo: "Turbocompressore Garrett GT1749V Geometria Variabile",
    codice_oem: "55264310",
    categoria: "Motore & Sovralimentazione",
    marca: "Alfa Romeo",
    modello: "Giulia",
    anno_inizio: 2018,
    anno_fine: 2023,
    condizione: "Usato Grado A",
    prezzo: 460,
    citta: "Milano",
    foto_url: "/src/assets/images/part_turbo_garrett_1795100430082.jpg",
    stato: "Disponibile",
    created_at: "2026-11-18T09:15:00Z",
  },
  {
    id: "ric_02",
    user_id: "usr_padana_01",
    titolo: "Cambio Automatico Doppia Frizione DSG 6 Marce DQ250",
    codice_oem: "02E300058J",
    categoria: "Trasmissione & Cambio",
    marca: "Volkswagen",
    modello: "Tiguan",
    anno_inizio: 2017,
    anno_fine: 2022,
    condizione: "Usato Grado A",
    prezzo: 1490,
    citta: "Milano",
    foto_url: "/src/assets/images/part_dsg_gearbox_1795100441252.jpg",
    stato: "Disponibile",
    created_at: "2026-11-16T14:30:00Z",
  },
  {
    id: "ric_03",
    user_id: "usr_padana_01",
    titolo: "Proiettore Anteriore Destro Matrix LED Adattivo",
    codice_oem: "8V0941034E",
    categoria: "Illuminazione & Ottica",
    marca: "Audi",
    modello: "A3 8V/8Y",
    anno_inizio: 2020,
    anno_fine: 2024,
    condizione: "Usato Grado A",
    prezzo: 640,
    citta: "Milano",
    foto_url: "/src/assets/images/part_matrix_headlight_1795100429795.jpg",
    stato: "Disponibile",
    created_at: "2026-11-14T11:00:00Z",
  },
  {
    id: "ric_04",
    user_id: "usr_padana_01",
    titolo: "Centralina Motore ECU Bosch EDC17C64 Sbloccata",
    codice_oem: "04L907309R",
    categoria: "Elettronica & Centraline",
    marca: "Volkswagen",
    modello: "Golf VII/VIII",
    anno_inizio: 2016,
    anno_fine: 2021,
    condizione: "Ricondizionato OEM",
    prezzo: 320,
    citta: "Milano",
    foto_url: "/src/assets/images/part_ecu_control_unit_1795100429898.jpg",
    stato: "Disponibile",
    created_at: "2026-11-12T16:40:00Z",
  },
  {
    id: "ric_05",
    user_id: "usr_padana_01",
    titolo: "Kit Pinza Freno Brembo 4 Pompanti + Disco 330mm",
    codice_oem: "77368142",
    categoria: "Impianto Frenante",
    marca: "Alfa Romeo",
    modello: "Stelvio",
    anno_inizio: 2019,
    anno_fine: 2024,
    condizione: "Usato Grado A",
    prezzo: 385,
    citta: "Milano",
    foto_url: "/src/assets/images/part_brake_caliper_1795100430668.jpg",
    stato: "Venduto",
    created_at: "2026-11-08T10:20:00Z",
  },
  {
    id: "ric_06",
    user_id: "usr_padana_01",
    titolo: "Scatola Sterzo Elettrica EPS ZF con Tiranti",
    codice_oem: "A2054608201",
    categoria: "Sospensioni & Sterzo",
    marca: "Mercedes-Benz",
    modello: "Classe C W205",
    anno_inizio: 2016,
    anno_fine: 2021,
    condizione: "Ricondizionato OEM",
    prezzo: 590,
    citta: "Milano",
    foto_url: "/src/assets/images/part_steering_rack_1795100430080.jpg",
    stato: "Venduto",
    created_at: "2026-11-03T08:45:00Z",
  },
];

export const INITIAL_SELLER_PREVENTIVI: PreventivoRecord[] = [
  {
    id: "prv_101",
    user_id: "usr_padana_01",
    ricambio_id: "ric_01",
    ricambio_titolo: "Turbocompressore Garrett GT1749V Geometria Variabile",
    codice_oem: "55264310",
    cliente_nome: "Marco Ferretti",
    cliente_azienda: "Autofficina Ferretti & Figli S.n.c.",
    cliente_telefono: "+393485129043",
    messaggio: "Richiesta verifica compatibilità su telaio ZARFAEBN8J7591204 con consegna 24h.",
    data_richiesta: "19 Nov 2026",
    stato: "Nuovo",
  },
  {
    id: "prv_102",
    user_id: "usr_padana_01",
    ricambio_id: "ric_02",
    ricambio_titolo: "Cambio Automatico Doppia Frizione DSG 6 Marce DQ250",
    codice_oem: "02E300058J",
    cliente_nome: "Luca Lombardi",
    cliente_azienda: "Centro Revisioni Cambio Nord S.r.l.",
    cliente_telefono: "+393358910422",
    messaggio: "Interessato al gruppo completo con meccatronica. Disponibile ritiro diretto su bancale?",
    data_richiesta: "19 Nov 2026",
    stato: "Nuovo",
  },
  {
    id: "prv_103",
    user_id: "usr_padana_01",
    ricambio_id: "ric_03",
    ricambio_titolo: "Proiettore Anteriore Destro Matrix LED Adattivo",
    codice_oem: "8V0941034E",
    cliente_nome: "Davide Galli",
    cliente_azienda: "Carrozzeria Moderna Monza",
    cliente_telefono: "+393407741908",
    messaggio: "Confermate che tutte le staffe superiori siano originali e integre?",
    data_richiesta: "18 Nov 2026",
    stato: "In contatto",
  },
  {
    id: "prv_104",
    user_id: "usr_padana_01",
    ricambio_id: "ric_05",
    ricambio_titolo: "Kit Pinza Freno Brembo 4 Pompanti + Disco 330mm",
    codice_oem: "77368142",
    cliente_nome: "Stefano Conti",
    cliente_azienda: "Officina Meccanica Conti S.r.l.",
    cliente_telefono: "+393472190334",
    messaggio: "Ordine confermato con bonifico istantaneo, spedire in Via Emilia 48.",
    data_richiesta: "15 Nov 2026",
    stato: "Venduto",
  },
  {
    id: "prv_105",
    user_id: "usr_padana_01",
    ricambio_id: "ric_06",
    ricambio_titolo: "Scatola Sterzo Elettrica EPS ZF con Tiranti",
    codice_oem: "A2054608201",
    cliente_nome: "Roberto Riva",
    cliente_azienda: "Garage Europa Bergamasca",
    cliente_telefono: "+393396548120",
    messaggio: "Acquisto completato con reso carcassa entro 10 giorni.",
    data_richiesta: "11 Nov 2026",
    stato: "Venduto",
  },
];
