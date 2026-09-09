import Link from "next/link";
import {
  ArrowDownAZ,
  CheckCircle2,
  FileText,
  Plus,
  Send,
  ThumbsDown,
  TimerOff,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import EstimateRowActions from "./estimate-row-actions";

export type EstimatePageStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "expired"
  | "deleted";

export type EstimateStatusSearchParams = {
  message?: string;
  sort?: string;
  direction?: string;
};

type EstimateStatusPageProps = {
  status: EstimatePageStatus;
  searchParams: Promise<EstimateStatusSearchParams>;
};

type SortOption =
  | "number"
  | "estimate"
  | "customer"
  | "amount"
  | "created"
  | "expires";

type SortDirection = "asc" | "desc";

const tabs: Array<{ status: EstimatePageStatus; label: string }> = [
  { status: "draft", label: "Draft" },
  { status: "sent", label: "Sent" },
  { status: "accepted", label: "Accepted" },
  { status: "declined", label: "Declined" },
  { status: "expired", label: "Expired" },
  { status: "deleted", label: "Deleted" },
];

const validSortOptions: SortOption[] = [
  "number",
  "estimate",
  "customer",
  "amount",
  "created",
  "expires",
];

const pageDetails = {
  draft: {
    title: "Draft estimates",
    description: "Estimates that are still being prepared.",
    empty: "No draft estimates",
    icon: FileText,
    badge: "bg-slate-100 text-slate-700",
  },
  sent: {
    title: "Sent estimates",
    description: "Estimates that have been sent to customers.",
    empty: "No sent estimates",
    icon: Send,
    badge: "bg-blue-100 text-blue-700",
  },
  accepted: {
    title: "Accepted estimates",
    description: "Estimates accepted by customers.",
    empty: "No accepted estimates",
    icon: CheckCircle2,
    badge: "bg-emerald-100 text-emerald-700",
  },
  declined: {
    title: "Declined estimates",
    description: "Estimates declined by customers.",
    empty: "No declined estimates",
    icon: ThumbsDown,
    badge: "bg-red-100 text-red-700",
  },
  expired: {
    title: "Expired estimates",
    description: "Draft or sent estimates past their expiration date.",
    empty: "No expired estimates",
    icon: TimerOff,
    badge: "bg-amber-100 text-amber-700",
  },
  deleted: {
    title: "Deleted estimates",
    description: "Deleted estimates that can still be restored.",
    empty: "No deleted estimates",
    icon: Trash2,
    badge: "bg-red-100 text-red-700",
  },
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function date(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function EstimateStatusPage({
  status,
  searchParams,
}: EstimateStatusPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const selectedSort = validSortOptions.includes(params.sort as SortOption)
    ? (params.sort as SortOption)
    : "number";
  const selectedDirection: SortDirection =
    params.direction === "desc" ? "desc" : "asc";

  let query = supabase
    .from("estimates")
    .select(
      "id, estimate_number, title, status, total, created_at, expires_at, deleted_at, customers(first_name, last_name)",
    );

  if (status === "deleted") {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);

    if (status === "accepted") {
      query = query.eq("status", "approved");
    } else if (status === "expired") {
      query = query.in("status", ["draft", "sent"]).lt("expires_at", today);
    } else if (status === "draft" || status === "sent") {
      query = query
        .eq("status", status)
        .or(`expires_at.is.null,expires_at.gte.${today}`);
    } else {
      query = query.eq("status", "declined");
    }
  }

  const { data: estimates, error } = await query;
  const sortedEstimates = [...(estimates ?? [])].sort((a, b) => {
    let comparison = 0;

    if (selectedSort === "number") {
      comparison = String(a.estimate_number).localeCompare(
        String(b.estimate_number),
        undefined,
        { numeric: true, sensitivity: "base" },
      );
    } else if (selectedSort === "estimate") {
      comparison = a.title.localeCompare(b.title, undefined, {
        sensitivity: "base",
      });
    } else if (selectedSort === "customer") {
      const customerA = `${a.customers?.last_name ?? ""} ${a.customers?.first_name ?? ""}`.trim();
      const customerB = `${b.customers?.last_name ?? ""} ${b.customers?.first_name ?? ""}`.trim();
      comparison = customerA.localeCompare(customerB, undefined, {
        sensitivity: "base",
      });
    } else if (selectedSort === "amount") {
      comparison = Number(a.total) - Number(b.total);
    } else if (selectedSort === "created") {
      comparison =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (selectedSort === "expires") {
      if (!a.expires_at && b.expires_at) return 1;
      if (a.expires_at && !b.expires_at) return -1;
      comparison = String(a.expires_at ?? "").localeCompare(
        String(b.expires_at ?? ""),
      );
    }

    return selectedDirection === "asc" ? comparison : comparison * -1;
  });

  const details = pageDetails[status];
  const StatusIcon = details.icon;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      <header className="border-b border-slate-200 bg-white px-5 py-5 shadow-sm lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Estimates</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create, send, and track customer estimates.
            </p>
          </div>
          <Link
            href="/estimates/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus size={18} /> New estimate
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <nav className="mb-6 overflow-x-auto border-b border-slate-200">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.status}
                href={`/estimates/${tab.status}`}
                aria-current={tab.status === status ? "page" : undefined}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  tab.status === status
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </nav>

        {params.message ? (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            {params.message}
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
            {error.message}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <StatusIcon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-950">
                    {details.title}
                  </h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${details.badge}`}>
                    {sortedEstimates.length}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {details.description}
                </p>
              </div>
            </div>

            <form className="flex flex-wrap items-center gap-2">
              <ArrowDownAZ className="text-slate-400" size={18} />
              <label htmlFor="sort" className="sr-only">Sort estimates by</label>
              <select
                id="sort"
                name="sort"
                defaultValue={selectedSort}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="number">Estimate number</option>
                <option value="estimate">Estimate name</option>
                <option value="customer">Customer name</option>
                <option value="amount">Amount</option>
                <option value="created">Created date</option>
                <option value="expires">Expiration date</option>
              </select>
              <label htmlFor="direction" className="sr-only">Sort direction</label>
              <select
                id="direction"
                name="direction"
                defaultValue={selectedDirection}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Apply
              </button>
            </form>
          </div>

          {!sortedEstimates.length ? (
            <div className="px-6 py-16 text-center">
              <StatusIcon className="mx-auto text-slate-300" size={40} />
              <p className="mt-4 font-semibold text-slate-700">
                {details.empty}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Estimates in this status will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-semibold">Estimate #</th>
                    <th className="px-5 py-3 font-semibold">Estimate name</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 text-right font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
                    <th className="px-5 py-3 font-semibold">Expires</th>
                    <th className="px-5 py-3 text-right font-semibold">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEstimates.map((estimate) => (
                    <tr
                      key={estimate.id}
                      className="border-b border-slate-100 transition last:border-b-0 hover:bg-emerald-50/40"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-emerald-700">
                        {estimate.estimate_number}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {estimate.title}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                        {estimate.customers?.first_name} {estimate.customers?.last_name}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-950">
                        {money(Number(estimate.total))}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {date(estimate.created_at.slice(0, 10))}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {date(estimate.expires_at)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <EstimateRowActions
                          estimateId={estimate.id}
                          deleted={status === "deleted"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
