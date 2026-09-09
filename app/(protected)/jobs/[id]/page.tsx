import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  FileText,
  MapPin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateJobSchedule, updateJobStatus } from "./actions";

type JobPageProps = {
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

export default async function JobPage({
  params,
  searchParams,
}: JobPageProps) {
  const { id } = await params;
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "*, customers(*), estimates(estimate_number, total), invoices(invoice_number, total, status, payments(amount))",
    )
    .eq("id", id)
    .single();

  if (!job) {
    notFound();
  }

  const paidAmount = (job.invoices?.payments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  return (
    <>
      <Link
        href="/jobs"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
      >
        <ArrowLeft size={17} />
        Back to jobs
      </Link>

      {message ? (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <p className="text-sm font-bold text-blue-700">{job.job_number}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {job.title}
          </h1>
          <p className="mt-2 text-slate-600">
            {job.customers?.first_name} {job.customers?.last_name}
          </p>
        </div>

        <span className="h-fit rounded-xl bg-blue-100 px-4 py-3 font-bold capitalize text-blue-800">
          {job.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-950">Job overview</h2>

          {job.description ? (
            <p className="mt-4 leading-7 text-slate-600">{job.description}</p>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <FileText size={17} />
                Estimate
              </p>
              <p className="mt-2 font-bold text-slate-950">
                {job.estimates?.estimate_number}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <CircleDollarSign size={17} />
                Invoice
              </p>
              <p className="mt-2 font-bold text-slate-950">
                {job.invoices?.invoice_number}
              </p>
            </div>
          </div>

          {job.customers?.project_address ? (
            <div className="mt-6 rounded-xl border border-slate-200 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <MapPin size={17} />
                Project address
              </p>
              <p className="mt-2 text-slate-600">
                {job.customers.project_address}
                {job.customers.city ? `, ${job.customers.city}` : ""}
                {job.customers.state ? `, ${job.customers.state}` : ""}
                {job.customers.postal_code
                  ? ` ${job.customers.postal_code}`
                  : ""}
              </p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-950">Project financials</h2>

            <dl className="mt-5 space-y-4">
              <div className="flex justify-between">
                <dt className="text-slate-600">Contract total</dt>
                <dd className="font-bold text-slate-950">
                  {money(Number(job.invoices?.total ?? 0))}
                </dd>
              </div>

              <div className="flex justify-between text-emerald-700">
                <dt>Payments received</dt>
                <dd className="font-bold">{money(paidAmount)}</dd>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-4">
                <dt className="font-semibold text-slate-700">
                  Remaining balance
                </dt>
                <dd className="font-bold text-blue-700">
                  {money(
                    Number(job.invoices?.total ?? 0) - paidAmount,
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-slate-950">
              <CalendarDays size={18} />
              Schedule
            </h2>

            <form action={updateJobSchedule} className="mt-5 space-y-4">
              <input type="hidden" name="jobId" value={job.id} />

              <div>
                <label
                  htmlFor="scheduledStart"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Start date
                </label>
                <input
                  id="scheduledStart"
                  name="scheduledStart"
                  type="date"
                  defaultValue={job.scheduled_start ?? ""}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                />
              </div>

              <div>
                <label
                  htmlFor="scheduledEnd"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  End date
                </label>
                <input
                  id="scheduledEnd"
                  name="scheduledEnd"
                  type="date"
                  defaultValue={job.scheduled_end ?? ""}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                />
              </div>

              <button className="w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                Save schedule
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-950">Job status</h2>

            <form action={updateJobStatus} className="mt-5 space-y-4">
              <input type="hidden" name="jobId" value={job.id} />

              <select
                name="status"
                defaultValue={job.status}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 capitalize text-slate-950"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button className="w-full rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
                Update status
              </button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}

