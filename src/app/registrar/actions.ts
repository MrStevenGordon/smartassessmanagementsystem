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

type GuardianBlock = {
  relationshipType: "mother" | "father" | "guardian";
  fullName: string;
  address: string;
  occupation: string;
  phone1: string;
  phone2: string;
  email: string;
};

const MEDICAL_CONDITION_KEYS = [
  "hay_fever",
  "asthma",
  "diabetes",
  "sickle_cell",
  "heart_disease",
  "epilepsy",
  "liver_kidney_disease",
  "anemia",
];

export async function registerStudent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const firstName = String(formData.get("first_name") || "").trim();
  const middleName = String(formData.get("middle_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const dateOfBirth = String(formData.get("date_of_birth") || "");
  const sex = String(formData.get("sex") || "");
  const placeOfBirth = String(formData.get("place_of_birth") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const cityOrTown = String(formData.get("city_or_town") || "").trim();
  const parish = String(formData.get("parish") || "") || null;
  const addressWhileAttending = String(
    formData.get("address_while_attending") || ""
  ).trim();
  const distanceFromSchool = String(
    formData.get("distance_from_school") || ""
  ).trim();
  const entryType = String(formData.get("entry_type") || "") || null;
  const previousSchool = String(formData.get("previous_school") || "").trim();
  const onPathProgramme = formData.get("on_path_programme") === "on";
  const pathFamilyNumber = String(
    formData.get("path_family_number") || ""
  ).trim();
  const nsrn = String(
    formData.get("national_student_registration_number") || ""
  ).trim();
  const gradeLevelId = String(formData.get("grade_level_id") || "");
  const classId = String(formData.get("class_id") || "");

  if (!firstName || !lastName || !dateOfBirth || !gradeLevelId || !classId) {
    return {
      error:
        "First name, last name, date of birth, grade level, and class are required.",
    };
  }

  // Three fixed, independently-optional guardian blocks.
  const guardianBlocks: GuardianBlock[] = [];

  const motherFirst = String(formData.get("mother_first_name") || "").trim();
  const motherLast = String(formData.get("mother_last_name") || "").trim();
  if (motherFirst || motherLast) {
    guardianBlocks.push({
      relationshipType: "mother",
      fullName: `${motherFirst} ${motherLast}`.trim(),
      address: String(formData.get("mother_address") || "").trim(),
      occupation: String(formData.get("mother_occupation") || "").trim(),
      phone1: String(formData.get("mother_phone1") || "").trim(),
      phone2: String(formData.get("mother_phone2") || "").trim(),
      email: String(formData.get("mother_email") || "").trim().toLowerCase(),
    });
  }

  const fatherFirst = String(formData.get("father_first_name") || "").trim();
  const fatherLast = String(formData.get("father_last_name") || "").trim();
  if (fatherFirst || fatherLast) {
    guardianBlocks.push({
      relationshipType: "father",
      fullName: `${fatherFirst} ${fatherLast}`.trim(),
      address: String(formData.get("father_address") || "").trim(),
      occupation: String(formData.get("father_occupation") || "").trim(),
      phone1: String(formData.get("father_phone1") || "").trim(),
      phone2: String(formData.get("father_phone2") || "").trim(),
      email: String(formData.get("father_email") || "").trim().toLowerCase(),
    });
  }

  const guardianName = String(formData.get("guardian_name") || "").trim();
  if (guardianName) {
    guardianBlocks.push({
      relationshipType: "guardian",
      fullName: guardianName,
      address: String(formData.get("guardian_address") || "").trim(),
      occupation: String(formData.get("guardian_occupation") || "").trim(),
      phone1: String(formData.get("guardian_phone1") || "").trim(),
      phone2: String(formData.get("guardian_phone2") || "").trim(),
      email: String(formData.get("guardian_email") || "").trim().toLowerCase(),
    });
  }

  if (guardianBlocks.length === 0) {
    return {
      error: "At least one of Mother, Father, or Guardian is required.",
    };
  }

  let primaryContact = String(formData.get("primary_contact") || "");
  if (guardianBlocks.length === 1) {
    primaryContact = guardianBlocks[0].relationshipType;
  }
  if (!guardianBlocks.some((g) => g.relationshipType === primaryContact)) {
    return {
      error: "Pick which parent/guardian is the primary contact.",
    };
  }

  const medicalConditions = MEDICAL_CONDITION_KEYS.filter(
    (key) => formData.get(`medical_${key}`) === "on"
  );
  const medicalConditionsOther = String(
    formData.get("medical_conditions_other") || ""
  ).trim();
  const familyDoctorName = String(
    formData.get("family_doctor_name") || ""
  ).trim();

  const authorizedContacts: {
    name: string;
    relationship: string;
    address: string;
    phone: string;
  }[] = [];
  for (let i = 0; i < 3; i++) {
    const name = String(formData.get(`contact_${i}_name`) || "").trim();
    if (name) {
      authorizedContacts.push({
        name,
        relationship: String(
          formData.get(`contact_${i}_relationship`) || ""
        ).trim(),
        address: String(formData.get(`contact_${i}_address`) || "").trim(),
        phone: String(formData.get(`contact_${i}_phone`) || "").trim(),
      });
    }
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
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

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
    first_name: firstName,
    middle_name: middleName || null,
    last_name: lastName,
    date_of_birth: dateOfBirth,
    sex: sex || null,
    place_of_birth: placeOfBirth || null,
    address: address || null,
    city_or_town: cityOrTown || null,
    parish: parish,
    address_while_attending: addressWhileAttending || null,
    distance_from_school: distanceFromSchool || null,
    entry_type: entryType,
    previous_school: previousSchool || null,
    on_path_programme: onPathProgramme,
    path_family_number: pathFamilyNumber || null,
    national_student_registration_number: nsrn || null,
    family_doctor_name: familyDoctorName || null,
    medical_conditions: medicalConditions,
    medical_conditions_other: medicalConditionsOther || null,
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

  for (const guardian of guardianBlocks) {
    let guardianProfileId: string | null = null;

    if (guardian.email) {
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("school_id", schoolId)
        .eq("email", guardian.email)
        .maybeSingle();

      if (existing) {
        guardianProfileId = existing.id;
      } else {
        const { data: guardianAuth, error: guardianAuthError } =
          await admin.auth.admin.createUser({
            email: guardian.email,
            password: generateTempPassword(),
            email_confirm: true,
          });

        if (guardianAuthError || !guardianAuth.user) {
          return {
            error: `Student registered, but the login for ${guardian.relationshipType} (${guardian.email}) failed: ${guardianAuthError?.message ?? "unknown error"}`,
          };
        }

        guardianProfileId = guardianAuth.user.id;

        await admin.from("profiles").insert({
          id: guardianProfileId,
          school_id: schoolId,
          full_name: guardian.fullName,
          email: guardian.email,
          phone: guardian.phone1 || null,
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
        relationship_type: guardian.relationshipType,
        full_name: guardian.fullName,
        address: guardian.address || null,
        occupation: guardian.occupation || null,
        phone1: guardian.phone1 || null,
        phone2: guardian.phone2 || null,
        email: guardian.email || null,
        is_primary_contact: guardian.relationshipType === primaryContact,
        guardian_profile_id: guardianProfileId,
      });

    if (guardianRowError) {
      return {
        error: `Student registered, but saving ${guardian.relationshipType}'s info failed: ${guardianRowError.message}`,
      };
    }
  }

  if (authorizedContacts.length > 0) {
    const { error: contactsError } = await admin
      .from("authorized_contacts")
      .insert(
        authorizedContacts.map((c) => ({
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

  revalidatePath("/registrar");
  redirect(`/registrar/${studentAuth.user.id}`);
}

export async function activateStudent(formData: FormData): Promise<void> {
  const studentId = String(formData.get("student_id") || "");
  if (!studentId) return;

  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ is_active: true })
    .eq("id", studentId);
  await supabase
    .from("students")
    .update({ status: "active" })
    .eq("id", studentId);

  revalidatePath(`/registrar/${studentId}`);
  revalidatePath("/registrar");
}
