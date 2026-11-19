export type PartCondition = "Usato Grado A" | "Usato Grado B" | "Ricondizionato OEM";

export interface AutoPart {
  id: string;
  title: string;
  oemCode: string;
  brand: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  category: string;
  subcategory: string;
  condition: PartCondition;
  priceNet: number;
  warrantyMonths: number;
  mileageKm: number;
  engineCode: string;
  seller: {
    name: string;
    city: string;
    verified: boolean;
    rating: string;
    dispatchHours: number;
  };
  image: string;
  stock: number;
  description: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  subcategories: {
    id: string;
    name: string;
    count: number;
  }[];
}

export const HERO_BANNER_IMAGE = "/src/assets/images/hero_automotive_parts_1795100429940.jpg";

export const VEHICLE_MAKES: Record<string, string[]> = {
  "Alfa Romeo": ["Giulia", "Stelvio", "Giulietta", "Tonale"],
  "Audi": ["A3 8V/8Y", "A4 B9", "Q3", "Q5"],
  "BMW": ["Serie 1 F40", "Serie 3 G20", "X1", "X3"],
  "Fiat": ["500X", "Tipo", "Panda", "Ducato"],
  "Ford": ["Focus", "Puma", "Kuga", "Transit"],
  "Mercedes-Benz": ["Classe A W177", "Classe C W205", "GLA", "Sprinter"],
  "Volkswagen": ["Golf VII/VIII", "Tiguan", "Passat B8", "T-Roc"],
};

export const CATEGORY_TREE: CategoryGroup[] = [
  {
    id: "motore",
    name: "Motore & Sovralimentazione",
    subcategories: [
      { id: "turbocompressori", name: "Turbocompressori", count: 2 },
      { id: "alternatori", name: "Alternatori & Motorini", count: 1 },
    ],
  },
  {
    id: "frenante",
    name: "Impianto Frenante",
    subcategories: [
      { id: "pinze-dischi", name: "Pinze & Dischi Freno", count: 1 },
    ],
  },
  {
    id: "illuminazione",
    name: "Illuminazione & Ottica",
    subcategories: [
      { id: "fari-led", name: "Fari Matrix LED & Xenon", count: 1 },
    ],
  },
  {
    id: "elettronica",
    name: "Elettronica & Centraline",
    subcategories: [
      { id: "centraline-ecu", name: "Centraline Motore ECU", count: 1 },
    ],
  },
  {
    id: "trasmissione",
    name: "Trasmissione & Cambio",
    subcategories: [
      { id: "cambi-automatici", name: "Cambi Automatici & DSG", count: 1 },
    ],
  },
  {
    id: "sospensioni",
    name: "Sospensioni & Sterzo",
    subcategories: [
      { id: "ammortizzatori", name: "Ammortizzatori & Bracci", count: 1 },
      { id: "scatole-sterzo", name: "Scatole Sterzo Elettriche", count: 1 },
    ],
  },
];

