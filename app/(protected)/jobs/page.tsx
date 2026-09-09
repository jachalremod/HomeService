import Link from "next/link";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type JobsPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function JobsPage({
  searchParams,
}: JobsPageProps) {
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      "id, job_number, title, status, scheduled_start, customers(first_name, last_name, project_address, city, state)",
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Jobs</h1>
        <p className="mt-2 text-slate-600">
          Jobs appear only after the first scheduled payment is received.
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

      {!jobs?.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BriefcaseBusiness className="mx-auto text-slate-400" size={38} />
          <h2 className="mt-4 text-lg font-bold text-slate-950">
            No jobs yet
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Record an invoice&apos;s first scheduled payment to create a job.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-blue-700">
                    {job.job_number}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-950">
                    {job.title}
                  </h2>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                  {job.status.replace("_", " ")}
                </span>
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-700">
                {job.customers?.first_name} {job.customers?.last_name}
              </p>

              {job.customers?.project_address ? (
                <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="mt-0.5 shrink-0" size={16} />
                  <span>
                    {job.customers.project_address}
                    {job.customers.city
                      ? `, ${job.customers.city}`
                      : ""}
                    {job.customers.state
                      ? `, ${job.customers.state}`
                      : ""}
                  </span>
                </p>
              ) : null}

              <Link
                href={`/jobs/${job.id}`}
                className="mt-5 inline-flex font-semibold text-blue-700"
              >
                Open job
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

