"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const signupSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    companyName: z.string().trim().optional(),
    email: z.email(),
    phone: z.string().trim().min(1),
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, periods, and underscores"),
    password: z.string().min(8),
    confirmPassword: z.string(),
    invitationToken: z.string().trim().optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function registerContractor(formData: FormData) {
  const invitationTokenRaw = formData.get("invitationToken");
  const inviteSuffix = invitationTokenRaw
    ? `&invite=${encodeURIComponent(String(invitationTokenRaw))}`
    : "";

  const result = signupSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    companyName: formData.get("companyName") || undefined,
    email: formData.get("email"),
    phone: formData.get("phone"),
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    invitationToken: invitationTokenRaw || undefined,
  });

  if (!result.success) {
    redirect(
      `/signup?message=${encodeURIComponent(
        result.error.issues[0]?.message ?? "Complete all required fields",
      )}${inviteSuffix}`,
    );
  }

  const admin = createAdminClient();
  const { data: existingUsername } = await admin
    .from("profiles")
    .select("user_id")
    .ilike("username", result.data.username)
    .maybeSingle();

  if (existingUsername) {
    redirect(`/signup?message=That+username+is+already+taken${inviteSuffix}`);
  }

  const supabase = await createClient();
  const fullName = `${result.data.firstName} ${result.data.lastName}`.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: `${appUrl}/onboarding`,
      data: {
        company_name: result.data.companyName,
        full_name: fullName,
        first_name: result.data.firstName,
        last_name: result.data.lastName,
        invitation_token: result.data.invitationToken || null,
      },
    },
  });

  if (error) {
    redirect(`/signup?message=${encodeURIComponent(error.message)}${inviteSuffix}`);
  }

  if (!data.user) {
    redirect(`/signup?message=Unable+to+create+account${inviteSuffix}`);
  }

  await admin.from("profiles").insert({
    user_id: data.user.id,
    username: result.data.username,
    phone: result.data.phone,
  });

  if (!data.session) {
    redirect(
      "/login?message=Account+created.+Confirm+your+email,+then+log+in+to+finish+company+setup.",
    );
  }

  if (result.data.invitationToken) {
    redirect("/dashboard");
  }

  redirect("/onboarding");
}