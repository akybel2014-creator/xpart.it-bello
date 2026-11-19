import type { AutoTableRow } from "@/src/lib/supabaseClient";

/**
 * Dataset strutturato coerente con lo schema della tabella `auto` su Supabase.
 * Utilizzato automaticamente quando le variabili VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 * non sono ancora configurate nell'ambiente di anteprima.
 */
export const AUTO_TABLE_FALLBACK: AutoTableRow[] = [
  // Alfa Romeo
  { marca: "Alfa Romeo", modello: "Giulia", motore: "2.2 JTDM", cilindrata: "2143 cc", potenza: "190 CV", carburante: "Diesel", codice_motore: "55273835" },
  { marca: "Alfa Romeo", modello: "Giulia", motore: "2.0 Turbo", cilindrata: "1995 cc", potenza: "200 CV", carburante: "Benzina", codice_motore: "55273838" },
  { marca: "Alfa Romeo", modello: "Stelvio", motore: "2.2 JTDM Q4", cilindrata: "2143 cc", potenza: "210 CV", carburante: "Diesel", codice_motore: "46335975" },
  { marca: "Alfa Romeo", modello: "Stelvio", motore: "2.0 TB Q4", cilindrata: "1995 cc", potenza: "280 CV", carburante: "Benzina", codice_motore: "55282328" },
  { marca: "Alfa Romeo", modello: "Giulietta", motore: "1.6 JTDM-2", cilindrata: "1598 cc", potenza: "120 CV", carburante: "Diesel", codice_motore: "55280444" },
  { marca: "Alfa Romeo", modello: "Tonale", motore: "1.5 Hybrid VGT", cilindrata: "1469 cc", potenza: "160 CV", carburante: "Ibrido", codice_motore: "46347812" },

  // Audi
  { marca: "Audi", modello: "A3 8V/8Y", motore: "35 TFSI", cilindrata: "1498 cc", potenza: "150 CV", carburante: "Benzina", codice_motore: "DADA" },
  { marca: "Audi", modello: "A3 8V/8Y", motore: "35 TDI", cilindrata: "1968 cc", potenza: "150 CV", carburante: "Diesel", codice_motore: "CRLB" },
  { marca: "Audi", modello: "A4 B9", motore: "2.0 TDI ultra", cilindrata: "1968 cc", potenza: "150 CV", carburante: "Diesel", codice_motore: "DEUA" },
  { marca: "Audi", modello: "Q3", motore: "35 TDI quattro", cilindrata: "1968 cc", potenza: "150 CV", carburante: "Diesel", codice_motore: "DFGA" },
  { marca: "Audi", modello: "Q5", motore: "40 TDI MHEV", cilindrata: "1968 cc", potenza: "204 CV", carburante: "Ibrido Diesel", codice_motore: "DTPA" },

  // BMW
  { marca: "BMW", modello: "Serie 1 F40", motore: "118d", cilindrata: "1995 cc", potenza: "150 CV", carburante: "Diesel", codice_motore: "B47C20B" },
  { marca: "BMW", modello: "Serie 1 F40", motore: "118i", cilindrata: "1499 cc", potenza: "136 CV", carburante: "Benzina", codice_motore: "B38A15M1" },
  { marca: "BMW", modello: "Serie 3 G20", motore: "320d", cilindrata: "1995 cc", potenza: "190 CV", carburante: "Diesel", codice_motore: "B47D20" },
  { marca: "BMW", modello: "Serie 3 G20", motore: "320i", cilindrata: "1998 cc", potenza: "184 CV", carburante: "Benzina", codice_motore: "B48B20" },
  { marca: "BMW", modello: "X1", motore: "sDrive18d", cilindrata: "1995 cc", potenza: "150 CV", carburante: "Diesel", codice_motore: "B47C20" },
  { marca: "BMW", modello: "X3", motore: "xDrive20d", cilindrata: "1995 cc", potenza: "190 CV", carburante: "Diesel", codice_motore: "B47D20O1" },

  // Fiat
  { marca: "Fiat", modello: "500X", motore: "1.6 MultiJet II", cilindrata: "1598 cc", potenza: "120 CV", carburante: "Diesel", codice_motore: "55260384" },
  { marca: "Fiat", modello: "500X", motore: "1.0 Firefly T3", cilindrata: "999 cc", potenza: "120 CV", carburante: "Benzina", codice_motore: "55282151" },
  { marca: "Fiat", modello: "Tipo", motore: "1.6 MultiJet", cilindrata: "1598 cc", potenza: "130 CV", carburante: "Diesel", codice_motore: "46346020" },
  { marca: "Fiat", modello: "Panda", motore: "1.0 Hybrid", cilindrata: "999 cc", potenza: "70 CV", carburante: "Ibrido", codice_motore: "46341162" },
  { marca: "Fiat", modello: "Ducato", motore: "2.3 MultiJet2", cilindrata: "2287 cc", potenza: "140 CV", carburante: "Diesel", codice_motore: "F1AGL411D" },

  // Ford
  { marca: "Ford", modello: "Focus", motore: "1.5 EcoBlue", cilindrata: "1499 cc", potenza: "120 CV", carburante: "Diesel", codice_motore: "ZTDA" },
  { marca: "Ford", modello: "Puma", motore: "1.0 EcoBoost Hybrid", cilindrata: "999 cc", potenza: "125 CV", carburante: "Ibrido", codice_motore: "B7JA" },
  { marca: "Ford", modello: "Kuga", motore: "2.5 Duratec FHEV", cilindrata: "2488 cc", potenza: "190 CV", carburante: "Ibrido", codice_motore: "BGDC" },
  { marca: "Ford", modello: "Transit", motore: "2.0 EcoBlue", cilindrata: "1995 cc", potenza: "130 CV", carburante: "Diesel", codice_motore: "YMFS" },

  // Mercedes-Benz
  { marca: "Mercedes-Benz", modello: "Classe A W177", motore: "A 180 d", cilindrata: "1461 cc", potenza: "116 CV", carburante: "Diesel", codice_motore: "OM608" },
  { marca: "Mercedes-Benz", modello: "Classe C W205", motore: "C 220 d", cilindrata: "2143 cc", potenza: "170 CV", carburante: "Diesel", codice_motore: "OM651" },
  { marca: "Mercedes-Benz", modello: "Classe C W205", motore: "C 220 d EQ", cilindrata: "1950 cc", potenza: "194 CV", carburante: "Diesel", codice_motore: "OM654" },
  { marca: "Mercedes-Benz", modello: "GLA", motore: "GLA 200 d", cilindrata: "1950 cc", potenza: "150 CV", carburante: "Diesel", codice_motore: "OM654Q" },

  // Volkswagen
  { marca: "Volkswagen", modello: "Golf VII/VIII", motore: "2.0 TDI", cilindrata: "1968 cc", potenza: "150 CV", carburante: "Diesel", codice_motore: "CRLB / DCYA" },
  { marca: "Volkswagen", modello: "Golf VII/VIII", motore: "1.5 eTSI", cilindrata: "1498 cc", potenza: "150 CV", carburante: "Ibrido", codice_motore: "DFYA" },
  { marca: "Volkswagen", modello: "Tiguan", motore: "2.0 TDI 4Motion", cilindrata: "1968 cc", potenza: "150 CV", carburante: "Diesel", codice_motore: "DFGA" },
  { marca: "Volkswagen", modello: "Passat B8", motore: "2.0 TDI SCR", cilindrata: "1968 cc", potenza: "150 CV", carburante: "Diesel", codice_motore: "DSRB" },
  { marca: "Volkswagen", modello: "T-Roc", motore: "1.0 TSI", cilindrata: "999 cc", potenza: "110 CV", carburante: "Benzina", codice_motore: "DLAA" },
];
