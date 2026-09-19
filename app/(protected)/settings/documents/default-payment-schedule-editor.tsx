"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type ScheduleItem = { id: string; title: string; percentage: number | "" };

export default function DefaultPaymentScheduleEditor({
  initialSchedule,
}: {
  initialSchedule: Array<{ title: string; percentage: number }>;
}) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(
    initialSchedule.length
      ? initialSchedule.map((s, i) => ({ id: `existing-${i}`, title: s.title, percentage: s.percentage }))
      : [],
  );

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  function updateItem(id: string, field: "title" | "percentage", value: string) {
    setSchedule((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, [field]: field === "percentage" ? (value === "" ? "" : Number(value)) : value }
          : item,
      ),
    );
  }

  function addItem() {
    setSchedule((current) => [
      ...current,
      { id: `new-${Date.now()}`, title: `${current.length + 1}${["st", "nd", "rd"][current.length] ?? "th"} Payment`, percentage: "" },
    ]);
  }

  function removeItem(id: string) {
    setSchedule((current) => current.filter((item) => item.id !== id));
  }

  const total = schedule.reduce((sum, item) => sum + Number(item.percentage || 0), 0);

  return (
    <div className="mt-5">
      <input
        type="hidden"
        name="defaultPaymentSchedule"
        value={JSON.stringify(schedule.map(({ title, percentage }) => ({ title, percentage: Number(percentage) || 0 })))}
      />

      {schedule.length === 0 ? (
        <p className="text-sm text-slate-500">No default payment schedule set — estimates will start blank.</p>
      ) : (
        <div className="space-y-3">
          {schedule.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_120px_44px]">
              <input
                value={item.title}
                onChange={(event) => updateItem(item.id, "title", event.target.value)}
                placeholder="Payment name"
                className={inputClass}
              />
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={item.percentage}
                  onChange={(event) => updateItem(item.id, "percentage", event.target.value)}
                  className={`${inputClass} rounded-r-none text-right`}
                />
                <span className="rounded-r-lg border border-l-0 border-slate-300 bg-white px-3 py-2">%</span>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label="Remove payment"
                className="flex size-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
        >
          <Plus size={16} />
          Add payment
        </button>

        {schedule.length > 0 ? (
          <p className={`text-sm font-semibold ${Math.abs(total - 100) < 0.001 ? "text-emerald-700" : "text-amber-700"}`}>
            {total.toFixed(2)}% of 100%
          </p>
        ) : null}
      </div>
    </div>
  );
}