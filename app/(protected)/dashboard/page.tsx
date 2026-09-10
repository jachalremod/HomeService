import Link from "next/link";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Plus,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const supabase = await createClient();

    const [
    customersResult,
    estimatesResult,
    invoicesResult,
    jobsResult,
    recentEstimatesResult,
    needsSchedulingResult,
  ] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("estimates").select("id", { count: "exact", head: true }),
    supabase
      .from("invoices")
      .select("id, total, status, payments(amount)"),
    supabase.from("jobs").select("id, status", { count: "exact" }),
    supabase
      .from("estimates")
      .select(
        "id, estimate_number, title, status, total, customers(first_name, last_name)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("jobs")
      .select("id, job_number, title, customers(first_name, last_name)")
      .is("scheduled_start", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const invoices = invoicesResult.data ?? [];
  const jobs = jobsResult.data ?? [];

  const totalInvoiced = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total),
    0,
  );

  const totalCollected = invoices.reduce(
    (invoiceSum, invoice) =>
      invoiceSum +
      (invoice.payments ?? []).reduce(
        (paymentSum, payment) => paymentSum + Number(payment.amount),
        0,
      ),
    0,
  );

  const activeJobs = jobs.filter(
    (job) =>
      job.status === "scheduled" || job.status === "in_progress",
  ).length;

  const metrics = [
    {
      label: "Customers",
      value: String(customersResult.count ?? 0),
      icon: Users,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Estimates",
      value: String(estimatesResult.count ?? 0),
      icon: FileText,
      color: "bg-violet-50 text-violet-700",
    },
    {
      label: "Total invoiced",
      value: money(totalInvoiced),
      icon: CircleDollarSign,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Payments received",
      value: money(totalCollected),
      icon: FileCheck2,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Active jobs",
      value: String(activeJobs),
      icon: BriefcaseBusiness,
      color: "bg-cyan-50 text-cyan-700",
    },
  ];

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Dashboard</h1>
          <p className="mt-2 text-slate-600">
            A simple view of your estimate-to-job workflow.
          </p>
        </div>

        <Link
          href="/estimates/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          New estimate
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article
              key={metric.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                className={`flex size-11 items-center justify-center rounded-xl ${metric.color}`}
              >
                <Icon size={22} />
              </div>

              <p className="mt-5 text-sm font-semibold text-slate-500">
                {metric.label}
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {metric.value}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Recent estimates
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Continue where you left off.
              </p>
            </div>

            <Link
              href="/estimates"
              className="text-sm font-semibold text-blue-700"
            >
              View all
            </Link>
          </div>

          {!recentEstimatesResult.data?.length ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-600">
              No estimates yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentEstimatesResult.data.map((estimate) => (
                <Link
                  key={estimate.id}
                  href={`/estimates/${estimate.id}`}
                  className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-xs font-bold text-blue-700">
                      {estimate.estimate_number}
                    </p>
                    <p className="mt-1 font-bold text-slate-950">
                      {estimate.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {estimate.customers?.first_name}{" "}
                      {estimate.customers?.last_name}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-bold text-slate-950">
                      {money(Number(estimate.total))}
                    </p>
                    <p className="mt-1 text-xs font-semibold capitalize text-slate-500">
                      {estimate.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
                    )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-950">
              Needs scheduling
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Paid jobs waiting to go on the calendar.
            </p>
          </div>

          {!needsSchedulingResult.data?.length ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-600">
              Nothing waiting — you&apos;re all caught up.
            </div>
          ) : (
            <div className="space-y-3">
              {needsSchedulingResult.data.map((job) => (
                <Link
                  key={job.id}
                  href="/jobs"
                  className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <p className="text-xs font-bold text-blue-700">
                    {job.job_number}
                  </p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {job.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {job.customers?.first_name} {job.customers?.last_name}
                  </p>
                </Link>
              ))}

              <Link
                href="/jobs"
                className="block pt-1 text-center text-sm font-semibold text-blue-700"
              >
                View all in Jobs
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
