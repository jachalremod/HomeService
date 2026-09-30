"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(6),
});

export async function login(formData: FormData) {
  const result = credentialsSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!result.success) {
    redirect("/login?message=Enter+a+valid+username+and+password");
  }

  const supabase = await createClient();

  const { data: email } = await supabase.rpc("get_email_for_username", {
    p_username: result.data.username,
  });

  if (!email) {
    redirect("/login?message=Invalid+username+or+password");
  }

    const { error } = await supabase.auth.signInWithPassword({
    email,
    password: result.data.password,
  });

    if (error) {
    redirect("/login?message=Invalid+username+or+password");
  }

  const { data: organizationId } = await supabase.rpc("current_organization_id");
  if (!organizationId) redirect("/signup?message=Company+workspace+not+found");
  const { data: organization } = await supabase.from("organizations")
    .select("onboarding_completed").eq("id", organizationId).single();

  revalidatePath("/", "layout");
  redirect(organization?.onboarding_completed ? "/dashboard" : "/onboarding");
}