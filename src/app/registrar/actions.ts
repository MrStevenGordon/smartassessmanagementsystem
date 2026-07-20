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

type GuardianInput = {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  isPrimary: boolean;
};

export async function registerStudent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const fullName = String(formData.get("full_name") || "").trim();
  const dateOfBirth = String(formData.get("date_of_birth") || "");
  const sex = String(formData.get("sex") || "");
  const address = String(formData.get("address") || "").trim();
  const previousSchool = String(formData.get("previous_school") || "").trim();
  const gradeLevelId = String(formData.get("grade_level_id") || "");
  const classId = String(formData.get("class_id") || "");

  if (!fullName || !dateOfBirth || !gradeLevelId || !classId) {
    return {
      error: "Name, date of birth, grade level, and class are required.",
    };
  }

  const guardianCount = parseInt(
    String(formData.get("guardian_count") || "0"),
    10
  );
  const guardians: GuardianInput[] = [];
  for (let i = 0; i < guardianCount; i++) {
    const name = String(formData.get(`guardian_${i}_name`) || "").trim();
    const relationship = String(
      formData.get(`guardian_${i}_relationship`) || ""
    ).trim();
    const phone = String(formData.get(`guardian_${i}_phone`) || "").trim();
    const email = String(formData.get(`guardian_${i}_email`) || "")
      .trim()
      .toLowerCase();
    const isPrimary = formData.get(`guardian_${i}_primary`) === "on";

    if (name && relationship) {
      guardians.push({ name, relationship, phone, email, isPrimary });
    }
  }

  if (guardians.length === 0) {
    return { error: "At least one parent or guardian is required." };
  }

  if (guardians.some((g) => !g.email)) {
    return {
      error: "Each guardian needs an email address to create their login.",
    };
  }

  const schoolId = await getCurrentUserSchoolId();
  if (!schoolId) {
    return { error: "Could not determine your school." };
  }

  const supabase = await createClient();

  const { data: school } = await supabase
    .from("schools")
    .select("code")
    .eq("id", schoolId)
    .single();

  if (!school) {
    return { error: "Could not load school details." };
  }

  const { data: currentYear } = await supabase
    .from("academic_years")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  if (!currentYear) {
    return { error: "No current academic year is set up." };
  }

  // Atomically allocate the student's number.
  const { data: studentNumber, error: numberError } = await supabase.rpc(
    "allocate_student_number",
    { _school_id: schoolId }
  );

  if (numberError || !studentNumber) {
    return {
      error: "Could not allocate a student number: " + numberError?.message,
    };
  }

  const admin = createAdminClient();
  const studentEmail = `${studentNumber}@${school.code}.sams`;
  const studentTempPassword = generateTempPassword();

  const { data: studentAuth, error: studentAuthError } =
    await admin.auth.admin.createUser({
      email: studentEmail,
      password: studentTempPassword,
      email_confirm: true,
    });

  if (studentAuthError || !studentAuth.user) {
    return {
      error:
        "Could not create the student's login: " +
        (studentAuthError?.message ?? "unknown error"),
    };
  }

  const { error: studentProfileError } = await admin.from("profiles").insert({
    id: studentAuth.user.id,
    school_id: schoolId,
    full_name: fullName,
    email: studentEmail,
    is_active: false, // gated until registrar activates
  });

  if (studentProfileError) {
    return {
      error: "Student login created, but profile failed: " + studentProfileError.message,
    };
  }

  const { error: studentRecordError } = await admin.from("students").insert({
    id: studentAuth.user.id,
    school_id: schoolId,
    student_number: studentNumber,
    date_of_birth: dateOfBirth,
    sex: sex || null,
    address: address || null,
    previous_school: previousSchool || null,
    status: "pending",
  });

  if (studentRecordError) {
    return {
      error: "Profile created, but student record failed: " + studentRecordError.message,
    };
  }

  const { error: studentRoleError } = await admin.from("user_roles").insert({
    school_id: schoolId,
    user_id: studentAuth.user.id,
    role: "student",
  });

  if (studentRoleError) {
    return {
      error: "Student record created, but role assignment failed: " + studentRoleError.message,
    };
  }

  const { error: enrollmentError } = await admin.from("enrollments").insert({
    school_id: schoolId,
    student_id: studentAuth.user.id,
    class_id: classId,
    academic_year_id: currentYear.id,
    status: "active",
  });

  if (enrollmentError) {
    return {
      error: "Student registered, but class enrollment failed: " + enrollmentError.message,
    };
  }

  // Guardians: reuse an existing profile in this school if the email
  // already exists (e.g. a sibling's parent), otherwise create one.
  for (const guardian of guardians) {
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("school_id", schoolId)
      .eq("email", guardian.email)
      .maybeSingle();

    let guardianId = existing?.id;

    if (!guardianId) {
      const { data: guardianAuth, error: guardianAuthError } =
        await admin.auth.admin.createUser({
          email: guardian.email,
          password: generateTempPassword(),
          email_confirm: true,
        });

      if (guardianAuthError || !guardianAuth.user) {
        return {
          error: `Student registered, but guardian account for ${guardian.email} failed: ${guardianAuthError?.message ?? "unknown error"}`,
        };
      }

      guardianId = guardianAuth.user.id;

      await admin.from("profiles").insert({
        id: guardianId,
        school_id: schoolId,
        full_name: guardian.name,
        email: guardian.email,
        phone: guardian.phone || null,
        is_active: true,
      });

      await admin.from("user_roles").insert({
        school_id: schoolId,
        user_id: guardianId,
        role: "parent",
      });
    }

    await admin.from("student_guardians").insert({
      school_id: schoolId,
      student_id: studentAuth.user.id,
      guardian_id: guardianId,
      relationship: guardian.relationship,
      is_primary_contact: guardian.isPrimary,
    });
  }

  revalidatePath("/registrar");
  redirect(`/registrar/${studentAuth.user.id}`);
}

export async function activateStudent(formData: FormData): Promise<void> {
  const studentId = String(formData.get("student_id") || "");
  if (!studentId) return;

  const supabase = await createClient();

  await supabase.from("profiles").update({ is_active: true }).eq("id", studentId);
  await supabase.from("students").update({ status: "active" }).eq("id", studentId);

  revalidatePath(`/registrar/${studentId}`);
  revalidatePath("/registrar");
}
