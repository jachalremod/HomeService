import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PaymentScheduleForm from "./payment-schedule-form";

type NewInvoicePageProps = {
  searchParams: Promise<{
    estimateId?: string;
  }>;
};

export default async function NewInvoicePage({
  searchParams,
}: NewInvoicePageProps) {
  const { estimateId } = await searchParams;

  if (!estimateId) {
    notFound();
  }

  const supabase = await createClient();

  const { data: estimate } = await supabase
    .from("estimates")
    .select(
      "id, estimate_number, title, total, status, customers(first_name, last_name)",
    )
    .eq("id", estimateId)
    .eq("status", "approved")
    .single();

  if (!estimate) {
    notFound();
  }

  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("estimate_id", estimate.id)
    .maybeSingle();

  return (
    <>
      <div className="mb-8">
        <Link
          href={`/estimates/${estimate.id}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to estimate
        </Link>

        <h1 className="text-3xl font-bold text-slate-950">
          Create invoice
        </h1>

        <p className="mt-2 text-slate-600">
          {estimate.estimate_number} - {estimate.title} ·{" "}
          {estimate.customers?.first_name}{" "}
          {estimate.customers?.last_name}
        </p>
      </div>

      {existingInvoice ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <p className="font-semibold text-blue-950">
            This estimate already has an invoice.
          </p>

          <Link
            href="/invoices"
            className="mt-4 inline-block rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white"
          >
            View invoices
          </Link>
        </div>
      ) : (
        <PaymentScheduleForm
          estimateId={estimate.id}
          total={Number(estimate.total)}
        />
      )}
    </>
  );
}

