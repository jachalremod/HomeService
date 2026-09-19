"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveUserSignature(
  signatureData: string,
  mode: "draw" | "type",
  typedName: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("user_signatures").upsert({
    user_id: user.id,
    signature_data: signatureData,
    signature_mode: mode,
    typed_name: typedName || null,
    updated_at: new Date().toISOString(),
  });
}

export async function getUserSignature() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("user_signatures")
    .select("signature_data, signature_mode, typed_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}