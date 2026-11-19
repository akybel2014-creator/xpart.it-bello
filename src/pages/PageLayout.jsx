import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Layout condiviso per tutte le pagine informative, di supporto e legali.
 * Garantisce gerarchia tipografica coerente, breadcrumb accessibili e respiro editoriale.
 */
export function PageLayout({
  eyebrow,
  title,
  subtitle,
  breadcrumbLabel,
  updatedAt,
  children,
}) {
  return (
    <div className="bg-[#F9FAFB]">
      {/* Intestazione editoriale */}
      <section className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <nav
            aria-label="Percorso di navigazione"
            className="mb-4 flex items-center gap-1.5 text-xs text-slate-500"
          >
            <Link
              to="/"
              className="hover:text-[#1E3A8A] transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-800">
              {breadcrumbLabel ?? title}
            </span>
          </nav>

          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1E3A8A]">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {subtitle}
            </p>
          )}
          {updatedAt && (
            <p className="mt-4 text-xs text-slate-400">
              Ultimo aggiornamento: {updatedAt}
            </p>
          )}
        </div>
      </section>

      {/* Corpo pagina */}
      <section className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </section>
    </div>
  );
}
