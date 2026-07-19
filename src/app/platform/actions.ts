"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GRADE_LEVELS = [
  { name: "First Form", short_code: "7", sort_order: 1 },
  { name: "Second Form", short_code: "8", sort_order: 2 },
  { name: "Third Form", short_code: "9", sort_order: 3 },
  { name: "Fourth Form", short_code: "10", sort_order: 4 },
  { name: "Fifth Form", short_code: "11", sort_order: 5 },
  { name: "Lower Sixth", short_code: "12", sort_order: 6 },
  { name: "Upper Sixth", short_code: "13", sort_order: 7 },
];

export type CreateSchoolState = {
  error: string | null;
  success?: {
    schoolName: string;
    adminEmail: string;
    tempPassword: string;
  };
};

function generateTempPassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function createSchool(
  _prevState: CreateSchoolState,
  formData: FormData
): Promise<CreateSchoolState> {
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const timezone =
    String(formData.get("timezone") || "").trim() || "America/Jamaica";
  const adminName = String(formData.get("admin_name") || "").trim();
  const adminEmail = String(formData.get("admin_email") || "").trim();

  if (!name || !slug || !adminName || !adminEmail) {
    return { error: "All fields are required." };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      error: "Slug can only contain lowercase letters, numbers, and hyphens.",
    };
  }

  const supabase = await createClient();

  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .insert({ name, slug, timezone })
    .select("id")
    .single();

  if (schoolError || !school) {
    return {
      error:
        schoolError?.code === "23505"
          ? "A school with that slug already exists."
          : "Could not create school. " + (schoolError?.message ?? ""),
    };
  }

  const { error: gradeError } = await supabase.from("grade_levels").insert(
    GRADE_LEVELS.map((g) => ({ ...g, school_id: school.id }))
  );

  if (gradeError) {
    return { error: "School created, but grade levels failed: " + gradeError.message };
  }

  // Creating the auth user requires the service-role client.
  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email: adminEmail,
      password: tempPassword,
      email_confirm: true,
    });

  if (authError || !authUser.user) {
    return {
      error:
        "School created, but the admin account could not be created: " +
        (authError?.message ?? "unknown error"),
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    school_id: school.id,
    full_name: adminName,
    email: adminEmail,
  });

  if (profileError) {
    return {
      error: "Admin auth account created, but profile failed: " + profileError.message,
    };
  }

  const { error: roleError } = await admin.from("user_roles").insert({
    school_id: school.id,
    user_id: authUser.user.id,
    role: "school_admin",
  });

  if (roleError) {
    return { error: "Profile created, but role assignment failed: " + roleError.message };
  }

  revalidatePath("/platform");

  return {
    error: null,
    success: { schoolName: name, adminEmail, tempPassword },
  };
}
