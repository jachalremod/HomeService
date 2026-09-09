import { notFound } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Mail,
  MapPin,
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

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {payment === "success" ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <p className="flex items-center gap-2 font-bold">
              <CheckCircle2 size={20} />
              Payment submitted successfully
            </p>
            <p className="mt-1 text-sm">
              The invoice status will update automatically.
            </p>
          </div>
        ) : null}

        {payment === "cancelled" ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            No payment was processed. You can try again when ready.
          </div>
        ) : null}

        {message ? (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-900">
            {message}
          </div>
        ) : null}

        <div className="mb-4 flex justify-end">
          <a
            href={`/api/portal/${token}/estimate-pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Open/Print PDF
          </a>
        </div>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <header className="grid gap-8 bg-slate-950 p-7 text-white sm:p-10 md:grid-cols-2">
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
                    <p className="mt-2 text-sm text-slate-400">
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

              <h1 className="mt-10 text-4xl font-bold">INVOICE</h1>
            </div>

            <dl className="space-y-3 md:text-right">
              <div>
                <dt className="text-sm text-slate-400">Invoice</dt>
                <dd className="font-bold">{invoice.invoice_number}</dd>
              </div>

              <div>
                <dt className="text-sm text-slate-400">Project</dt>
                <dd className="font-semibold">{estimate?.title}</dd>
              </div>

              <div>
                <dt className="text-sm text-slate-400">Status</dt>
                <dd className="font-bold capitalize text-blue-300">
                  {invoice.status.replace("_", " ")}
                </dd>
              </div>
            </dl>
          </header>

          <div className="p-6 sm:p-10">
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
                      {customer.postal_code
                        ? ` ${customer.postal_code}`
                        : ""}
                    </span>
                  </p>
                ) : null}
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

            <section className="ml-auto max-w-md">
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-slate-600">Invoice total</dt>
                  <dd className="font-bold">
                    {money(Number(invoice.total))}
                  </dd>
                </div>

                <div className="flex justify-between text-emerald-700">
                  <dt>Payments received</dt>
                  <dd className="font-bold">-{money(totalPaid)}</dd>
                </div>

                <div className="flex justify-between rounded-xl bg-blue-50 p-4 text-xl text-blue-900">
                  <dt className="font-bold">Balance due</dt>
                  <dd className="font-bold">
                    {money(remainingBalance)}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </article>

        <section className="mt-8">
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

                      <p className="mt-2 text-sm text-slate-600">
                        {schedule.due_event}
                      </p>

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
