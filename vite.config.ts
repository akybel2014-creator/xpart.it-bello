import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

/**
 * Legge le variabili dal file locale `.env` (se presente) per sostituire eventuali
 * placeholder residui iniettati nell'ambiente del container (es. "your-project-ref"
 * o "your-supabase-anon-key") senza mai sovrascrivere credenziali reali in `process.env`.
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
      .replace(/^["']|["']$/g, '');
    if (key && val) {
      result[key] = val;
    }
  }
  return result;
}

function isPlaceholderValue(key: string, value?: string): boolean {
  if (!value || !value.trim()) return true;
  const trimmed = value.trim();
  if (key === 'VITE_SUPABASE_URL') {
    return trimmed.includes('your-project-ref');
  }
  if (key === 'VITE_SUPABASE_ANON_KEY') {
    return trimmed.includes('your-supabase-anon-key');
  }
  if (key === 'VITE_SUPABASE_AUTO_TABLE') {
    return trimmed === 'auto';
  }
  return false;
}

export default defineConfig(() => {
  const localEnv = readLocalEnvFile(path.resolve(__dirname, '.env'));
  const defineOverrides: Record<string, string> = {};

  for (const key of [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_AUTO_TABLE',
  ]) {
    const procVal = process.env[key];
    const fileVal = localEnv[key];
    if (isPlaceholderValue(key, procVal) && fileVal && !isPlaceholderValue(key, fileVal)) {
      defineOverrides[`import.meta.env.${key}`] = JSON.stringify(fileVal);
    }
  }

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
