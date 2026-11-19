import { RotateCcw, ShieldCheck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { Slider } from "@/src/components/ui/slider";
import { CATEGORY_TREE, type PartCondition } from "@/src/data/parts";
import { cn } from "@/src/lib/utils";

const CONDITIONS: PartCondition[] = [
  "Usato Grado A",
  "Usato Grado B",
  "Ricondizionato OEM",
];

const COMPAT_YEARS = Array.from({ length: 14 }, (_, i) => 2012 + i);

export interface FilterState {
  categoryId: string | null;
  subcategoryId: string | null;
  yearFrom: number;
  yearTo: number;
  conditions: PartCondition[];
  priceRange: [number, number];
  verifiedOnly: boolean;
}

interface CategorySidebarProps {
  filters: FilterState;
  onChangeFilters: (next: FilterState) => void;
  onResetAll: () => void;
  activeFilterCount: number;
}

export function CategorySidebar({
  filters,
  onChangeFilters,
  onResetAll,
  activeFilterCount,
}: CategorySidebarProps) {
  const toggleCondition = (condition: PartCondition) => {
    const exists = filters.conditions.includes(condition);
    const nextConditions = exists
      ? filters.conditions.filter((c) => c !== condition)
      : [...filters.conditions, condition];
    onChangeFilters({ ...filters, conditions: nextConditions });
  };

  return (
    <aside
      aria-label="Filtri catalogo ricambi"
      className="w-full rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2 pb-4">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Filtri Ricambi
        </h2>
        {activeFilterCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetAll}
            className="h-8 px-2.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/8"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Azzera ({activeFilterCount})
          </Button>
        )}
      </div>

      <Separator />

      {/* Categorie Espandibili (Shadcn Accordion) */}
      <div className="py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-slate-500">
            Categorie
          </span>
          {(filters.categoryId || filters.subcategoryId) && (
            <button
              type="button"
              onClick={() =>
                onChangeFilters({ ...filters, categoryId: null, subcategoryId: null })
              }
              className="text-xs font-medium text-[#1E3A8A] hover:underline cursor-pointer"
            >
              Tutte
            </button>
          )}
        </div>

        <Accordion
          type="multiple"
          defaultValue={["motore", "frenante", "sospensioni"]}
          className="w-full"
        >
          {CATEGORY_TREE.map((group) => {
            const isGroupSelected = filters.categoryId === group.id && !filters.subcategoryId;
            return (
              <AccordionItem key={group.id} value={group.id}>
                <AccordionTrigger className="py-2.5 text-[13px]">
                  <span
                    className={cn(
                      isGroupSelected ? "text-[#1E3A8A] font-semibold" : "text-slate-800"
                    )}
                  >
                    {group.name}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 pl-1">
                    <li>
                      <button
                        type="button"
                        onClick={() =>
                          onChangeFilters({
                            ...filters,
                            categoryId: isGroupSelected ? null : group.id,
                            subcategoryId: null,
                          })
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors duration-150 cursor-pointer",
                          isGroupSelected
                            ? "bg-[#1E3A8A]/8 font-semibold text-[#1E3A8A]"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <span>Tutti in {group.name.split(" ")[0]}</span>
                        <span className="tabular-nums text-slate-400">
                          {group.subcategories.reduce((acc, sub) => acc + sub.count, 0)}
                        </span>
                      </button>
                    </li>
                    {group.subcategories.map((sub) => {
                      const active = filters.subcategoryId === sub.id;
                      return (
                        <li key={sub.id}>
                          <button
                            type="button"
                            onClick={() =>
                              onChangeFilters({
                                ...filters,
                                categoryId: group.id,
                                subcategoryId: active ? null : sub.id,
                              })
                            }
                            className={cn(
                              "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors duration-150 cursor-pointer",
                              active
                                ? "bg-[#1E3A8A]/8 font-semibold text-[#1E3A8A]"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                          >
                            <span className="truncate pr-2">{sub.name}</span>
                            <span className="tabular-nums text-slate-400">{sub.count}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <Separator />

      {/* Compatibilità Anno Da / A */}
      <div className="py-4">
        <span className="mb-3 block text-xs font-semibold tracking-wide text-slate-500">
          Compatibilità (Anno Veicolo)
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label
              htmlFor="compat-year-from"
              className="mb-1 block text-[11px] font-medium text-slate-500"
            >
              Da
            </label>
            <Select
              value={String(filters.yearFrom)}
              onValueChange={(val) => {
                const nextFrom = Number(val);
                onChangeFilters({
                  ...filters,
                  yearFrom: nextFrom,
                  yearTo: Math.max(nextFrom, filters.yearTo),
                });
              }}
            >
              <SelectTrigger id="compat-year-from" className="h-9 text-xs tabular-nums">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPAT_YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)} className="tabular-nums">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label
              htmlFor="compat-year-to"
              className="mb-1 block text-[11px] font-medium text-slate-500"
            >
              A
            </label>
            <Select
              value={String(filters.yearTo)}
              onValueChange={(val) => {
                const nextTo = Number(val);
                onChangeFilters({
                  ...filters,
                  yearTo: nextTo,
                  yearFrom: Math.min(filters.yearFrom, nextTo),
                });
              }}
            >
              <SelectTrigger id="compat-year-to" className="h-9 text-xs tabular-nums">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPAT_YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)} className="tabular-nums">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Condizione */}
      <div className="py-4">
        <span className="mb-3 block text-xs font-semibold tracking-wide text-slate-500">
          Condizione Ricambio
        </span>
        <div className="space-y-2.5">
          {CONDITIONS.map((condition) => {
            const id = `cond-${condition.replace(/\s+/g, "-").toLowerCase()}`;
            const checked = filters.conditions.includes(condition);
            return (
              <label
                key={condition}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 hover:text-slate-900"
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() => toggleCondition(condition)}
                />
                <span>{condition}</span>
              </label>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Prezzo Slider */}
      <div className="py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-slate-500">
            Prezzo Netto (IVA escl.)
          </span>
          <span className="font-mono text-xs font-semibold tabular-nums text-[#1E3A8A]">
            €{filters.priceRange[0]} – €{filters.priceRange[1]}
          </span>
        </div>
        <Slider
          min={50}
          max={2000}
          step={25}
          value={filters.priceRange}
          onValueChange={(val) => {
            if (val.length === 2) {
              onChangeFilters({ ...filters, priceRange: [val[0], val[1]] });
            }
          }}
          aria-label="Fascia di prezzo in euro"
        />
        <div className="mt-1 flex justify-between text-[11px] tabular-nums text-slate-400">
          <span>€50</span>
          <span>€2.000</span>
        </div>
      </div>

      <Separator />

      {/* Solo Demolitori Verificati */}
      <div className="pt-4">
        <label
          htmlFor="verified-only-filter"
          className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700"
        >
          <Checkbox
            id="verified-only-filter"
            checked={filters.verifiedOnly}
            onCheckedChange={(checked) =>
              onChangeFilters({ ...filters, verifiedOnly: Boolean(checked) })
            }
            className="mt-0.5"
          />
          <span className="leading-snug">
            <span className="inline-flex items-center gap-1 font-medium text-slate-900">
              <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
              Solo Demolitori Verificati
            </span>
            <span className="block text-xs text-slate-500">
              Fornitori certificati con garanzia B2B
            </span>
          </span>
        </label>
      </div>
    </aside>
  );
}
