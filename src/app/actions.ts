"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type FindSchoolState = {
  error: string | null;
  results?: { name: string; code: string }[];
  searched?: boolean;
};

export async function findSchool(
  _prevState: FindSchoolState,
  formData: FormData
): Promise<FindSchoolState> {
  const query = String(formData.get("query") || "").trim();

  if (!query) {
    return { error: "Enter your school's name." };
  }

  const admin = createAdminClient();
  const { data: schools } = await admin
    .from("schools")
    .select("name, code")
    .ilike("name", `%${query}%`)
    .eq("is_active", true)
    .limit(10);

  return { error: null, results: schools ?? [], searched: true };
}
