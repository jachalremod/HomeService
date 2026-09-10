"use client";

import { useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, MapPin } from "lucide-react";

type Job = {
  id: string;
  job_number: string;
  title: string;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  customers: {
    first_name: string;
    last_name: string;
    project_address: string | null;
    city: string | null;
    state: string | null;
  } | null;
};

type Tab = "new" | "scheduled" | "in_progress" | "completed";

export function JobsTabs({
  newJobs,
  scheduledJobs,
  inProgressJobs,
  completedJobs,
  scheduleAction,
}: {
  newJobs: Job[];
  scheduledJobs: Job[];
  inProgressJobs: Job[];
  completedJobs: Job[];
  scheduleAction: (formData: FormData) => void;
}) {
  const [tab, setTab] = useState<Tab>(newJobs.length > 0 ? "new" : "scheduled");

  const tabs: { key: Tab; label: string; jobs: Job[] }[] = [
    { key: "new", label: "New", jobs: newJobs },
    { key: "scheduled", label: "Scheduled", jobs: scheduledJobs },
    { key: "in_progress", label: "In Progress", jobs: inProgressJobs },
    { key: "completed", label: "Completed", jobs: completedJobs },
  ];

  const activeJobs = tabs.find((t) => t.key === tab)?.jobs ?? [];

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold ${
              tab === t.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label} ({t.jobs.length})
          </button>
        ))}
      </div>

      {activeJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BriefcaseBusiness className="mx-auto text-slate-400" size={38} />
          <h2 className="mt-4 text-lg font-bold text-slate-950">
            No {tab.replace("_", " ")} jobs
          </h2>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeJobs.map((job) => (
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
                    {job.customers.city ? `, ${job.customers.city}` : ""}
                    {job.customers.state ? `, ${job.customers.state}` : ""}
                  </span>
                </p>
              ) : null}

              {tab === "new" ? (
                <form action={scheduleAction} className="mt-4 space-y-2">
                  <input type="hidden" name="jobId" value={job.id} />
                  <label className="block text-xs font-semibold text-slate-600">
                    Add to calendar
                  </label>
                  <input
                    type="date"
                    name="scheduledStart"
                    required
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-950"
                  />
                  <button className="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
                    Schedule job
                  </button>
                </form>
              ) : (
                <Link
                  href={`/jobs/${job.id}`}
                  className="mt-5 inline-flex font-semibold text-blue-700"
                >
                  Open job
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}