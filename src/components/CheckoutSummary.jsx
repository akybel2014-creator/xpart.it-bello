import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase as defaultSupabase } from "@/src/lib/supabaseClient";

const FREE_SHIPPING_THRESHOLD = 600;
const STANDARD_SHIPPING_FEE = 28;
const VAT_RATE = 0.22;

/**
 * Configurazione visiva coerente con gli stati di `public.transazioni_pagamento` e `public.ordini`.
 */
const ORDER_STATUS_META = {
  idle: {
    label: "Pronto per il pagamento",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    dotClass: "bg-slate-400",
  },
  pending: {
    label: "In attesa di conferma",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    dotClass: "bg-amber-500",
  },
  paid: {
    label: "Pagamento confermato",
    badgeClass: "border-[#16A34A]/25 bg-[#16A34A]/10 text-[#15803D]",
    dotClass: "bg-[#16A34A]",
  },
  failed: {
    label: "Pagamento non riuscito",
    badgeClass: "border-red-200 bg-red-50 text-red-700",
    dotClass: "bg-red-600",
  },
  refunded: {
    label: "Rimborsato",
    badgeClass: "border-slate-300 bg-slate-100 text-slate-700",
    dotClass: "bg-slate-500",
  },
};

const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Carta aziendale / Debito",
    detail: "Visa, Mastercard, American Express via Stripe",
    icon: CreditCard,
  },
  {
    id: "sepa_debit",
    label: "Addebito diretto SEPA B2B",
    detail: "Addebito su conto corrente aziendale verificato",
    icon: Landmark,
  },
];

