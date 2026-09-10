import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ClipboardList, MapPin, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateWorkOrderSchedule, updateWorkOrderStatus } from "../actions";

type WorkOrderPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function WorkOrderPage({
  params,
  searchParams,
}: WorkOrderPageProps) {
  const { id } = await params;
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: workOrder } = await supabase
    .from("work_orders")
    .select(
      "*, customers(*), estimates(estimate_number, title)",
    )
    .eq("id", id)
    .single();

  if (!workOrder) {
    notFound();
  }

  return (
    <>
      <Link
        href="/work-orders"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
      >
        <ArrowLeft size={17} />
        Back to work orders
      </Link>

      {message ? (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <p className="text-sm font-bold text-blue-700">
            {workOrder.work_order_number}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {workOrder.title}
          </h1>
          <p className="mt-2 text-slate-600">
            {workOrder.customers?.first_name} {workOrder.customers?.last_name}
          </p>
        </div>

        <span className="h-fit rounded-xl bg-blue-100 px-4 py-3 font-bold capitalize text-blue-800">
          {workOrder.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-950">
            Work order details
          </h2>

          {workOrder.description ? (
            <div className="mt-4">
              <p className="text-sm font-bold text-slate-700">Description</p>
              <p className="mt-1 whitespace-pre-line leading-7 text-slate-600">
                {workOrder.description}
              </p>
            </div>
          ) : null}

          {workOrder.instructions ? (
            <div className="mt-6">
              <p className="text-sm font-bold text-slate-700">
                Work instructions
              </p>
              <p className="mt-1 whitespace-pre-line leading-7 text-slate-600">
                {workOrder.instructions}
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <ClipboardList size={17} />
                From estimate
              </p>
              <p className="mt-2 font-bold text-slate-950">
                {workOrder.estimates?.estimate_number}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <User size={17} />
                Assigned to
              </p>
              <p className="mt-2 font-bold text-slate-950">
                {workOrder.assigned_to || "Unassigned"}
              </p>
            </div>
          </div>

          {workOrder.customers?.project_address ? (
            <div className="mt-6 rounded-xl border border-slate-200 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <MapPin size={17} />
                Project address
              </p>
              <p className="mt-2 text-slate-600">
                {workOrder.customers.project_address}
                {workOrder.customers.city ? `, ${workOrder.customers.city}` : ""}
                {workOrder.customers.state ? `, ${workOrder.customers.state}` : ""}
              </p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-slate-950">
              <CalendarDays size={18} />
              Schedule
            </h2>

            <form action={updateWorkOrderSchedule} className="mt-5 space-y-4">
              <input type="hidden" name="workOrderId" value={workOrder.id} />

              <div>
                <label
                  htmlFor="scheduledStart"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Start date
                </label>
                <input
                  id="scheduledStart"
                  name="scheduledStart"
                  type="date"
                  defaultValue={workOrder.scheduled_start ?? ""}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                />
              </div>

              <div>
                <label
                  htmlFor="scheduledEnd"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  End date
                </label>
                <input
                  id="scheduledEnd"
                  name="scheduledEnd"
                  type="date"
                  defaultValue={workOrder.scheduled_end ?? ""}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                />
              </div>

              <button className="w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                Save schedule
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-950">Status</h2>

            <form action={updateWorkOrderStatus} className="mt-5 space-y-4">
              <input type="hidden" name="workOrderId" value={workOrder.id} />

              <select
                name="status"
                defaultValue={workOrder.status}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 capitalize text-slate-950"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button className="w-full rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
                Update status
              </button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}