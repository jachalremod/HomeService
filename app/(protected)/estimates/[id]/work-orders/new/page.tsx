import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createWorkOrder } from "../../../../work-orders/actions";

type NewWorkOrderPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    message?: string;
  }>;
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

export default async function NewWorkOrderPage({
  params,
  searchParams,
}: NewWorkOrderPageProps) {
  const { id } = await params;
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: estimate } = await supabase
    .from("estimates")
    .select(
      "id, estimate_number, title, status, deleted_at, customers(first_name, last_name), estimate_items(title, description, sort_order)",
    )
    .eq("id", id)
    .single();

  if (!estimate) {
    notFound();
  }

  if (
    estimate.status !== "approved" ||
    estimate.deleted_at
  ) {
    redirect(
      `/estimates/${id}?message=Work+orders+can+only+be+created+from+approved+estimates`,
    );
  }

  return (
    <>
      <Link
        href={`/estimates/${estimate.id}`}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
      >
        <ArrowLeft size={17} />
        Back to estimate
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">
          Create work order
        </h1>
        <p className="mt-2 text-slate-600">
          Estimate {estimate.estimate_number} ·{" "}
          {estimate.customers?.first_name}{" "}
          {estimate.customers?.last_name}
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {message}
        </div>
      ) : null}

      <form
        action={createWorkOrder}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input
          type="hidden"
          name="estimateId"
          value={estimate.id}
        />

        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <ClipboardList size={22} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Work-order details
            </h2>
            <p className="text-sm text-slate-600">
              Multiple work orders may be created from this estimate.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Work-order title *
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={estimate.title}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={(estimate.estimate_items ?? [])
                .sort(
                  (a, b) =>
                    a.sort_order - b.sort_order,
                )
                .map(
                  (item) =>
                    `${item.title}` +
                    `\n${item.description}`,
                )
                .join("\n\n")}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="instructions"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Work instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={5}
              className={inputClass}
              placeholder="Enter crew instructions, scope details, access requirements, and other notes."
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="assignedTo"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Assigned to
            </label>
            <input
              id="assignedTo"
              name="assignedTo"
              className={inputClass}
              placeholder="Employee, crew, or subcontractor"
            />
          </div>

          <div>
            <label
              htmlFor="scheduledStart"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Scheduled start
            </label>
            <input
              id="scheduledStart"
              name="scheduledStart"
              type="date"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="scheduledEnd"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Scheduled end
            </label>
            <input
              id="scheduledEnd"
              name="scheduledEnd"
              type="date"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Create work order
          </button>
        </div>
      </form>
    </>
  );
}