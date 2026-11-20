import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

/**
 * Legge le variabili dal file locale `.env` (se presente) per lo sviluppo locale,
 * senza mai sovrascrivere credenziali reali fornite da `process.env` (es. Cloudflare Pages).
 */
function readLocalEnvFile(envPath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return result;

  const content = fs.readFileSync(envPath, 'utf-8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const val = line
      .slice(eqIndex + 1)
      .trim()
      .replace(/^["']+|["']+$/g, '');
    if (key && val) {
      result[key] = val;
    }
  }
  return result;
}

function cleanValue(value?: string): string {
  return (value ?? '').trim().replace(/^["']+|["']+$/g, '').trim();
}

function isPlaceholderValue(key: string, value?: string): boolean {
  const cleaned = cleanValue(value);
  if (!cleaned) return true;
  if (key === 'VITE_SUPABASE_URL') {
    return cleaned.includes('your-project-ref');
  }
  if (key === 'VITE_SUPABASE_ANON_KEY') {
    return cleaned.includes('your-supabase-anon-key');
  }
  if (key === 'VITE_SUPABASE_AUTO_TABLE') {
    return cleaned === 'auto' || cleaned === 'veichles';
  }
  if (key === 'VITE_SUPABASE_BRANDS_VIEW') {
    return cleaned === 'auto' || cleaned === 'veichles';
  }
  return false;
}

function pickFirstValid(
  canonicalKey: string,
  candidates: Array<string | undefined>
): string | undefined {
  for (const raw of candidates) {
    const cleaned = cleanValue(raw);
    if (cleaned && !isPlaceholderValue(canonicalKey, cleaned)) {
      return cleaned;
    }
  }
  return undefined;
}

export default defineConfig(() => {
  const localEnv = readLocalEnvFile(path.resolve(__dirname, '.env'));
  const defineOverrides: Record<string, string> = {};

  // Supporta sia i nomi ufficiali Vite (VITE_*) sia eventuali alias comuni su Cloudflare Pages
  const resolvedUrl = pickFirstValid('VITE_SUPABASE_URL', [
    process.env.VITE_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_URL,
    localEnv.VITE_SUPABASE_URL,
  ]);

  const resolvedAnonKey = pickFirstValid('VITE_SUPABASE_ANON_KEY', [
    process.env.VITE_SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    process.env.VITE_SUPABASE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.REACT_APP_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    localEnv.VITE_SUPABASE_ANON_KEY,
  ]);

  const resolvedBrandsView =
    pickFirstValid('VITE_SUPABASE_BRANDS_VIEW', [
      process.env.VITE_SUPABASE_BRANDS_VIEW,
      localEnv.VITE_SUPABASE_BRANDS_VIEW,
    ]) || 'vehicles_marche';

  const resolvedAutoTable =
    pickFirstValid('VITE_SUPABASE_AUTO_TABLE', [
      process.env.VITE_SUPABASE_AUTO_TABLE,
      localEnv.VITE_SUPABASE_AUTO_TABLE,
    ]) || 'vehicles';

  if (resolvedUrl) {
    defineOverrides['import.meta.env.VITE_SUPABASE_URL'] = JSON.stringify(resolvedUrl);
  }
  if (resolvedAnonKey) {
    defineOverrides['import.meta.env.VITE_SUPABASE_ANON_KEY'] = JSON.stringify(resolvedAnonKey);
  }
  defineOverrides['import.meta.env.VITE_SUPABASE_BRANDS_VIEW'] = JSON.stringify(resolvedBrandsView);
  defineOverrides['import.meta.env.VITE_SUPABASE_AUTO_TABLE'] = JSON.stringify(resolvedAutoTable);

  return {
    define: defineOverrides,
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
