"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signupSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    companyName: z.string().trim().min(1),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function registerContractor(formData: FormData) {
  const result = signupSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    redirect("/signup?message=Complete+all+fields+and+use+matching+passwords+with+at+least+8+characters");
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
      },
    },
  });

  if (error) {
    redirect(`/signup?message=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect("/login?message=Account+created.+Confirm+your+email,+then+log+in+to+finish+company+setup.");
  }

  redirect("/onboarding");
}

