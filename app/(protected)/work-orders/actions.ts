"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const workOrderSchema = z.object({
  estimateId: z.uuid(),
  title: z.string().trim().min(1),
  description: z.string().trim(),
  instructions: z.string().trim(),
  assignedTo: z.string().trim(),
  scheduledStart: z.union([z.literal(""), z.iso.date()]),
  scheduledEnd: z.union([z.literal(""), z.iso.date()]),
});

export async function createWorkOrder(formData: FormData) {
  const result = workOrderSchema.safeParse({
    estimateId: formData.get("estimateId"),
    title: formData.get("title"),
    description: formData.get("description"),
    instructions: formData.get("instructions"),
    assignedTo: formData.get("assignedTo"),
    scheduledStart: formData.get("scheduledStart"),
    scheduledEnd: formData.get("scheduledEnd"),
  });

  if (!result.success) {
    redirect(
      `/estimates/${String(
        formData.get("estimateId") ?? "",
      )}/work-orders/new?message=Complete+all+required+fields`,
    );
  }

  if (
    result.data.scheduledStart &&
    result.data.scheduledEnd &&
    result.data.scheduledEnd < result.data.scheduledStart
  ) {
    redirect(
      `/estimates/${result.data.estimateId}/work-orders/new?message=End+date+cannot+be+before+start+date`,
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: estimate, error: estimateError } =
    await supabase
      .from("estimates")
      .select("id, customer_id, status")
      .eq("id", result.data.estimateId)
      .is("deleted_at", null)
      .single();

  if (
    estimateError ||
    !estimate ||
    estimate.status !== "approved"
  ) {
    redirect(
      `/estimates/${result.data.estimateId}?message=Work+orders+can+only+be+created+from+approved+estimates`,
    );
  }

  const {
    data: nextWorkOrderNumber,
    error: numberError,
  } = await supabase.rpc("next_document_number", {
    p_document_type: "work_order",
  });

  if (numberError || nextWorkOrderNumber === null) {
    redirect(
      `/estimates/${estimate.id}/work-orders/new?message=${encodeURIComponent(
        numberError?.message ??
          "Unable to assign work order number",
      )}`,
    );
  }

  const { data: workOrder, error } = await supabase
    .from("work_orders")
    .insert({
      user_id: user.id,
      customer_id: estimate.customer_id,
      estimate_id: estimate.id,
      work_order_number: String(nextWorkOrderNumber),
      title: result.data.title,
      description: result.data.description || null,
      instructions: result.data.instructions || null,
      assigned_to: result.data.assignedTo || null,
      scheduled_start: result.data.scheduledStart || null,
      scheduled_end: result.data.scheduledEnd || null,
      status:
        result.data.scheduledStart ||
        result.data.scheduledEnd
          ? "scheduled"
          : "draft",
    })
    .select("id, work_order_number")
    .single();

  if (error || !workOrder) {
    redirect(
      `/estimates/${estimate.id}/work-orders/new?message=${encodeURIComponent(
        error?.message ?? "Unable to create work order",
      )}`,
    );
  }

  revalidatePath(`/estimates/${estimate.id}`);
  revalidatePath("/work-orders");

  redirect(
    `/estimates/${estimate.id}?message=Work+order+${workOrder.work_order_number}+created`,
  );
}
export async function updateWorkOrderStatus(formData: FormData) {
  const result = z
    .object({
      workOrderId: z.uuid(),
      status: z.enum([
        "draft",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ]),
    })
    .safeParse({
      workOrderId: formData.get("workOrderId"),
      status: formData.get("status"),
    });

  if (!result.success) {
    redirect("/work-orders?message=Invalid+work+order");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("work_orders")
    .update({ status: result.data.status })
    .eq("id", result.data.workOrderId);

  if (error) {
    redirect(
      `/work-orders/${result.data.workOrderId}?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/work-orders/${result.data.workOrderId}`);
  revalidatePath("/work-orders");
  redirect(`/work-orders/${result.data.workOrderId}?message=Status+updated`);
}

export async function updateWorkOrderSchedule(formData: FormData) {
  const workOrderId = z.uuid().safeParse(formData.get("workOrderId"));

  if (!workOrderId.success) {
    redirect("/work-orders?message=Invalid+work+order");
  }

  const startDate = String(formData.get("scheduledStart") ?? "");
  const endDate = String(formData.get("scheduledEnd") ?? "");

  if (startDate && endDate && endDate < startDate) {
    redirect(
      `/work-orders/${workOrderId.data}?message=End+date+cannot+be+before+start+date`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("work_orders")
    .update({
      scheduled_start: startDate || null,
      scheduled_end: endDate || null,
      status: startDate ? "scheduled" : "draft",
    })
    .eq("id", workOrderId.data);

  if (error) {
    redirect(
      `/work-orders/${workOrderId.data}?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/work-orders/${workOrderId.data}`);
  revalidatePath("/work-orders");
  redirect(`/work-orders/${workOrderId.data}?message=Schedule+updated`);
}