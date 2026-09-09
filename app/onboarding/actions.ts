"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  companyName: z.string().trim().min(1),
  ownerName: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().min(1),
  website: z.string().trim(),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  licenseNumber: z.string().trim().min(1),
});

export async function completeCompanyOnboarding(formData: FormData) {
  const result = onboardingSchema.safeParse({
    companyName: formData.get("companyName"), ownerName: formData.get("ownerName"),
    email: formData.get("email"), phone: formData.get("phone"), website: formData.get("website"),
    address: formData.get("address"), city: formData.get("city"), state: formData.get("state"),
    postalCode: formData.get("postalCode"), licenseNumber: formData.get("licenseNumber"),
  });
  if (!result.success) redirect("/onboarding?message=Complete+all+required+company+fields");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: organizationId } = await supabase.rpc("current_organization_id");
  if (!organizationId) redirect("/signup?message=Company+workspace+could+not+be+created");

  const values = result.data;
  const { error: profileError } = await supabase.from("business_profiles").upsert({
    user_id: user.id, organization_id: organizationId, company_name: values.companyName,
    owner_name: values.ownerName, email: values.email, phone: values.phone,
    website: values.website || null, address: values.address, city: values.city,
    state: values.state, postal_code: values.postalCode, license_number: values.licenseNumber,
  }, { onConflict: "organization_id" });
  if (profileError) redirect(`/onboarding?message=${encodeURIComponent(profileError.message)}`);

  const { error: organizationError } = await supabase.from("organizations")
    .update({ name: values.companyName, onboarding_completed: true }).eq("id", organizationId);
  if (organizationError) redirect(`/onboarding?message=${encodeURIComponent(organizationError.message)}`);

  revalidatePath("/", "layout");
  redirect("/dashboard?message=Company+setup+complete");
}

