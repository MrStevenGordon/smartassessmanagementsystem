"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SignupState = {
  error: string | null;
};

export async function signUpParent(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const schoolCode = String(formData.get("school_code") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!schoolCode || !fullName || !email || !password) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const admin = createAdminClient();

  const { data: school } = await admin
    .from("schools")
    .select("id")
    .eq("code", schoolCode)
    .single();

  if (!school) {
    return { error: "Could not find that school." };
  }

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("school_id", school.id)
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return {
      error: "An account with that email already exists. Try logging in instead.",
    };
  }

  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authUser.user) {
    return {
      error: "Could not create your account: " + (authError?.message ?? ""),
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    school_id: school.id,
    full_name: fullName,
    email,
    is_active: true,
  });

  if (profileError) {
    return { error: "Account created, but profile setup failed: " + profileError.message };
  }

  const { error: roleError } = await admin.from("user_roles").insert({
    school_id: school.id,
    user_id: authUser.user.id,
    role: "parent",
  });

  if (roleError) {
    return { error: "Profile created, but role setup failed: " + roleError.message };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirect("/login");
  }

  redirect("/parent");
}
