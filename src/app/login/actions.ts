"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error: string | null;
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Incorrect email or password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    return {
      error: "This account hasn't been activated yet. Contact your registrar.",
    };
  }

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (platformAdmin) {
    redirect("/platform");
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);

  if (rolesError) {
    return { error: "Could not load your account role: " + rolesError.message };
  }

  const roleNames = (roles ?? []).map((r) => r.role);

  if (roleNames.includes("school_admin")) {
    redirect("/admin");
  }

  if (roleNames.includes("registrar")) {
    redirect("/registrar");
  }

  // Other panels (teacher, parent, student, principal, grade_supervisor)
  // land here as each is built.
  redirect("/");
}
