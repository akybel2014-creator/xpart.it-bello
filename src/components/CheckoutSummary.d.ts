import type { SupabaseClient } from "@supabase/supabase-js";
import type { AutoPart } from "@/src/data/parts";

export type PaymentStatus = "idle" | "pending" | "paid" | "failed" | "refunded";

export interface CheckoutBillingInfo {
  companyName: string;
  vatNumber: string;
  sdiCode: string;
}

export interface CheckoutItemInput {
  part?: AutoPart;
  id?: string;
  title?: string;
  oemCode?: string;
  oem_code?: string;
  sellerName?: string;
  priceNet?: number;
  price?: number;
  quantity: number;
  image?: string | null;
}

export interface CheckoutPaymentResult {
  orderId?: string | null;
  codiceOrdine?: string | null;
  providerPaymentId?: string | null;
  checkoutUrl?: string | null;
  status?: PaymentStatus;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
}

export interface CheckoutSummaryProps {
  items: CheckoutItemInput[];
  currency?: string;
  initialStatus?: PaymentStatus;
  initialOrderCode?: string | null;
  billingInfo?: CheckoutBillingInfo;
  edgeFunctionName?: string;
  supabaseClient?: SupabaseClient | null;
  onInitiatePayment?: (payload: Record<string, unknown>) => Promise<CheckoutPaymentResult>;
  onPaymentSuccess?: (result: CheckoutPaymentResult) => void;
  onBackToCart?: () => void;
}

export function CheckoutSummary(props: CheckoutSummaryProps): React.JSX.Element;
export default CheckoutSummary;
