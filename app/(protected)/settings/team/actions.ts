"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const inviteSchema = z.object({
  email: z.email(),
  role: z.enum(["admin", "office", "field"]),
});

export async function createInvitation(formData: FormData) {
  const result = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!result.success) {
    redirect("/settings/team?message=Enter+a+valid+email+and+role");
  }

  const supabase = await createClient();

  const { data: organizationId } = await supabase.rpc(
    "current_organization_id",
  );

  if (!organizationId) {
    redirect("/settings/team?message=No+organization+found");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: invitation, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: organizationId,
      email: result.data.email,
      role: result.data.role,
      invited_by: user.id,
    })
    .select("token")
    .single();

  if (error || !invitation) {
    redirect(
      `/settings/team?message=${encodeURIComponent(
        error?.message ?? "Unable to create invitation",
      )}`,
    );
  }

  revalidatePath("/settings/team");
  redirect(
    `/settings/team?message=Invitation+created&token=${invitation.token}`,
  );
}

export async function revokeInvitation(formData: FormData) {
  const invitationId = z.uuid().safeParse(formData.get("invitationId"));

  if (!invitationId.success) {
    redirect("/settings/team?message=Invalid+invitation");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("organization_invitations")
    .delete()
    .eq("id", invitationId.data);

  if (error) {
    redirect(`/settings/team?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings/team");
  redirect("/settings/team?message=Invitation+revoked");
}
export async function updateMemberRole(formData: FormData) {
  const result = z
    .object({
      userId: z.uuid(),
      organizationId: z.uuid(),
      role: z.enum(["admin", "office", "field"]),
    })
    .safeParse({
      userId: formData.get("userId"),
      organizationId: formData.get("organizationId"),
      role: formData.get("role"),
    });

  if (!result.success) {
    redirect("/settings/team?message=Invalid+role+update");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("organization_members")
    .update({ role: result.data.role })
    .eq("organization_id", result.data.organizationId)
    .eq("user_id", result.data.userId);

  if (error) {
    redirect(`/settings/team?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings/team");
  redirect("/settings/team?message=Role+updated");
}

export async function removeMember(formData: FormData) {
  const result = z
    .object({
      userId: z.uuid(),
      organizationId: z.uuid(),
    })
    .safeParse({
      userId: formData.get("userId"),
      organizationId: formData.get("organizationId"),
    });

  if (!result.success) {
    redirect("/settings/team?message=Invalid+member");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", result.data.organizationId)
    .eq("user_id", result.data.userId);

  if (error) {
    redirect(`/settings/team?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings/team");
  redirect("/settings/team?message=Member+removed");
}