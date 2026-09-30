"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function updateMyJobStatus(formData: FormData) {
  const result = z
    .object({
      jobId: z.uuid(),
      status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
    })
    .safeParse({
      jobId: formData.get("jobId"),
      status: formData.get("status"),
    });

  if (!result.success) {
    redirect("/my-jobs?message=Invalid+job+status");
  }

  const supabase = await createClient();

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

  const { error } = await supabase
    .from("jobs")
    .update(updates)
    .eq("id", result.data.jobId);

  if (error) {
    redirect(`/my-jobs/${result.data.jobId}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/my-jobs/${result.data.jobId}`);
  revalidatePath("/my-jobs");
  redirect(`/my-jobs/${result.data.jobId}?message=Status+updated`);
}

export async function updateMyJobNotes(formData: FormData) {
  const jobId = z.uuid().safeParse(formData.get("jobId"));

  if (!jobId.success) {
    redirect("/my-jobs?message=Invalid+job");
  }

  const notes = String(formData.get("notes") ?? "");

  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .update({ notes: notes || null })
    .eq("id", jobId.data);

  if (error) {
    redirect(`/my-jobs/${jobId.data}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/my-jobs/${jobId.data}`);
  redirect(`/my-jobs/${jobId.data}?message=Notes+saved`);
}

export async function uploadJobPhoto(formData: FormData) {
  const jobId = z.uuid().safeParse(formData.get("jobId"));
  const file = formData.get("photo") as File | null;

  if (!jobId.success || !file || file.size === 0) {
    redirect("/my-jobs?message=Invalid+photo+upload");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("organization_id")
    .eq("id", jobId.data)
    .single();

  if (!job) {
    redirect("/my-jobs?message=Job+not+found");
  }

  const fileExt = file.name.split(".").pop() || "jpg";
  const storagePath = `${jobId.data}/${randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("job-photos")
    .upload(storagePath, file);

  if (uploadError) {
    redirect(`/my-jobs/${jobId.data}?message=${encodeURIComponent(uploadError.message)}`);
  }

  const { error: insertError } = await supabase.from("job_photos").insert({
    job_id: jobId.data,
    organization_id: job.organization_id,
    uploaded_by: user.id,
    storage_path: storagePath,
  });

  if (insertError) {
    redirect(`/my-jobs/${jobId.data}?message=${encodeURIComponent(insertError.message)}`);
  }

  revalidatePath(`/my-jobs/${jobId.data}`);
  redirect(`/my-jobs/${jobId.data}?message=Photo+uploaded`);
}