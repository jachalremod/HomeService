"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const customerSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.union([z.literal(""), z.email()]),
  phone: z.string().trim(),
  projectAddress: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim(),
  postalCode: z.string().trim(),
});

export async function createCustomer(formData: FormData) {
  const result = customerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    projectAddress: formData.get("projectAddress"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
  });

  if (!result.success) {
    redirect("/customers?message=Enter+the+required+customer+information");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const values = result.data;

  const { error } = await supabase.from("customers").insert({
    user_id: user.id,
    first_name: values.firstName,
    last_name: values.lastName,
    email: values.email || null,
    phone: values.phone || null,
    project_address: values.projectAddress || null,
    city: values.city || null,
    state: values.state || null,
    postal_code: values.postalCode || null,
  });

  if (error) {
    redirect(`/customers?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/customers");
  redirect("/customers?message=Customer+created+successfully");
}
