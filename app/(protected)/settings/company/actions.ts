"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  companyName: z.string().trim().min(1),
  email: z.union([z.literal(""), z.email()]),
  phone: z.string().trim(),
  website: z.string().trim(),
  address: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim(),
  postalCode: z.string().trim(),
  licenseNumber: z.string().trim(),
});

export async function saveBusinessProfile(formData: FormData) {
  const result = profileSchema.safeParse({
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    website: formData.get("website"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    licenseNumber: formData.get("licenseNumber"),
  });

  if (!result.success) {
    redirect(
      "/settings/company?message=Complete+the+required+business+information",
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: organizationId, error: organizationError } =
    await supabase.rpc("current_organization_id");

  if (organizationError || !organizationId) {
    redirect("/settings/company?message=Company+workspace+not+found");
  }

  const logoFile = formData.get("logoFile");
  let logoUrl: string | undefined;

  if (logoFile instanceof File && logoFile.size > 0) {
    const acceptedTypes = ["image/png", "image/jpeg"];

    if (!acceptedTypes.includes(logoFile.type)) {
      redirect(
        "/settings/company?message=Logo+must+be+a+PNG+or+JPEG+image",
      );
    }

    if (logoFile.size > 5 * 1024 * 1024) {
      redirect(
        "/settings/company?message=Logo+must+be+smaller+than+5+MB",
      );
    }

    const extension =
      logoFile.type === "image/png" ? "png" : "jpg";

    const storagePath =
      `${user.id}/company-logo.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("company-assets")
      .upload(storagePath, await logoFile.arrayBuffer(), {
        contentType: logoFile.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      redirect(
        `/settings/company?message=${encodeURIComponent(
          uploadError.message,
        )}`,
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("company-assets")
      .getPublicUrl(storagePath);

    logoUrl =
      `${publicUrlData.publicUrl}?updated=${Date.now()}`;
  }

  const values = result.data;

  const profileData = {
    user_id: user.id,
    organization_id: organizationId,
    company_name: values.companyName,
    email: values.email || null,
    phone: values.phone || null,
    website: values.website || null,
    address: values.address || null,
    city: values.city || null,
    state: values.state || null,
    postal_code: values.postalCode || null,
    license_number: values.licenseNumber || null,
    ...(logoUrl ? { logo_url: logoUrl } : {}),
  };

  const { error } = await supabase
    .from("business_profiles")
    .upsert(profileData, {
      onConflict: "organization_id",
    });

  if (error) {
    redirect(
      `/settings/company?message=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  const { error: organizationUpdateError } = await supabase
    .from("organizations")
    .update({ name: values.companyName })
    .eq("id", organizationId);

  if (organizationUpdateError) {
    redirect(
      `/settings/company?message=${encodeURIComponent(
        organizationUpdateError.message,
      )}`,
    );
  }

  revalidatePath("/settings/company");
  revalidatePath("/estimates");
  revalidatePath("/estimates/new");
  revalidatePath("/invoices");

  redirect(
    "/settings/company?message=Company+settings+saved",
  );
}
