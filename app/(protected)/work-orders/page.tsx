import Link from "next/link";
import { ClipboardList, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-slate-100 text-slate-500",
};

type WorkOrdersPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function WorkOrdersPage({
  searchParams,
}: WorkOrdersPageProps) {
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: workOrders, error } = await supabase
    .from("work_orders")
    .select(
      "id, work_order_number, title, status, assigned_to, scheduled_start, customers(first_name, last_name, project_address, city, state)",
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Work orders</h1>
        <p className="mt-2 text-slate-600">
          Crew instructions created from approved estimates.
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
      ) : !workOrders?.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <ClipboardList className="mx-auto text-slate-400" size={38} />
          <h2 className="mt-4 text-lg font-bold text-slate-950">
            No work orders yet
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Create one from an approved estimate.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workOrders.map((wo) => (
            <Link
              key={wo.id}
              href={`/work-orders/${wo.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-blue-700">
                    {wo.work_order_number}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-950">
                    {wo.title}
                  </h2>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                    STATUS_STYLES[wo.status] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {wo.status.replace("_", " ")}
                </span>
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-700">
                {wo.customers?.first_name} {wo.customers?.last_name}
              </p>

              {wo.assigned_to ? (
                <p className="mt-1 text-sm text-slate-500">
                  Assigned to {wo.assigned_to}
                </p>
              ) : null}

              {wo.customers?.project_address ? (
                <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="mt-0.5 shrink-0" size={16} />
                  <span>
                    {wo.customers.project_address}
                    {wo.customers.city ? `, ${wo.customers.city}` : ""}
                    {wo.customers.state ? `, ${wo.customers.state}` : ""}
                  </span>
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}