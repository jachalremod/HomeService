import { createClient } from "@/lib/supabase/server";
import { rescheduleFromCalendar } from "./[id]/actions";
import { JobsTabs } from "./jobs-tabs";

type JobsPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const { message } = await searchParams;
  const supabase = await createClient();

    const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      "id, job_number, title, status, scheduled_start, scheduled_end, customers(first_name, last_name, project_address, city, state), invoices(payment_schedules(status))",
    )
    .order("created_at", { ascending: false });

  const allJobs = jobs ?? [];

  const newJobs = allJobs.filter((job) => !job.scheduled_start);
  const scheduledJobs = allJobs.filter(
    (job) => job.scheduled_start && job.status === "scheduled",
  );
  const inProgressJobs = allJobs.filter((job) => job.status === "in_progress");
  const completedJobs = allJobs.filter((job) => job.status === "completed");

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Jobs</h1>
        <p className="mt-2 text-slate-600">
          Jobs appear after the first scheduled payment is received.
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
      ) : (
               <JobsTabs
          newJobs={newJobs}
          scheduledJobs={scheduledJobs}
          inProgressJobs={inProgressJobs}
          completedJobs={completedJobs}
          scheduleAction={rescheduleFromCalendar}
        />
      )}
    </>
  );
}