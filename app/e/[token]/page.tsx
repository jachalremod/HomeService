/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { declineEstimatePublic } from "./actions";
import SignaturePad from "./signature-pad";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function date(value: string | null) {
  if (!value) return "Not specified";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export default async function PublicEstimatePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { token } = await params;
  const { message } = await searchParams;
  const admin = createAdminClient();
  const { data: estimate } = await admin.from("estimates")
    .select("*, customers(*), estimate_items(*)")
    .eq("public_token", token).is("deleted_at", null).single();
  if (!estimate) notFound();
  const { data: business } = await admin.from("business_profiles").select("*").eq("organization_id", estimate.organization_id).maybeSingle();
  const customer = estimate.customers;
  const items = [...(estimate.estimate_items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const terms = estimate.terms || business?.default_terms;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 print:bg-white print:p-0">
      <article className="mx-auto max-w-4xl bg-white p-8 shadow-lg sm:p-12 print:max-w-none print:shadow-none">
        <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Estimate</p>

        {message ? (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-900 print:hidden">
            {message}
          </div>
        ) : null}

        <header className="mt-6 grid gap-8 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            {business?.logo_url ? (
              <img src={business.logo_url} alt={`${business.company_name} logo`} className="size-14 object-contain" />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <Building2 size={24} />
              </div>
            )}
            <div className="text-xs leading-5 text-slate-500">
              <p className="text-sm font-bold text-slate-900">{business?.company_name ?? "ServiceAxiom Contractor"}</p>
              {business?.address ? <p>{business.address}</p> : null}
              {business?.city || business?.state || business?.postal_code ? (
                <p>{business?.city}{business?.city && business?.state ? ", " : ""}{business?.state} {business?.postal_code}</p>
              ) : null}
              {business?.phone ? <p>Phone: {business.phone}</p> : null}
              {business?.email ? <p>Email: {business.email}</p> : null}
            </div>
          </div>

          <div className="text-xs leading-5 text-slate-500 sm:text-right">
            <p className="font-semibold text-slate-700">Prepared For</p>
            <p className="text-sm font-bold text-slate-900">{customer?.first_name} {customer?.last_name}</p>
            {customer?.project_address ? (
              <p>{customer.project_address}{customer.city ? `, ${customer.city}` : ""}{customer.state ? `, ${customer.state}` : ""}</p>
            ) : null}
            <div className="mt-3">
              <p>Estimate #: <span className="font-semibold text-slate-700">{estimate.estimate_number}</span></p>
              <p>Date: <span className="font-semibold text-slate-700">{date(estimate.created_at?.slice(0, 10) ?? null)}</span></p>
              {estimate.expires_at ? <p>Valid until: <span className="font-semibold text-slate-700">{date(estimate.expires_at)}</span></p> : null}
            </div>
          </div>
        </header>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-slate-900 text-left text-xs font-bold uppercase text-slate-500">
                <th className="w-auto pb-2">Description</th>
                {estimate.show_quantity ? <th className="w-20 pb-2 text-right">Qty</th> : null}
                {estimate.show_rate ? <th className="w-28 pb-2 text-right">Rate</th> : null}
                <th className="w-28 pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 align-top">
                  <td className="break-words py-4 pr-4">
                    <p className="font-bold text-slate-950">{item.title}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{item.description}</p>
                  </td>
                  {estimate.show_quantity ? <td className="py-4 text-right text-slate-600">{Number(item.quantity)}</td> : null}
                  {estimate.show_rate ? <td className="py-4 text-right text-slate-600">{money(Number(item.unit_price))}</td> : null}
                  <td className="py-4 text-right font-semibold">{money(Number(item.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-6 max-w-xs space-y-2 text-sm">
          <div className="flex justify-between border-t border-slate-200 pt-3"><dt className="text-slate-600">Subtotal</dt><dd className="font-semibold text-slate-900">{money(Number(estimate.subtotal))}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-600">Tax</dt><dd className="font-semibold text-slate-900">{money(Number(estimate.tax_amount))}</dd></div>
          <div className="flex justify-between border-t border-slate-900 pt-3 text-base"><dt className="font-bold text-slate-950">Total</dt><dd className="font-bold text-slate-950">{money(Number(estimate.total))}</dd></div>
        </dl>

        {Array.isArray(estimate.payment_schedule) && estimate.payment_schedule.length > 0 ? (
          <section className="mt-8">
            <h3 className="text-sm font-bold text-slate-900">Payment Schedule</h3>
            <div className="mt-3 max-w-xs space-y-1.5 text-sm">
              {estimate.payment_schedule.map((schedule: { title: string; percentage: number }, index: number) => (
                <div key={index} className="flex justify-between">
                  <span className="text-slate-600">{schedule.title} ({schedule.percentage}%)</span>
                  <span className="font-semibold text-slate-900">{money(Number(estimate.total) * (schedule.percentage / 100))}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {estimate.notes ? (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-900">Notes</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{estimate.notes}</p>
          </section>
        ) : null}

        {terms ? (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-900">Contract and terms</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{terms}</p>
          </section>
        ) : null}

        {estimate.status === "draft" || estimate.status === "sent" ? (
          <div className="print:hidden">
            <SignaturePad token={token} />

            <form action={declineEstimatePublic} className="mt-3">
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="w-full text-center text-sm font-semibold text-slate-500 hover:text-red-600 hover:underline">
                Decline this estimate
              </button>
            </form>
          </div>
        ) : null}

        {estimate.status === "approved" && estimate.customer_signature ? (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-bold text-emerald-900">Approved and signed</p>
            <img src={estimate.customer_signature} alt="Customer signature" className="mt-3 h-20 w-auto" />
            <p className="mt-2 text-xs text-emerald-700">
              Signed by {estimate.customer_signed_name} on{" "}
              {new Date(estimate.customer_signed_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        ) : null}

        {estimate.status === "declined" ? (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm font-bold text-red-900">This estimate has been declined.</p>
          </div>
        ) : null}

        <div className="mt-10 print:hidden">
          <p className="text-center text-xs text-slate-400">Estimate provided securely by {business?.company_name ?? "your contractor"}.</p>
        </div>
      </article>
    </main>
  );
}
