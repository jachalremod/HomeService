"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function JobCalendar({ jobs }: { jobs: Job[] }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const jobsByDate = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of jobs) {
      if (!job.scheduled_start) continue;
      const key = job.scheduled_start.slice(0, 10);
      const existing = map.get(key) ?? [];
      existing.push(job);
      map.set(key, existing);
    }
    return map;
  }, [jobs]);

  const monthLabel = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const gridDays = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      return date;
    });
  }, [cursor]);

  function goToPreviousMonth() {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToToday() {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  const today = toDateKey(new Date());

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-950">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            onClick={goToPreviousMonth}
            aria-label="Previous month"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToNextMonth}
            aria-label="Next month"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="bg-slate-50 px-2 py-2 text-center text-xs font-bold uppercase text-slate-500"
          >
            {day}
          </div>
        ))}

        {gridDays.map((date) => {
          const key = toDateKey(date);
          const dayJobs = jobsByDate.get(key) ?? [];
          const isCurrentMonth = date.getMonth() === cursor.getMonth();
          const isToday = key === today;

          return (
            <div
              key={key}
              className={`min-h-[110px] bg-white p-2 ${
                isCurrentMonth ? "" : "bg-slate-50 text-slate-400"
              }`}
            >
              <p
                className={`mb-1 text-xs font-semibold ${
                  isToday
                    ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-white"
                    : "text-slate-500"
                }`}
              >
                {date.getDate()}
              </p>

              <div className="flex flex-col gap-1">
                {dayJobs.slice(0, 3).map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className={`truncate rounded border px-1.5 py-0.5 text-[11px] font-semibold ${
                      STATUS_COLORS[job.status] ??
                      "border-slate-200 bg-slate-100 text-slate-700"
                    }`}
                    title={`${job.title} — ${job.customers?.first_name ?? ""} ${job.customers?.last_name ?? ""}`}
                  >
                    {job.title}
                  </Link>
                ))}
                {dayJobs.length > 3 ? (
                  <p className="text-[11px] font-semibold text-slate-500">
                    +{dayJobs.length - 3} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}