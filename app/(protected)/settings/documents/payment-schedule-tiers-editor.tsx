"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type ScheduleRow = { id: string; title: string; percentage: number | "" };
type Tier = { id: string; minTotal: number | ""; schedule: ScheduleRow[] };

type SavedTier = { minTotal: number; schedule: Array<{ title: string; percentage: number }> };

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function PaymentScheduleTiersEditor({
  initialTiers,
}: {
  initialTiers: SavedTier[];
}) {
  const [tiers, setTiers] = useState<Tier[]>(
    initialTiers.length
      ? initialTiers.map((t, i) => ({
          id: `existing-${i}`,
          minTotal: t.minTotal,
          schedule: t.schedule.map((s, j) => ({ id: `existing-${i}-${j}`, title: s.title, percentage: s.percentage })),
        }))
      : [],
  );

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  function addTier() {
    setTiers((current) => [
      ...current,
      { id: `tier-${Date.now()}`, minTotal: "", schedule: [{ id: `row-${Date.now()}`, title: "1st Payment", percentage: "" }] },
    ]);
  }

  function removeTier(tierId: string) {
    setTiers((current) => current.filter((t) => t.id !== tierId));
  }

  function updateTierMin(tierId: string, value: string) {
    setTiers((current) =>
      current.map((t) => (t.id === tierId ? { ...t, minTotal: value === "" ? "" : Number(value) } : t)),
    );
  }

  function addRow(tierId: string) {
    setTiers((current) =>
      current.map((t) =>
        t.id === tierId
          ? { ...t, schedule: [...t.schedule, { id: `row-${Date.now()}`, title: `${t.schedule.length + 1}${["st", "nd", "rd"][t.schedule.length] ?? "th"} Payment`, percentage: "" }] }
          : t,
      ),
    );
  }

  function removeRow(tierId: string, rowId: string) {
    setTiers((current) =>
      current.map((t) => (t.id === tierId ? { ...t, schedule: t.schedule.filter((r) => r.id !== rowId) } : t)),
    );
  }

  function updateRow(tierId: string, rowId: string, field: "title" | "percentage", value: string) {
    setTiers((current) =>
      current.map((t) =>
        t.id === tierId
          ? {
              ...t,
              schedule: t.schedule.map((r) =>
                r.id === rowId ? { ...r, [field]: field === "percentage" ? (value === "" ? "" : Number(value)) : value } : r,
              ),
            }
          : t,
      ),
    );
  }

  const sortedTiers = [...tiers].sort((a, b) => Number(a.minTotal || 0) - Number(b.minTotal || 0));

  return (
    <div className="mt-5">
      <input
        type="hidden"
        name="paymentScheduleTiers"
        value={JSON.stringify(
          tiers.map((t) => ({
            minTotal: Number(t.minTotal) || 0,
            schedule: t.schedule.map(({ title, percentage }) => ({ title, percentage: Number(percentage) || 0 })),
          })),
        )}
      />

      {sortedTiers.length === 0 ? (
        <p className="text-sm text-slate-500">No tiers set — estimates will start with no payment schedule by default.</p>
      ) : (
        <div className="space-y-4">
          {sortedTiers.map((tier) => {
            const rowTotal = tier.schedule.reduce((sum, r) => sum + Number(r.percentage || 0), 0);
            return (
              <div key={tier.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    Apply when estimate total is at least
                    <div className="flex items-center">
                      <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-2 py-1.5 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={tier.minTotal}
                        onChange={(event) => updateTierMin(tier.id, event.target.value)}
                        className="w-24 rounded-r-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-600"
                      />
                    </div>
                  </label>
                  <button type="button" onClick={() => removeTier(tier.id)} aria-label="Remove tier" className="rounded-lg p-1.5 text-red-600 hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {tier.schedule.map((row) => (
                    <div key={row.id} className="grid gap-2 sm:grid-cols-[1fr_100px_36px]">
                      <input value={row.title} onChange={(event) => updateRow(tier.id, row.id, "title", event.target.value)} placeholder="Payment name" className={inputClass} />
                      <div className="flex items-center">
                        <input type="number" min="0" max="100" step="0.01" value={row.percentage} onChange={(event) => updateRow(tier.id, row.id, "percentage", event.target.value)} className={`${inputClass} rounded-r-none text-right`} />
                        <span className="rounded-r-lg border border-l-0 border-slate-300 bg-white px-2 py-2 text-sm">%</span>
                      </div>
                      <button type="button" onClick={() => removeRow(tier.id, row.id)} aria-label="Remove payment" className="flex size-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button type="button" onClick={() => addRow(tier.id)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline">
                    <Plus size={14} />
                    Add payment
                  </button>
                  <p className={`text-xs font-semibold ${Math.abs(rowTotal - 100) < 0.001 ? "text-emerald-700" : "text-amber-700"}`}>
                    {rowTotal.toFixed(2)}% of 100%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button type="button" onClick={addTier} className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
        <Plus size={16} />
        Add price tier
      </button>

      {sortedTiers.length > 0 ? (
        <p className="mt-3 text-xs text-slate-500">
          Estimates under {money(Number(sortedTiers[0]?.minTotal) || 0)} will have no default schedule applied.
        </p>
      ) : null}
    </div>
  );
}