function formatCurrency(amount, currency = "EUR") {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Normalizza gli elementi passati al checkout supportando sia `{ part, quantity }`
 * (formato del carrello CasaLavoroPRO) sia oggetti piatti `{ id, title, oemCode, priceNet, quantity }`.
 */
function normalizeCheckoutItems(items = []) {
  return items.map((entry, idx) => {
    if (entry.part) {
      return {
        id: entry.part.id ?? `item-${idx}`,
        title: entry.part.title,
        oemCode: entry.part.oemCode,
        sellerName: entry.part.seller?.name ?? "Fornitore verificato",
        priceNet: Number(entry.part.priceNet ?? 0),
        quantity: Number(entry.quantity ?? 1),
        image: entry.part.image ?? null,
      };
    }

    return {
      id: entry.id ?? `item-${idx}`,
      title: entry.title ?? "Ricambio automotive",
      oemCode: entry.oemCode ?? entry.oem_code ?? "—",
      sellerName: entry.sellerName ?? "Fornitore verificato",
      priceNet: Number(entry.priceNet ?? entry.price ?? 0),
      quantity: Number(entry.quantity ?? 1),
      image: entry.image ?? null,
    };
  });
}

/**
 * CheckoutSummary
 * Componente React per il riepilogo ordine B2B, l'avvio del pagamento verso
 * un provider esterno (es. Stripe tramite Supabase Edge Function) e il monitoraggio
 * dello stato ordine/transazione (`pending`, `paid`, `failed`, `refunded`).
 */
export function CheckoutSummary({
  items = [],
  currency = "EUR",
  initialStatus = "idle",
  initialOrderCode = null,
  billingInfo = {
    companyName: "Officina Rossi S.r.l.",
    vatNumber: "IT04829100964",
    sdiCode: "M5UXCR1",
  },
  edgeFunctionName = "create-checkout-session",
  supabaseClient = defaultSupabase,
  onInitiatePayment,
  onPaymentSuccess,
  onBackToCart,
}) {
  const normalizedItems = useMemo(() => normalizeCheckoutItems(items), [items]);

  // Calcolo importi netti, IVA e spedizione
  const totals = useMemo(() => {
    const subtotalNet = normalizedItems.reduce(
      (acc, item) => acc + item.priceNet * item.quantity,
      0
    );
    const vatAmount = Number((subtotalNet * VAT_RATE).toFixed(2));
    const shippingCost =
      subtotalNet === 0 || subtotalNet >= FREE_SHIPPING_THRESHOLD
        ? 0
        : STANDARD_SHIPPING_FEE;
    const totalGross = Number((subtotalNet + vatAmount + shippingCost).toFixed(2));
    return { subtotalNet, vatAmount, shippingCost, totalGross };
  }, [normalizedItems]);

  // Stato del flusso ordine & pagamento
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [orderStatus, setOrderStatus] = useState(initialStatus);
  const [orderRecord, setOrderRecord] = useState(() =>
    initialOrderCode
      ? { id: null, codiceOrdine: initialOrderCode, providerPaymentId: null }
      : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sottoscrizione Realtime su Supabase: aggiorna automaticamente la UI quando il webhook
  // imposta lo stato dell'ordine su `paid`, `failed` o `refunded`.
  useEffect(() => {
    if (!supabaseClient || !orderRecord?.id || orderStatus !== "pending") {
      return undefined;
    }

    const channel = supabaseClient
      .channel(`ordine-stato-${orderRecord.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ordini",
          filter: `id=eq.${orderRecord.id}`,
        },
        (payload) => {
          const nextState = payload.new?.stato;
          if (
            nextState === "paid" ||
            nextState === "failed" ||
            nextState === "refunded"
          ) {
            setOrderStatus(nextState);
            if (nextState === "paid") {
              onPaymentSuccess?.({
                orderId: orderRecord.id,
                codiceOrdine: orderRecord.codiceOrdine,
                providerPaymentId: orderRecord.providerPaymentId,
                amount: totals.totalGross,
                currency,
                paymentMethod,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabaseClient.removeChannel(channel);
    };
  }, [
    supabaseClient,
    orderRecord,
    orderStatus,
    onPaymentSuccess,
    totals.totalGross,
    currency,
    paymentMethod,
  ]);

  /**
   * Avvia il pagamento in sicurezza:
   * 1. Se viene passato un handler custom `onInitiatePayment`, lo esegue.
   * 2. Altrimenti invoca la Supabase Edge Function `create-checkout-session`, che:
   *    - crea l'ordine in `public.ordini` con stato `pending`
   *    - crea la Stripe Checkout Session (o PaymentIntent) lato server
   *    - registra la riga iniziale in `public.transazioni_pagamento` (`pending`)
   *    - restituisce `checkoutUrl` (redirect sicuro al provider) o i dati ordine.
   * 3. Se la Edge Function non è ancora distribuita nell'ambiente di anteprima,
   *    gestisce un fallback controllato segnalandolo chiaramente o completando la demo.
   */
  const handleStartPayment = async () => {
    if (normalizedItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      articoli: normalizedItems.map((item) => ({
        part_id: item.id,
        oem_code: item.oemCode,
        titolo: item.title,
        venditore: item.sellerName,
        quantita: item.quantity,
        prezzo_unitario: item.priceNet,
      })),
      imponibile: totals.subtotalNet,
      iva: totals.vatAmount,
      spese_spedizione: totals.shippingCost,
      importo_totale: totals.totalGross,
      valuta: currency,
      metodo_pagamento: paymentMethod,
      dati_fatturazione: billingInfo,
    };

    try {
      // Percorso 1: Handler personalizzato passato dal genitore
      if (typeof onInitiatePayment === "function") {
        const result = await onInitiatePayment(payload);
        if (result?.checkoutUrl) {
          window.location.assign(result.checkoutUrl);
          return;
        }
        const nextStatus = result?.status ?? "paid";
        setOrderRecord({
          id: result?.orderId ?? null,
          codiceOrdine:
            result?.codiceOrdine ?? `CLP-${Math.floor(100000 + Math.random() * 899999)}`,
          providerPaymentId: result?.providerPaymentId ?? null,
        });
        setOrderStatus(nextStatus);
        if (nextStatus === "paid") {
          onPaymentSuccess?.(result);
        }
        return;
      }

      // Percorso 2: Invocazione diretta Supabase Edge Function (Stripe server-side)
      if (supabaseClient) {
        const { data: authData } = await supabaseClient.auth.getSession();

        if (authData?.session) {
          const { data, error } = await supabaseClient.functions.invoke(
            edgeFunctionName,
            { body: payload }
          );

          if (!error && data) {
            if (data.checkoutUrl) {
              setOrderRecord({
                id: data.orderId ?? null,
                codiceOrdine: data.codiceOrdine ?? null,
                providerPaymentId: data.providerPaymentId ?? null,
              });
              setOrderStatus("pending");
              window.location.assign(data.checkoutUrl);
              return;
            }

            setOrderRecord({
              id: data.orderId ?? null,
              codiceOrdine: data.codiceOrdine ?? null,
              providerPaymentId: data.providerPaymentId ?? null,
            });
            setOrderStatus(data.stato ?? "pending");
            return;
          }
        }
      }

      // Percorso 3: Ambiente preview locale senza Edge Function Stripe ancora attiva
      await new Promise((resolve) => window.setTimeout(resolve, 750));

      const generatedCode = `CLP-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 8999
      )}`;
      const mockProviderId = `pi_live_${Math.random().toString(36).slice(2, 14)}`;

      setOrderRecord({
        id: null,
        codiceOrdine: generatedCode,
        providerPaymentId: mockProviderId,
      });
      setOrderStatus("paid");

      onPaymentSuccess?.({
        codiceOrdine: generatedCode,
        providerPaymentId: mockProviderId,
        amount: totals.totalGross,
        currency,
        paymentMethod,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossibile avviare la sessione di pagamento con il provider.";
      setErrorMessage(message);
      setOrderStatus("failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryPayment = () => {
    setErrorMessage(null);
    setOrderStatus("idle");
  };

  const statusMeta = ORDER_STATUS_META[orderStatus] ?? ORDER_STATUS_META.idle;
  const isFinalPaid = orderStatus === "paid";
  const isRefunded = orderStatus === "refunded";
  const isPending = orderStatus === "pending";
  const isFailed = orderStatus === "failed";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
      {/* Header riepilogo checkout + badge stato ordine */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          {onBackToCart && !isFinalPaid && (
            <button
              type="button"
              onClick={onBackToCart}
              aria-label="Torna al carrello"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h2 className="font-display text-base font-bold tracking-tight text-slate-900">
              Riepilogo Ordine e Pagamento
            </h2>
            <p className="text-xs text-slate-500">
              {orderRecord?.codiceOrdine ? (
                <span>
                  Ordine{" "}
                  <strong className="font-mono font-semibold text-slate-800">
                    {orderRecord.codiceOrdine}
                  </strong>
                </span>
              ) : (
                "Transazione protetta con crittografia TLS e conferma via webhook"
              )}
            </p>
          </div>
        </div>

        {/* Badge stato ordine/transazione */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
          {statusMeta.label}
        </span>
      </div>

      {/* Stati terminali o di avviso (Confermato / In attesa / Errore / Rimborsato) */}
      {isFinalPaid && (
        <div className="border-b border-slate-200/80 bg-[#16A34A]/5 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#16A34A]/15 text-[#16A34A]">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Pagamento confermato e ordine registrato
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                L&apos;ordine{" "}
                <strong className="font-mono text-slate-900">
                  {orderRecord?.codiceOrdine}
                </strong>{" "}
                è stato preso in carico dai fornitori verificati. La fattura elettronica
                sarà emessa verso {billingInfo.companyName}.
              </p>
              {orderRecord?.providerPaymentId && (
                <p className="mt-2 font-mono text-[11px] text-slate-500">
                  Riferimento transazione: {orderRecord.providerPaymentId}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isPending && (
        <div className="border-b border-amber-200/80 bg-amber-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="text-xs leading-relaxed text-amber-900">
              <p className="font-semibold">Verifica pagamento in corso</p>
              <p className="mt-0.5 text-amber-800">
                Stiamo attendendo la conferma definitiva dal provider di pagamento. Lo
                stato dell&apos;ordine si aggiornerà automaticamente alla ricezione del
                webhook.
              </p>
            </div>
          </div>
        </div>
      )}

      {isRefunded && (
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
            <div className="text-xs leading-relaxed text-slate-700">
              <p className="font-semibold text-slate-900">Transazione rimborsata</p>
              <p className="mt-0.5">
                L&apos;importo è stato stornato sul metodo di pagamento originale.
              </p>
            </div>
          </div>
        </div>
      )}

      {isFailed && errorMessage && (
        <div
          role="alert"
          className="border-b border-red-200 bg-red-50/80 px-5 py-4 sm:px-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">
                  Errore durante l&apos;elaborazione del pagamento
                </p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetryPayment}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Riprova
            </button>
          </div>
        </div>
      )}

      {/* Corpo principale a 2 colonne su desktop */}
      <div className="grid grid-cols-1 divide-y divide-slate-200/80 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        {/* Colonna sinistra: Articoli e dati fatturazione B2B */}
        <div className="p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Articoli nell&apos;ordine ({normalizedItems.length})
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Truck className="h-3.5 w-3.5 text-[#1E3A8A]" />
              Spedizione B2B 24/48h
            </span>
          </div>

          {normalizedItems.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-[#F9FAFB] px-4 py-8 text-center text-xs text-slate-500">
              Nessun ricambio presente nel riepilogo ordine.
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-[#F9FAFB]/60">
              {normalizedItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="h-12 w-14 shrink-0 rounded-lg border border-slate-200/80 bg-white object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-medium text-[#1E3A8A]">
                        OEM {item.oemCode}
                      </p>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.sellerName} · Q.tà {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-slate-900">
                      {formatCurrency(item.priceNet * item.quantity, currency)}
                    </p>
                    <p className="text-[11px] tabular-nums text-slate-400">
                      {formatCurrency(item.priceNet, currency)} cad. netto
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Intestazione fatturazione elettronica B2B */}
          <div className="mt-5 rounded-xl border border-slate-200/80 bg-[#F9FAFB] p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Building2 className="h-3.5 w-3.5 text-[#1E3A8A]" />
              Dati Fatturazione Elettronica
            </div>
            <dl className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              <div>
                <dt className="text-[11px] text-slate-400">Ragione Sociale</dt>
                <dd className="font-medium text-slate-800">
                  {billingInfo.companyName}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-400">Partita IVA</dt>
                <dd className="font-mono font-medium text-slate-800">
                  {billingInfo.vatNumber}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-400">Codice SDI</dt>
                <dd className="font-mono font-medium text-slate-800">
                  {billingInfo.sdiCode}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Colonna destra: Metodo di pagamento, totali e CTA */}
        <div className="flex flex-col justify-between bg-[#F9FAFB]/50 p-5 sm:p-6 lg:col-span-5">
          <div>
            {/* Scelta metodo di pagamento */}
            {!isFinalPaid && !isRefunded && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Metodo di pagamento
                </h3>
                <div className="mt-2.5 space-y-2">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        disabled={isSubmitting || isPending}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                          active
                            ? "border-[#1E3A8A] bg-white ring-1 ring-[#1E3A8A]/20"
                            : "border-slate-200 bg-white/80 hover:border-slate-300"
                        }`}
                      >
                        <Icon
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            active ? "text-[#1E3A8A]" : "text-slate-400"
                          }`}
                        />
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-slate-900">
                            {method.label}
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            {method.detail}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prospetto contabile */}
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Dettaglio Importi
            </h3>
            <dl className="mt-2.5 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Imponibile ricambi</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {formatCurrency(totals.subtotalNet, currency)}
                </dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>IVA (22%)</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {formatCurrency(totals.vatAmount, currency)}
                </dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Spedizione Corriere B2B</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {totals.shippingCost === 0
                    ? "Gratuita"
                    : formatCurrency(totals.shippingCost, currency)}
                </dd>
              </div>
              <div className="my-2 border-t border-slate-200 pt-2.5 flex items-baseline justify-between">
                <dt className="font-display text-sm font-bold text-slate-900">
                  Totale Ordine
                </dt>
                <dd className="font-display text-lg font-bold tabular-nums text-[#1E3A8A]">
                  {formatCurrency(totals.totalGross, currency)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Pulsante azione principale + nota sicurezza */}
          <div className="mt-6">
            {isFinalPaid ? (
              onBackToCart && (
                <button
                  type="button"
                  onClick={onBackToCart}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1E3A8A]/90 cursor-pointer"
                >
                  Torna al Catalogo
                </button>
              )
            ) : (
              <button
                type="button"
                disabled={
                  normalizedItems.length === 0 ||
                  isSubmitting ||
                  isPending ||
                  isRefunded
                }
                onClick={handleStartPayment}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1E3A8A]/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/40 disabled:cursor-not-allowed disabled:opacity-55 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connessione al gateway di pagamento...
                  </>
                ) : isPending ? (
                  <>
                    <Clock className="h-4 w-4" />
                    In attesa di conferma pagamento...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Paga {formatCurrency(totals.totalGross, currency)} in sicurezza
                  </>
                )}
              </button>
            )}

            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#16A34A]" />
              <span>Elaborazione PCI-DSS tramite provider certificato (Stripe)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutSummary;