export const AUTO_PARTS: AutoPart[] = [
  {
    id: "CLP-8901",
    title: "Turbocompressore Garrett GT1749V Geometria Variabile",
    oemCode: "55264310",
    brand: "Alfa Romeo",
    model: "Giulia",
    yearFrom: 2018,
    yearTo: 2023,
    category: "motore",
    subcategory: "turbocompressori",
    condition: "Usato Grado A",
    priceNet: 460,
    warrantyMonths: 12,
    mileageKm: 42500,
    engineCode: "55273835 (2.2 JTDM)",
    seller: {
      name: "Autodemolizione Padana S.r.l.",
      city: "Milano",
      verified: true,
      rating: "4.9",
      dispatchHours: 24,
    },
    image: "/src/assets/images/part_turbo_garrett_1795100430082.jpg",
    stock: 3,
    description:
      "Turbina originale Garrett testata al banco flussometro, gioco assiale entro tolleranze di fabbrica, attuatore elettronico calibrato e pronto per il montaggio.",
  },
  {
    id: "CLP-8902",
    title: "Kit Pinza Freno Brembo 4 Pompanti + Disco Ventilato 330mm",
    oemCode: "77368142",
    brand: "Alfa Romeo",
    model: "Stelvio",
    yearFrom: 2019,
    yearTo: 2024,
    category: "frenante",
    subcategory: "pinze-dischi",
    condition: "Usato Grado A",
    priceNet: 385,
    warrantyMonths: 12,
    mileageKm: 31200,
    engineCode: "2.0 TB / 2.2 JTDM",
    seller: {
      name: "Centro Ricambi Nord S.p.A.",
      city: "Torino",
      verified: true,
      rating: "4.8",
      dispatchHours: 24,
    },
    image: "/src/assets/images/part_brake_caliper_1795100430668.jpg",
    stock: 2,
    description:
      "Gruppo freno anteriore sinistro completo di pinza monoblocco in alluminio e disco autoventilato con spessore residuo 94%. Guarnizioni e parapolvere verificati.",
  },
  {
    id: "CLP-8903",
    title: "Proiettore Anteriore Destro Matrix LED Adattivo Completo",
    oemCode: "8V0941034E",
    brand: "Audi",
    model: "A3 8V/8Y",
    yearFrom: 2020,
    yearTo: 2024,
    category: "illuminazione",
    subcategory: "fari-led",
    condition: "Usato Grado A",
    priceNet: 640,
    warrantyMonths: 12,
    mileageKm: 28900,
    engineCode: "Compatibile 35 TFSI / TDI",
    seller: {
      name: "Demolizioni Venete S.r.l.",
      city: "Verona",
      verified: true,
      rating: "4.9",
      dispatchHours: 24,
    },
    image: "/src/assets/images/part_matrix_headlight_1795100429795.jpg",
    stock: 1,
    description:
      "Faro Matrix LED originale con centraline ballast incluse. Tutti gli attacchi superiori e inferiori integri senza riparazioni, lente esente da opacità.",
  },
  {
    id: "CLP-8904",
    title: "Alternatore Bosch 180A 14V con Puleggia Frizionata",
    oemCode: "0125811056",
    brand: "BMW",
    model: "Serie 3 G20",
    yearFrom: 2019,
    yearTo: 2024,
    category: "motore",
    subcategory: "alternatori",
    condition: "Ricondizionato OEM",
    priceNet: 245,
    warrantyMonths: 24,
    mileageKm: 0,
    engineCode: "B47D20 / B48B20",
    seller: {
      name: "Elettromeccanica Bresciana S.r.l.",
      city: "Brescia",
      verified: true,
      rating: "5.0",
      dispatchHours: 24,
    },
    image: "/src/assets/images/part_alternator_oem_1795100429445.jpg",
    stock: 5,
    description:
      "Alternatore rigenerato secondo specifica Bosch OEM con cuscinetti SKF nuovi, regolatore di tensione originale e certificato di collaudo banco prova allegato.",
  },
  {
    id: "CLP-8905",
    title: "Centralina Motore ECU Bosch EDC17C64 Sbloccata",
    oemCode: "04L907309R",
    brand: "Volkswagen",
    model: "Golf VII/VIII",
    yearFrom: 2016,
    yearTo: 2021,
    category: "elettronica",
    subcategory: "centraline-ecu",
    condition: "Ricondizionato OEM",
    priceNet: 320,
    warrantyMonths: 12,
    mileageKm: 54000,
    engineCode: "CRLB / DCYA (2.0 TDI)",
    seller: {
      name: "TecnoAuto Ricambi S.r.l.",
      city: "Bologna",
      verified: true,
      rating: "4.8",
      dispatchHours: 24,
    },
    image: "/src/assets/images/part_ecu_control_unit_1795100429898.jpg",
    stock: 4,
    description:
      "Modulo ECU controllato elettronicamente su banco diagnostico, pin connettore integri e verginizzata pronta per codifica immobilizer in officina.",
  },
  {
    id: "CLP-8906",
    title: "Cambio Automatico Doppia Frizione DSG 6 Marce DQ250",
    oemCode: "02E300058J",
    brand: "Volkswagen",
    model: "Tiguan",
    yearFrom: 2017,
    yearTo: 2022,
    category: "trasmissione",
    subcategory: "cambi-automatici",
    condition: "Usato Grado A",
    priceNet: 1490,
    warrantyMonths: 12,
    mileageKm: 48600,
    engineCode: "DFGA (2.0 TDI 4Motion)",
    seller: {
      name: "Autodemolizione Padana S.r.l.",
      city: "Milano",
      verified: true,
      rating: "4.9",
      dispatchHours: 48,
    },
    image: "/src/assets/images/part_dsg_gearbox_1795100441252.jpg",
    stock: 1,
    description:
      "Gruppo cambio completo di meccatronica originale e pacco frizioni testato su veicolo marciante. Spedizione su bancale dedicato con assicurazione inclusa.",
  },
  {
    id: "CLP-8907",
    title: "Gruppo Ammortizzatore Anteriore MacPherson Bilstein OEM",
    oemCode: "31316874375",
    brand: "BMW",
    model: "Serie 1 F40",
    yearFrom: 2019,
    yearTo: 2024,
    category: "sospensioni",
    subcategory: "ammortizzatori",
    condition: "Usato Grado B",
    priceNet: 165,
    warrantyMonths: 6,
    mileageKm: 61000,
    engineCode: "118d / 118i",
    seller: {
      name: "Centro Ricambi Lazio S.r.l.",
      city: "Roma",
      verified: true,
      rating: "4.7",
      dispatchHours: 24,
    },
    image: "/src/assets/images/part_suspension_strut_1795100428999.jpg",
    stock: 4,
    description:
      "Montante completo di molla elicoidale, supporto superiore e tampone parapolvere. Stelo asciutto senza trafilamenti, provato al banco sospensioni.",
  },
  {
    id: "CLP-8908",
    title: "Scatola Sterzo Elettrica EPS ZF con Tiranti Assiali",
    oemCode: "A2054608201",
    brand: "Mercedes-Benz",
    model: "Classe C W205",
    yearFrom: 2016,
    yearTo: 2021,
    category: "sospensioni",
    subcategory: "scatole-sterzo",
    condition: "Ricondizionato OEM",
    priceNet: 590,
    warrantyMonths: 24,
    mileageKm: 0,
    engineCode: "OM651 / OM654",
    seller: {
      name: "Elettromeccanica Bresciana S.r.l.",
      city: "Brescia",
      verified: true,
      rating: "5.0",
      dispatchHours: 24,
    },
    image: "/src/assets/images/part_steering_rack_1795100430080.jpg",
    stock: 2,
    description:
      "Cremagliera sterzo elettromeccanica ZF revisionata integralmente con sensore di coppia calibrato e cuffie protettive nuove.",
  },
  {
    id: "CLP-8909",
    title: "Turbocompressore BorgWarner KP39 1.6 MultiJet II",
    oemCode: "55260582",
    brand: "Fiat",
    model: "500X",
    yearFrom: 2016,
    yearTo: 2022,
    category: "motore",
    subcategory: "turbocompressori",
    condition: "Usato Grado B",
    priceNet: 290,
    warrantyMonths: 12,
    mileageKm: 67400,
    engineCode: "55260384 (1.6 MJT)",
    seller: {
      name: "Demolizioni Venete S.r.l.",
      city: "Verona",
      verified: true,
      rating: "4.9",
      dispatchHours: 24,
    },
    image: "/src/assets/images/part_turbo_garrett_1795100430082.jpg",
    stock: 2,
    description:
      "Turbocompressore completo di collettore di scarico integrato e sensore posizione geometria variabile. Verificato in tenuta olio e pressione sovralimentazione.",
  },
];
