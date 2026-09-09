"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

function readCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function login(formData: FormData) {
  const result = readCredentials(formData);

  if (!result.success) {
    redirect("/login?message=Enter+a+valid+email+and+password");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  const { data: organizationId } = await supabase.rpc("current_organization_id");
  if (!organizationId) redirect("/signup?message=Company+workspace+not+found");
  const { data: organization } = await supabase.from("organizations")
    .select("onboarding_completed").eq("id", organizationId).single();

  revalidatePath("/", "layout");
  redirect(organization?.onboarding_completed ? "/dashboard" : "/onboarding");
}

export async function signup(formData: FormData) {
  const result = readCredentials(formData);

  if (!result.success) {
    redirect("/login?message=Use+a+valid+email+and+at+least+6+characters");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(result.data);

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Account+created.+Check+your+email,+then+log+in.");
}
