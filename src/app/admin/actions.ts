"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCurrentUserSchoolId,
  generateTempPassword,
} from "@/lib/auth-helpers";

export type ActionState = {
  error: string | null;
};

export type CreateStaffState = {
  error: string | null;
  success?: {
    fullName: string;
    email: string;
    tempPassword: string;
  };
};

const STAFF_ROLES = [
  "school_admin",
  "registrar",
  "teacher",
  "principal",
  "grade_supervisor",
] as const;

export async function createStaffAccount(
  _prevState: CreateStaffState,
  formData: FormData
): Promise<CreateStaffState> {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const role = String(formData.get("role") || "");
  const gradeLevelId = String(formData.get("grade_level_id") || "") || null;

  if (!fullName || !email || !role) {
    return { error: "Name, email, and role are required." };
  }

  if (!(STAFF_ROLES as readonly string[]).includes(role)) {
    return { error: "Invalid role." };
  }

  if (role === "grade_supervisor" && !gradeLevelId) {
    return { error: "Pick a grade level for a grade supervisor." };
  }

  const schoolId = await getCurrentUserSchoolId();
  if (!schoolId) {
    return { error: "Could not determine your school." };
  }

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

  if (authError || !authUser.user) {
    return {
      error:
        "Could not create the account: " +
        (authError?.message ?? "unknown error"),
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    school_id: schoolId,
    full_name: fullName,
    email,
    is_active: true,
  });

  if (profileError) {
    return { error: "Account created, but profile failed: " + profileError.message };
  }

  const { error: roleError } = await admin.from("user_roles").insert({
    school_id: schoolId,
    user_id: authUser.user.id,
    role,
    grade_level_id: role === "grade_supervisor" ? gradeLevelId : null,
  });

  if (roleError) {
    return { error: "Profile created, but role assignment failed: " + roleError.message };
  }

  revalidatePath("/admin/staff");

  return {
    error: null,
    success: { fullName, email, tempPassword },
  };
}

export async function createAcademicYear(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = String(formData.get("name") || "").trim();
  const startDate = String(formData.get("start_date") || "");
  const endDate = String(formData.get("end_date") || "");

  if (!name || !startDate || !endDate) {
    return { error: "All fields are required." };
  }

  const schoolId = await getCurrentUserSchoolId();
  if (!schoolId) {
    return { error: "Could not determine your school." };
  }

  const supabase = await createClient();

  // Only one academic year can be "current" at a time.
  await supabase
    .from("academic_years")
    .update({ is_current: false })
    .eq("school_id", schoolId)
    .eq("is_current", true);

  const { error } = await supabase.from("academic_years").insert({
    school_id: schoolId,
    name,
    start_date: startDate,
    end_date: endDate,
    is_current: true,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "An academic year with that name already exists."
          : "Could not create academic year: " + error.message,
    };
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateClass(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();

  if (!id || !name) {
    return { error: "Class name is required." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("classes")
    .update({ name })
    .eq("id", id);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "A class with that name already exists for this year."
          : "Could not update class: " + error.message,
    };
  }

  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}

export async function deleteClass(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("classes").delete().eq("id", id);

  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}

export async function createClasses(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const gradeLevelId = String(formData.get("grade_level_id") || "");
  const academicYearId = String(formData.get("academic_year_id") || "");
  const namesRaw = String(formData.get("class_names") || "");

  const names = namesRaw
    .split(/[,\n]/)
    .map((n) => n.trim())
    .filter(Boolean);

  if (!gradeLevelId || !academicYearId || names.length === 0) {
    return { error: "Pick a grade level and enter at least one class name." };
  }

  const schoolId = await getCurrentUserSchoolId();
  if (!schoolId) {
    return { error: "Could not determine your school." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("classes").insert(
    names.map((name) => ({
      school_id: schoolId,
      grade_level_id: gradeLevelId,
      academic_year_id: academicYearId,
      name,
    }))
  );

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "One or more of those class names already exist for this year."
          : "Could not create classes: " + error.message,
    };
  }

  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}
