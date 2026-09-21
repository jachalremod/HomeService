import { notFound } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { openCustomerCheckout } from "./actions";

type CustomerPortalPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    message?: string;
    payment?: string;
  }>;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function date(value: string | null) {
  if (!value) return "Not specified";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default async function CustomerPortalPage({
  params,
  searchParams,
}: CustomerPortalPageProps) {
  const { token } = await params;
  const { message, payment } = await searchParams;
  const admin = createAdminClient();

  const { data: invoice } = await admin
    .from("invoices")
    .select(
      "*, customers(*), estimates(*, estimate_items(*)), payment_schedules(*), payments(*)",
    )
    .eq("public_token", token)
    .single();

  if (!invoice) {
    notFound();
  }

  const { data: business } = await admin
    .from("business_profiles")
    .select("*")
    .eq("organization_id", invoice.organization_id)
    .maybeSingle();

  const customer = invoice.customers;
  const estimate = invoice.estimates;

  const items = [...(estimate?.estimate_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const schedules = [...(invoice.payment_schedules ?? [])].sort(
    (a, b) => a.sequence - b.sequence,
  );

  const payments = invoice.payments ?? [];

  const totalPaid = payments.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );

  const remainingBalance = Math.max(
    Number(invoice.total) - totalPaid,
    0,
  );

  const scheduleTitleById = new Map(schedules.map((s) => [s.id, s.title]));
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime(),
  );

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        {payment === "success" ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 print:hidden">
            <p className="flex items-center gap-2 font-bold">
              <CheckCircle2 size={20} />
              Payment submitted successfully
            </p>
          </div>
        ) : null}

        {payment === "cancelled" ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900 print:hidden">
            No payment was processed. You can try again when ready.
          </div>
        ) : null}

        {message ? (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-900 print:hidden">
            {message}
          </div>
        ) : null}

        <div className="mb-4 flex justify-end print:hidden">
          <a href={`/api/portal/${token}/estimate-pdf`} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
            Open/Print PDF
          </a>
        </div>

        <article className="mx-auto max-w-4xl bg-white p-8 shadow-lg sm:p-12 print:max-w-none print:shadow-none">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Invoice</p>

          <header className="mt-6 grid gap-8 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              {business?.logo_url ? (
                <div
                  role="img"
                  aria-label={`${business.company_name} logo`}
                  className="size-14 shrink-0 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url("${business.logo_url}")` }}
                />
              ) : (
                <div className="flex size-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <Building2 size={24} />
                </div>
              )}
              <div className="text-xs leading-5 text-slate-500">
                <p className="text-sm font-bold text-slate-900">{business?.company_name ?? "ServiceAxiom Contractor"}</p>
                {business?.phone ? <p>Phone: {business.phone}</p> : null}
                {business?.email ? <p>Email: {business.email}</p> : null}
                {business?.license_number ? <p>License #{business.license_number}</p> : null}
              </div>
            </div>

            <div className="text-xs leading-5 text-slate-500 sm:text-right">
              <p className="font-semibold text-slate-700">Bill To</p>
              <p className="text-sm font-bold text-slate-900">{customer?.first_name} {customer?.last_name}</p>
              {customer?.project_address ? (
                <p>{customer.project_address}{customer.city ? `, ${customer.city}` : ""}{customer.state ? `, ${customer.state}` : ""}</p>
              ) : null}
              <div className="mt-3">
                <p>Invoice #: <span className="font-semibold text-slate-700">{invoice.invoice_number}</span></p>
                <p>Date: <span className="font-semibold text-slate-700">{date(invoice.created_at)}</span></p>
                {estimate?.title ? <p>Project: <span className="font-semibold text-slate-700">{estimate.title}</span></p> : null}
              </div>
            </div>
          </header>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-slate-900 text-left text-xs font-bold uppercase text-slate-500">
                  <th className="w-auto pb-2">Description</th>
                  <th className="w-20 pb-2 text-right">Qty</th>
                  <th className="w-28 pb-2 text-right">Rate</th>
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
                    <td className="py-4 text-right text-slate-600">{Number(item.quantity)}</td>
                    <td className="py-4 text-right text-slate-600">{money(Number(item.unit_price))}</td>
                    <td className="py-4 text-right font-semibold">{money(Number(item.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="ml-auto mt-6 max-w-xs space-y-2 text-sm">
            <div className="flex justify-between border-t border-slate-200 pt-3"><dt className="text-slate-600">Invoice total</dt><dd className="font-semibold text-slate-900">{money(Number(invoice.total))}</dd></div>
            <div className="flex justify-between text-emerald-700"><dt>Payments received</dt><dd className="font-semibold">-{money(totalPaid)}</dd></div>
            <div className="flex justify-between border-t border-slate-900 pt-3 text-base"><dt className="font-bold text-slate-950">Balance due</dt><dd className="font-bold text-slate-950">{money(remainingBalance)}</dd></div>
          </dl>

          {sortedPayments.length > 0 ? (
            <section className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-sm font-bold text-slate-900">Payment history</h3>
              <div className="mt-3 space-y-2">
                {sortedPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {p.payment_schedule_id ? scheduleTitleById.get(p.payment_schedule_id) ?? "Payment" : "Payment"}
                      </p>
                      <p className="text-xs text-slate-500">{date(p.paid_at)}</p>
                    </div>
                    <p className="font-bold text-emerald-700">{money(Number(p.amount))}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <section className="mt-8 print:hidden">
          <h2 className="text-xl font-bold text-slate-950">
            Payment schedule
          </h2>

          <div className="mt-4 space-y-4">
            {schedules.map((schedule) => {
              const paid = payments
                .filter(
                  (item) =>
                    item.payment_schedule_id === schedule.id,
                )
                .reduce(
                  (sum, item) => sum + Number(item.amount),
                  0,
                );

              const remaining = Math.max(
                Number(schedule.amount) - paid,
                0,
              );

              return (
                <article
                  key={schedule.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-3">
                        {remaining === 0 ? (
                          <CheckCircle2
                            className="text-emerald-600"
                            size={22}
                          />
                        ) : (
                          <CircleDollarSign
                            className="text-blue-600"
                            size={22}
                          />
                        )}

                        <h3 className="font-bold text-slate-950">
                          {schedule.sequence}. {schedule.title}
                        </h3>
                      </div>

                      {schedule.due_event ? (
                        <p className="mt-2 text-sm text-slate-600">
                          {schedule.due_event}
                        </p>
                      ) : null}

                      <p className="mt-1 text-sm text-slate-500">
                        {Number(schedule.percentage)}% of invoice
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xl font-bold text-slate-950">
                        {money(remaining)}
                      </p>

                      {remaining > 0 ? (
                        <form
                          action={openCustomerCheckout}
                          className="mt-3"
                        >
                          <input
                            type="hidden"
                            name="token"
                            value={invoice.public_token}
                          />
                          <input
                            type="hidden"
                            name="scheduleId"
                            value={schedule.id}
                          />

                          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                            <CreditCard size={17} />
                            Pay securely
                          </button>
                        </form>
                      ) : (
                        <span className="mt-2 inline-block font-semibold text-emerald-700">
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}