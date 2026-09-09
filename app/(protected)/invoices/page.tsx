import Link from "next/link";
import { CircleDollarSign, ReceiptText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type InvoicesPageProps = {
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

export default async function InvoicesPage({
  searchParams,
}: InvoicesPageProps) {
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, status, total, created_at, customers(first_name, last_name), estimates(title)",
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Invoices</h1>
        <p className="mt-2 text-slate-600">
          One invoice and one payment schedule per approved estimate.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
          {error.message}
        </div>
      ) : null}

      {!invoices?.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <ReceiptText className="mx-auto text-slate-400" size={38} />
          <h2 className="mt-4 text-lg font-bold text-slate-950">
            No invoices yet
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Open an approved estimate to create its invoice.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {invoices.map((invoice) => (
            <article
              key={invoice.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <CircleDollarSign size={21} />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-blue-700">
                      {invoice.invoice_number}
                    </p>
                    <h2 className="font-bold text-slate-950">
                      {invoice.estimates?.title}
                    </h2>
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                  {invoice.status.replace("_", " ")}
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-600">
                {invoice.customers?.first_name}{" "}
                {invoice.customers?.last_name}
              </p>

              <p className="mt-4 text-2xl font-bold text-slate-950">
                {money(Number(invoice.total))}
              </p>

              <Link
                href={`/invoices/${invoice.id}`}
                className="mt-5 inline-flex font-semibold text-blue-700"
              >
                Open invoice
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

