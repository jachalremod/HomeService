import Link from "next/link";
import { MapPin, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-slate-100 text-slate-500",
};

export default async function MyJobsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      "id, job_number, title, status, scheduled_start, scheduled_end, customers(first_name, last_name, project_address, city, state)",
    )
    .eq("assigned_to", user?.id ?? "")
    .order("scheduled_start", { ascending: true });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">My Jobs</h1>
        <p className="mt-2 text-slate-600">
          Jobs assigned to you.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
          {error.message}
        </div>
      ) : !jobs?.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Wrench className="mx-auto text-slate-400" size={38} />
          <h2 className="mt-4 text-lg font-bold text-slate-950">
            No jobs assigned yet
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Jobs assigned to you will show up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/my-jobs/${job.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300"
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

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                    STATUS_STYLES[job.status] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
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
                    {job.customers.city ? `, ${job.customers.city}` : ""}
                    {job.customers.state ? `, ${job.customers.state}` : ""}
                  </span>
                </p>
              ) : null}

              {job.scheduled_start ? (
                <p className="mt-2 text-xs text-slate-500">
                  Scheduled: {job.scheduled_start}
                  {job.scheduled_end && job.scheduled_end !== job.scheduled_start ? ` — ${job.scheduled_end}` : ""}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}