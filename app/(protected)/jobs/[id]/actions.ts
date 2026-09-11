"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const jobIdSchema = z.uuid();

export async function updateJobSchedule(formData: FormData) {
  const jobId = jobIdSchema.safeParse(formData.get("jobId"));

  if (!jobId.success) {
    redirect("/jobs?message=Invalid+job");
  }

  const startDate = String(formData.get("scheduledStart") ?? "");
  const endDate = String(formData.get("scheduledEnd") ?? "");

  if (startDate && endDate && endDate < startDate) {
    redirect(
      `/jobs/${jobId.data}?message=End+date+cannot+be+before+start+date`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .update({
      scheduled_start: startDate || null,
      scheduled_end: endDate || null,
    })
    .eq("id", jobId.data);

  if (error) {
    redirect(
      `/jobs/${jobId.data}?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/jobs/${jobId.data}`);
  revalidatePath("/jobs");
  redirect(`/jobs/${jobId.data}?message=Schedule+updated`);
}

export async function updateJobStatus(formData: FormData) {
  const result = z
    .object({
      jobId: z.uuid(),
      status: z.enum([
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ]),
    })
    .safeParse({
      jobId: formData.get("jobId"),
      status: formData.get("status"),
    });

  if (!result.success) {
    redirect("/jobs?message=Invalid+job+status");
  }

  const updates: {
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    actual_start?: string;
    actual_end?: string;
  } = {
    status: result.data.status,
  };

  if (result.data.status === "in_progress") {
    updates.actual_start = new Date().toISOString().slice(0, 10);
  }

  if (result.data.status === "completed") {
    updates.actual_end = new Date().toISOString().slice(0, 10);
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .update(updates)
    .eq("id", result.data.jobId);

  if (error) {
    redirect(
      `/jobs/${result.data.jobId}?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/jobs/${result.data.jobId}`);
  revalidatePath("/jobs");
  redirect(`/jobs/${result.data.jobId}?message=Job+status+updated`);
}
export async function rescheduleFromCalendar(formData: FormData) {
  const jobId = jobIdSchema.safeParse(formData.get("jobId"));
  const returnTo = String(formData.get("returnTo") ?? "/schedule");

  if (!jobId.success) {
    redirect(`${returnTo}?message=Invalid+job`);
  }

  const startDate = String(formData.get("scheduledStart") ?? "");
  const endDate = String(formData.get("scheduledEnd") ?? "");

  if (startDate && endDate && endDate < startDate) {
    redirect(`${returnTo}?message=End+date+cannot+be+before+start+date`);
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .update({
      scheduled_start: startDate || null,
      scheduled_end: endDate || null,
    })
    .eq("id", jobId.data);

  if (error) {
    redirect(`${returnTo}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/jobs/${jobId.data}`);
  revalidatePath("/jobs");
  revalidatePath("/schedule");
  redirect(`${returnTo}?message=Schedule+updated`);
}