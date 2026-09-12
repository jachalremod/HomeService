import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { approveEstimate, markEstimateSent } from "./actions";
import EstimateActionsMenu from "./estimate-actions-menu";
import SendEstimateButtons from "./send-estimate-buttons";

type EstimatePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    message?: string;
  }>;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function date(value: string | null) {
  if (!value) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function EstimatePage({
  params,
  searchParams,
}: EstimatePageProps) {
  const { id } = await params;
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*, customers(*), estimate_items(*)")
    .eq("id", id)
    .order("sort_order", {
      referencedTable: "estimate_items",
      ascending: true,
    })
    .single();

  if (!estimate) {
    notFound();
  }

  const { data: business } = await supabase
    .from("business_profiles")
    .select("*")
    .maybeSingle();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, invoice_number")
    .eq("estimate_id", estimate.id)
    .maybeSingle();

  const customer = estimate.customers;
  const items = estimate.estimate_items ?? [];
  const terms = estimate.terms || business?.default_terms;

  const documentColumnCount =
    2 +
    Number(estimate.show_quantity) +
    Number(estimate.show_rate);

  const lineItemWidth =
    estimate.show_quantity && estimate.show_rate
      ? "55%"
      : estimate.show_quantity || estimate.show_rate
        ? "75%"
        : "85%";

  return (
    <>
      <div className="no-print mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <Link
          href="/estimates"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to estimates
        </Link>

        <div className="flex flex-wrap gap-3">
          <EstimateActionsMenu
            estimateId={estimate.id}
            status={estimate.status}
            hasInvoice={Boolean(invoice)}
            showQuantity={estimate.show_quantity}
            showRate={estimate.show_rate}
          />

                                 <SendEstimateButtons
            estimateId={estimate.id}
            customerEmail={customer?.email ?? null}
          />

          {estimate.status === "draft" ? (
            <form action={markEstimateSent}>
              <input
                type="hidden"
                name="estimateId"
                value={estimate.id}
              />

              <button className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                <Send size={18} />
                Mark sent
              </button>
            </form>
          ) : null}

          {estimate.status === "draft" ||
          estimate.status === "sent" ? (
            <form action={approveEstimate}>
              <input
                type="hidden"
                name="estimateId"
                value={estimate.id}
              />

              <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">
                <CheckCircle2 size={18} />
                Approve estimate
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {message ? (
        <div className="no-print mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

      {estimate.status === "approved" ? (
        <div className="no-print mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-emerald-950">
              Estimate approved
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              The approved estimate is ready for invoicing.
            </p>
          </div>

          <Link
            href={
              invoice
                ? `/invoices/${invoice.id}`
                : `/invoices/new?estimateId=${estimate.id}`
            }
            className="rounded-xl bg-emerald-700 px-4 py-3 text-center font-semibold text-white"
          >
            {invoice
              ? `Open invoice ${invoice.invoice_number}`
              : "Create invoice and payment schedule"}
          </Link>
        </div>
      ) : null}

      <article className="estimate-print-document overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
        <header className="grid gap-8 bg-slate-950 p-8 text-white md:grid-cols-2">
          <div>
            <div className="flex items-start gap-4">
              {business?.logo_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={business.logo_url}
                    alt={`${business.company_name} logo`}
                    width={64}
                    height={64}
                    className="size-16 shrink-0 rounded-xl bg-white object-contain"
                  />
                </>
              ) : (
                <div className="flex size-12 items-center justify-center rounded-xl bg-blue-600">
                  <Building2 size={25} />
                </div>
              )}

              <div>
                <p className="text-xl font-bold">
                  {business?.company_name ??
                    "ServiceAxiom Contractor"}
                </p>


                {business?.phone ? (
                  <p className="mt-1 text-sm text-slate-400">
                    {business.phone}
                  </p>
                ) : null}

                {business?.email ? (
                  <p className="text-sm text-slate-400">
                    {business.email}
                  </p>
                ) : null}

                {business?.license_number ? (
                  <p className="mt-1 text-xs text-slate-400">
                    License: {business.license_number}
                  </p>
                ) : null}
              </div>
            </div>

            <h1 className="mt-10 text-4xl font-bold tracking-tight">
              ESTIMATE
            </h1>
          </div>

          <dl className="space-y-3 md:text-right">
            <div>
              <dt className="text-sm text-slate-400">
                Estimate number
              </dt>
              <dd className="font-bold">{estimate.estimate_number}</dd>
            </div>

            <div>
              <dt className="text-sm text-slate-400">Created</dt>
              <dd className="font-semibold">
                {date(estimate.created_at)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-400">
                Valid until
              </dt>
              <dd className="font-semibold">
                {date(estimate.expires_at)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-400">Status</dt>
              <dd className="font-bold capitalize text-blue-300">
                {estimate.status}
              </dd>
            </div>
          </dl>
        </header>

        <div className="p-6 sm:p-8">
          <section className="grid gap-8 border-b border-slate-200 pb-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Prepared for
              </p>

              <p className="mt-3 text-lg font-bold text-slate-950">
                {customer?.first_name} {customer?.last_name}
              </p>

              {customer?.email ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={16} />
                  {customer.email}
                </p>
              ) : null}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Project location
              </p>

              {customer?.project_address ? (
                <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-700">
                  <MapPin className="mt-1 shrink-0" size={16} />
                  <span>
                    {customer.project_address}
                    {customer.city ? `, ${customer.city}` : ""}
                    {customer.state ? `, ${customer.state}` : ""}
                    {customer.postal_code
                      ? ` ${customer.postal_code}`
                      : ""}
                  </span>
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No project address provided
                </p>
              )}
            </div>
          </section>

          <section className="border-b border-slate-200 py-8">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Project
            </p>

            <h2 className="mt-3 text-2xl font-bold text-slate-950">
              {estimate.title}
            </h2>


          </section>

          <section className="w-full overflow-hidden py-8">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b-2 border-slate-900 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th
                    className="pb-3"
                    style={{ width: lineItemWidth }}
                  >
                    Description
                  </th>

                  {estimate.show_quantity ? (
                    <th className="w-[15%] pb-3 text-right">
                      Quantity
                    </th>
                  ) : null}

                  {estimate.show_rate ? (
                    <th className="w-[15%] pb-3 text-right">
                      Rate
                    </th>
                  ) : null}

                  <th className="w-[15%] pb-3 text-right">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <Fragment key={item.id}>
                    <tr>
                      <td className="pt-5 pb-3">
                        <p className="font-bold text-slate-950">
                          {item.title}
                        </p>
                      </td>

                      {estimate.show_quantity ? (
                        <td className="pt-5 pb-3 text-right text-slate-600">
                          {Number(item.quantity)}
                        </td>
                      ) : null}

                      {estimate.show_rate ? (
                        <td className="pt-5 pb-3 text-right text-slate-600">
                          {money(Number(item.unit_price))}
                        </td>
                      ) : null}

                      <td className="pt-5 pb-3 text-right font-semibold text-slate-950">
                        {money(Number(item.amount))}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-200">
                      <td
                        colSpan={documentColumnCount}
                        className="max-w-0 pb-5"
                      >
                        <p className="max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-6 text-slate-700">
                          {item.description}
                        </p>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </section>

          <section className="ml-auto max-w-md border-t border-slate-200 pt-5">
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-slate-600">Subtotal</dt>
                <dd className="font-semibold text-slate-950">
                  {money(Number(estimate.subtotal))}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-slate-600">
                  Tax ({Number(estimate.tax_rate)}%)
                </dt>
                <dd className="font-semibold text-slate-950">
                  {money(Number(estimate.tax_amount))}
                </dd>
              </div>

              <div className="flex justify-between rounded-xl bg-blue-50 p-4 text-xl text-blue-950">
                <dt className="font-bold">Estimate total</dt>
                <dd className="font-bold">
                  {money(Number(estimate.total))}
                </dd>
              </div>
            </dl>
          </section>

          {estimate.notes || terms ? (
            <section className="mt-8 grid gap-6 border-t border-slate-200 pt-8 md:grid-cols-2">
              {estimate.notes ? (
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Notes
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {estimate.notes}
                  </p>
                </div>
              ) : null}

              {terms ? (
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Terms and conditions
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {terms}
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}

          {estimate.status === "approved" ? (
            <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-emerald-600"
                  size={24}
                />

                <div>
                  <h2 className="font-bold text-emerald-900">
                    Estimate approved
                  </h2>
                  <p className="mt-1 text-sm text-emerald-800">
                    Approved on {date(estimate.approved_at)}
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </article>
    </>
  );
}
