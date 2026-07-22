"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseApplicationForm } from "@/lib/registration-parsing";

export type ActionState = {
  error: string | null;
};

export async function saveApplication(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const submissionId = String(formData.get("submission_id") || "") || null;
  const parsed = parseApplicationForm(formData);

  if (parsed.error) {
    return { error: parsed.error };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Could not determine your account." };
  }

  const record = {
    school_id: profile.school_id,
    submitted_by: user.id,
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
    guardians: parsed.guardianBlocks,
    primary_contact: parsed.primaryContact,
    authorized_contacts: parsed.authorizedContacts,
  };

  if (submissionId) {
    const { error } = await supabase
      .from("registration_submissions")
      .update({
        ...record,
        status: "submitted",
        decline_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (error) {
      return { error: "Could not update your application: " + error.message };
    }
  } else {
    const { error } = await supabase
      .from("registration_submissions")
      .insert(record);

    if (error) {
      return { error: "Could not submit your application: " + error.message };
    }
  }

  revalidatePath("/parent");
  redirect("/parent");
}
