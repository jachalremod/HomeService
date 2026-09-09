"use client";

import { useMemo, useState } from "react";
import { Plus, ReceiptText, Trash2 } from "lucide-react";
import { createInvoice } from "../actions";

type Schedule = {
  id: string;
  title: string;
  percentage: number;
  dueEvent: string;
};

type PaymentScheduleFormProps = {
  estimateId: string;
  total: number;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function PaymentScheduleForm({
  estimateId,
  total,
}: PaymentScheduleFormProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: "deposit",
      title: "Deposit",
      percentage: 25,
      dueEvent: "Due upon approval",
    },
    {
      id: "start",
      title: "Project start",
      percentage: 25,
      dueEvent: "Due before work begins",
    },
    {
      id: "progress",
      title: "Progress payment",
      percentage: 25,
      dueEvent: "Due at project midpoint",
    },
    {
      id: "final",
      title: "Final payment",
      percentage: 25,
      dueEvent: "Due upon completion",
    },
  ]);

  const percentageTotal = useMemo(
    () =>
      schedules.reduce(
        (sum, schedule) => sum + Number(schedule.percentage),
        0,
      ),
    [schedules],
  );

  function updateSchedule(
    id: string,
    field: "title" | "percentage" | "dueEvent",
    value: string,
  ) {
    setSchedules((current) =>
      current.map((schedule) =>
        schedule.id === id
          ? {
              ...schedule,
              [field]: field === "percentage" ? Number(value) : value,
            }
          : schedule,
      ),
    );
  }

  function addSchedule() {
    setSchedules((current) => [
      ...current,
      {
        id: `schedule-${Date.now()}`,
        title: "Payment",
        percentage: 0,
        dueEvent: "",
      },
    ]);
  }

  function removeSchedule(id: string) {
    setSchedules((current) =>
      current.length === 1
        ? current
        : current.filter((schedule) => schedule.id !== id),
    );
  }

  const scheduleIsValid = Math.abs(percentageTotal - 100) < 0.001;

  return (
    <form action={createInvoice} className="space-y-6">
      <input type="hidden" name="estimateId" value={estimateId} />
      <input
        type="hidden"
        name="schedules"
        value={JSON.stringify(
          schedules.map(({ title, percentage, dueEvent }) => ({
            title,
            percentage,
            dueEvent,
          })),
        )}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Payment schedule
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              All payments remain attached to this invoice.
            </p>
          </div>

          <button
            type="button"
            onClick={addSchedule}
            className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
          >
            <Plus size={17} />
            Add payment
          </button>
        </div>

        <div className="space-y-4">
          {schedules.map((schedule, index) => (
            <div
              key={schedule.id}
              className="grid gap-3 rounded-xl bg-slate-50 p-4 lg:grid-cols-[1fr_140px_1fr_140px_44px]"
            >
              <input
                required
                value={schedule.title}
                onChange={(event) =>
                  updateSchedule(schedule.id, "title", event.target.value)
                }
                placeholder={`Payment ${index + 1}`}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950"
              />

              <div className="flex items-center">
                <input
                  required
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={schedule.percentage}
                  onChange={(event) =>
                    updateSchedule(
                      schedule.id,
                      "percentage",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-l-lg border border-slate-300 px-3 py-2 text-right text-slate-950"
                />
                <span className="rounded-r-lg border border-l-0 border-slate-300 bg-white px-3 py-2">
                  %
                </span>
              </div>

              <input
                value={schedule.dueEvent}
                onChange={(event) =>
                  updateSchedule(schedule.id, "dueEvent", event.target.value)
                }
                placeholder="When is this payment due?"
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950"
              />

              <div className="flex items-center justify-end font-bold text-slate-900">
                {money(total * (schedule.percentage / 100))}
              </div>

              <button
                type="button"
                onClick={() => removeSchedule(schedule.id)}
                disabled={schedules.length === 1}
                aria-label="Remove payment"
                className="flex size-11 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div
          className={`mt-6 flex justify-between rounded-xl px-4 py-3 font-semibold ${
            scheduleIsValid
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          <span>Scheduled</span>
          <span>{percentageTotal.toFixed(2)}% of 100%</span>
        </div>
      </section>

      <section className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-400">Invoice total</p>
          <p className="mt-1 text-3xl font-bold">{money(total)}</p>
        </div>

        <button
          disabled={!scheduleIsValid}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ReceiptText size={19} />
          Create one invoice
        </button>
      </section>
    </form>
  );
}
