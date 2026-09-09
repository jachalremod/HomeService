import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Mail,
  MapPin,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createJob,
  createStripeCheckout,
  markInvoiceSent,
  recordPayment,
} from "./actions";
import PrintInvoiceButton from "./print-invoice-button";
import CopyPaymentLink from "./copy-payment-link";

type InvoicePageProps = {
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

export default async function InvoicePage({
  params,
  searchParams,
}: InvoicePageProps) {
  const { id } = await params;
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "*, customers(*), estimates(*, estimate_items(*)), payment_schedules(*), payments(*)",
    )
    .eq("id", id)
    .single();

  if (!invoice) {
    notFound();
  }

  const { data: business } = await supabase
    .from("business_profiles")
    .select("*")
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
  const firstPaymentIsPaid = schedules[0]?.status === "paid";

  const { data: existingJob } = await supabase
    .from("jobs")
    .select("id, job_number")
    .eq("invoice_id", invoice.id)
    .maybeSingle();

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const remainingBalance = Math.max(Number(invoice.total) - totalPaid, 0);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const customerPortalUrl =
    `${appUrl}/p/${invoice.public_token}`;

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to invoices
        </Link>

        <div className="flex flex-wrap gap-3">
          <PrintInvoiceButton />

        {invoice.status === "draft" ? (
          <form action={markInvoiceSent}>
            <input type="hidden" name="invoiceId" value={invoice.id} />

            <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
              <Send size={18} />
              Mark invoice sent
            </button>
          </form>
        ) : null}
        </div>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

      {firstPaymentIsPaid ? (
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-emerald-950">
              First scheduled payment received
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              This invoice is eligible for job creation.
            </p>
          </div>

          {existingJob ? (
            <Link
              href={`/jobs/${existingJob.id}`}
              className="rounded-xl bg-emerald-700 px-4 py-3 text-center font-semibold text-white"
            >
              Open {existingJob.job_number}
            </Link>
          ) : (
            <form action={createJob}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <button className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800">
                Create job
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-bold text-amber-950">Job creation locked</p>
          <p className="mt-1 text-sm text-amber-800">
            Record the first scheduled payment to unlock the job.
          </p>
        </div>
      )}

      <div className="no-print mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center">
        <div>
          <p className="font-bold text-blue-950">
            Customer invoice portal
          </p>
          <p className="mt-1 text-sm text-blue-800">
            Share this secure link with the customer.
          </p>
        </div>

        <CopyPaymentLink url={customerPortalUrl} />
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
        <header className="grid gap-8 bg-slate-950 p-8 text-white md:grid-cols-2">
          <div>
            <div className="flex items-start gap-4">
              {business?.logo_url ? (
                <div
                  role="img"
                  aria-label={`${business.company_name} logo`}
                  className="size-16 shrink-0 rounded-xl bg-white bg-contain bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url("${business.logo_url}")`,
                  }}
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-xl bg-blue-600">
                  <Building2 size={25} />
                </div>
              )}

              <div>
                <p className="text-xl font-bold">
                  {business?.company_name ?? "ServiceAxiom Contractor"}
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
              INVOICE
            </h1>
          </div>

          <dl className="space-y-3 md:text-right">
            <div>
              <dt className="text-sm text-slate-400">Invoice number</dt>
              <dd className="font-bold">{invoice.invoice_number}</dd>
            </div>

            <div>
              <dt className="text-sm text-slate-400">Estimate</dt>
              <dd className="font-semibold">{estimate?.estimate_number}</dd>
            </div>

            <div>
              <dt className="text-sm text-slate-400">Status</dt>
              <dd className="font-bold capitalize text-blue-300">
                {invoice.status.replace("_", " ")}
              </dd>
            </div>
          </dl>
        </header>

        <div className="p-6 sm:p-8">
          <section className="grid gap-6 border-b border-slate-200 pb-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Bill to
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

              {customer?.project_address ? (
                <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="mt-0.5 shrink-0" size={16} />
                  <span>
                    {customer.project_address}
                    {customer.city ? `, ${customer.city}` : ""}
                    {customer.state ? `, ${customer.state}` : ""}
                    {customer.postal_code ? ` ${customer.postal_code}` : ""}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="md:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Project
              </p>

              <p className="mt-3 text-lg font-bold text-slate-950">
                {estimate?.title}
              </p>


            </div>
          </section>

          <section className="overflow-x-auto py-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-900 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3">Line item / scope of work</th>
                  <th className="pb-3 text-right">Qty</th>
                  <th className="pb-3 text-right">Rate</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-4">
                      <p className="font-bold text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </td>
                    <td className="py-4 text-right text-slate-600">
                      {Number(item.quantity)}
                    </td>
                    <td className="py-4 text-right text-slate-600">
                      {money(Number(item.unit_price))}
                    </td>
                    <td className="py-4 text-right font-semibold text-slate-950">
                      {money(Number(item.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="ml-auto max-w-md border-t border-slate-200 pt-5">
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-slate-600">Subtotal</dt>
                <dd className="font-semibold">
                  {money(Number(invoice.subtotal))}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-slate-600">Tax</dt>
                <dd className="font-semibold">
                  {money(Number(invoice.tax_amount))}
                </dd>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-4 text-xl">
                <dt className="font-bold">Invoice total</dt>
                <dd className="font-bold">{money(Number(invoice.total))}</dd>
              </div>

              <div className="flex justify-between text-emerald-700">
                <dt className="font-semibold">Payments received</dt>
                <dd className="font-bold">-{money(totalPaid)}</dd>
              </div>

              <div className="flex justify-between rounded-xl bg-blue-50 p-4 text-xl text-blue-900">
                <dt className="font-bold">Balance due</dt>
                <dd className="font-bold">{money(remainingBalance)}</dd>
              </div>
            </dl>
          </section>
          {business?.default_terms ||
          business?.payment_instructions ? (
            <section className="mt-8 grid gap-5 border-t border-slate-200 pt-6 md:grid-cols-2">
              {business.default_terms ? (
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Terms
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {business.default_terms}
                  </p>
                </div>
              ) : null}

              {business.payment_instructions ? (
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Payment instructions
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {business.payment_instructions}
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </article>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-950">
            Payment schedule
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Every payment is recorded against this invoice.
          </p>
        </div>

        <div className="space-y-4">
          {schedules.map((schedule) => {
            const schedulePaid = payments
              .filter(
                (payment) => payment.payment_schedule_id === schedule.id,
              )
              .reduce(
                (sum, payment) => sum + Number(payment.amount),
                0,
              );

            const scheduleRemaining = Math.max(
              Number(schedule.amount) - schedulePaid,
              0,
            );

            return (
              <article
                key={schedule.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      {schedule.status === "paid" ? (
                        <CheckCircle2 className="text-emerald-600" size={22} />
                      ) : (
                        <CircleDollarSign className="text-blue-600" size={22} />
                      )}

                      <h3 className="font-bold text-slate-950">
                        {schedule.sequence}. {schedule.title}
                      </h3>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                        {schedule.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {schedule.due_event || "No due milestone specified"}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {Number(schedule.percentage)}% -{" "}
                      {money(Number(schedule.amount))}
                    </p>
                  </div>

                  <div className="md:text-right">
                    <p className="text-sm text-slate-500">Remaining</p>
                    <p className="text-xl font-bold text-slate-950">
                      {money(scheduleRemaining)}
                    </p>
                  </div>
                </div>

                {scheduleRemaining > 0 ? (
                  <>
                    <div className="no-print mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                      {schedule.stripe_checkout_url ? (
                        <>
                          <a
                            href={schedule.stripe_checkout_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl bg-blue-600 px-4 py-2 text-center font-semibold text-white hover:bg-blue-700"
                          >
                            Open secure payment page
                          </a>

                          <CopyPaymentLink
                            url={schedule.stripe_checkout_url}
                          />
                        </>
                      ) : (
                        <form action={createStripeCheckout}>
                          <input
                            type="hidden"
                            name="invoiceId"
                            value={invoice.id}
                          />
                          <input
                            type="hidden"
                            name="scheduleId"
                            value={schedule.id}
                          />

                          <button className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                            Create Stripe payment link
                          </button>
                        </form>
                      )}
                    </div>

                  <form
                    action={recordPayment}
                    className="no-print mt-5 grid gap-3 border-t border-slate-200 pt-5 md:grid-cols-[140px_1fr_1fr_auto]"
                  >
                    <input
                      type="hidden"
                      name="invoiceId"
                      value={invoice.id}
                    />
                    <input
                      type="hidden"
                      name="scheduleId"
                      value={schedule.id}
                    />

                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      max={scheduleRemaining}
                      step="0.01"
                      required
                      defaultValue={scheduleRemaining.toFixed(2)}
                      aria-label="Payment amount"
                      className="rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                    />

                    <select
                      name="paymentMethod"
                      defaultValue=""
                      className="rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                    >
                      <option value="">Payment method</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank transfer</option>
                      <option value="check">Check</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>

                    <input
                      name="referenceNumber"
                      placeholder="Reference or check number"
                      className="rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                    />

                    <button className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
                      Record payment
                    </button>
                  </form>
                  </>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}





