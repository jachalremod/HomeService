import { createClient } from "@/lib/supabase/server";
import { rescheduleFromCalendar } from "../jobs/[id]/actions";
import { JobCalendar } from "./job-calendar";

export default async function SchedulePage() {
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      "id, job_number, title, status, scheduled_start, scheduled_end, customers(first_name, last_name, project_address, city, state)",
    )
    .order("scheduled_start", { ascending: true });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Schedule</h1>
        <p className="mt-2 text-slate-600">
          View and manage your scheduled jobs.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
          {error.message}
        </div>
      ) : (
        <JobCalendar jobs={jobs ?? []} rescheduleAction={rescheduleFromCalendar} />
      )}
    </>
  );
}