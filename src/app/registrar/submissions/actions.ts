"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCurrentUserSchoolId,
  generateTempPassword,
} from "@/lib/auth-helpers";
import { parseApplicationForm } from "@/lib/registration-parsing";

export type ActionState = {
  error: string | null;
};

export async function approveSubmission(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const submissionId = String(formData.get("submission_id") || "");
  const gradeLevelId = String(formData.get("grade_level_id") || "");
  const classId = String(formData.get("class_id") || "");

  const parsed = parseApplicationForm(formData);
  if (parsed.error) {
    return { error: parsed.error };
  }
  if (!gradeLevelId || !classId) {
    return { error: "Pick a grade level and class before approving." };
  }

  const schoolId = await getCurrentUserSchoolId();
  if (!schoolId) {
    return { error: "Could not determine your school." };
  }

  const supabase = await createClient();

  const {
    data: { user: reviewer },
  } = await supabase.auth.getUser();

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
  const fullName = [parsed.firstName, parsed.middleName, parsed.lastName]
    .filter(Boolean)
    .join(" ");

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
    is_active: false,
  });

  if (studentProfileError) {
    return {
      error:
        "Student login created, but profile failed: " +
        studentProfileError.message,
    };
  }

  const { error: studentRecordError } = await admin.from("students").insert({
    id: studentAuth.user.id,
    school_id: schoolId,
    student_number: studentNumber,
    first_name: parsed.firstName,
    middle_name: parsed.middleName || null,
    last_name: parsed.lastName,
    date_of_birth: parsed.dateOfBirth,
    sex: parsed.sex || null,
    place_of_birth: parsed.placeOfBirth || null,
    address: parsed.address || null,
    city_or_town: parsed.cityOrTown || null,
    parish: parsed.parish,
    address_while_attending: parsed.addressWhileAttending || null,
    distance_from_school: parsed.distanceFromSchool || null,
    entry_type: parsed.entryType,
    previous_school: parsed.previousSchool || null,
    on_path_programme: parsed.onPathProgramme,
    path_family_number: parsed.pathFamilyNumber || null,
    national_student_registration_number: parsed.nsrn || null,
    family_doctor_name: parsed.familyDoctorName || null,
    medical_conditions: parsed.medicalConditions,
    medical_conditions_other: parsed.medicalConditionsOther || null,
    status: "pending",
  });

  if (studentRecordError) {
    return {
      error:
        "Profile created, but student record failed: " +
        studentRecordError.message,
    };
  }

  const { error: studentRoleError } = await admin.from("user_roles").insert({
    school_id: schoolId,
    user_id: studentAuth.user.id,
    role: "student",
  });

  if (studentRoleError) {
    return {
      error:
        "Student record created, but role assignment failed: " +
        studentRoleError.message,
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
      error:
        "Student registered, but class enrollment failed: " +
        enrollmentError.message,
    };
  }

  for (const g of parsed.guardianBlocks) {
    let guardianProfileId: string | null = null;

    if (g.email) {
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("school_id", schoolId)
        .eq("email", g.email)
        .maybeSingle();

      if (existing) {
        guardianProfileId = existing.id;
      } else {
        const { data: guardianAuth, error: guardianAuthError } =
          await admin.auth.admin.createUser({
            email: g.email,
            password: generateTempPassword(),
            email_confirm: true,
          });

        if (guardianAuthError || !guardianAuth.user) {
          return {
            error: `Student registered, but the login for ${g.relationshipType} (${g.email}) failed: ${guardianAuthError?.message ?? "unknown error"}`,
          };
        }

        guardianProfileId = guardianAuth.user.id;

        await admin.from("profiles").insert({
          id: guardianProfileId,
          school_id: schoolId,
          full_name: g.fullName,
          email: g.email,
          phone: g.phone1 || null,
          is_active: true,
        });

        await admin.from("user_roles").insert({
          school_id: schoolId,
          user_id: guardianProfileId,
          role: "parent",
        });
      }
    }

    const { error: guardianRowError } = await admin
      .from("student_guardians")
      .insert({
        school_id: schoolId,
        student_id: studentAuth.user.id,
        relationship_type: g.relationshipType,
        full_name: g.fullName,
        address: g.address || null,
        occupation: g.occupation || null,
        phone1: g.phone1 || null,
        phone2: g.phone2 || null,
        email: g.email || null,
        is_primary_contact: g.relationshipType === parsed.primaryContact,
        guardian_profile_id: guardianProfileId,
      });

    if (guardianRowError) {
      return {
        error: `Student registered, but saving ${g.relationshipType}'s info failed: ${guardianRowError.message}`,
      };
    }
  }

  if (parsed.authorizedContacts.length > 0) {
    const { error: contactsError } = await admin
      .from("authorized_contacts")
      .insert(
        parsed.authorizedContacts.map((c) => ({
          school_id: schoolId,
          student_id: studentAuth.user.id,
          name: c.name,
          relationship: c.relationship || null,
          address: c.address || null,
          phone: c.phone || null,
        }))
      );

    if (contactsError) {
      return {
        error:
          "Student registered, but authorized contacts failed: " +
          contactsError.message,
      };
    }
  }

  await supabase
    .from("registration_submissions")
    .update({
      status: "approved",
      reviewed_by: reviewer?.id,
      reviewed_at: new Date().toISOString(),
      approved_student_id: studentAuth.user.id,
    })
    .eq("id", submissionId);

  revalidatePath("/registrar/submissions");
  redirect(`/registrar/${studentAuth.user.id}`);
}

export async function declineSubmission(formData: FormData): Promise<void> {
  const submissionId = String(formData.get("submission_id") || "");
  const reason = String(formData.get("decline_reason") || "").trim();
  if (!submissionId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("registration_submissions")
    .update({
      status: "declined",
      decline_reason: reason || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  revalidatePath("/registrar/submissions");
  redirect("/registrar/submissions");
}
