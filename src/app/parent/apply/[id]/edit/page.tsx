import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ApplicationForm, { type ApplicationDefaults } from "../../form";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: submission } = await supabase
    .from("registration_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (!submission) {
    notFound();
  }

  const defaults: ApplicationDefaults = {
    first_name: submission.first_name,
    middle_name: submission.middle_name,
    last_name: submission.last_name,
    date_of_birth: submission.date_of_birth,
    sex: submission.sex,
    place_of_birth: submission.place_of_birth,
    address: submission.address,
    city_or_town: submission.city_or_town,
    parish: submission.parish,
    address_while_attending: submission.address_while_attending,
    distance_from_school: submission.distance_from_school,
    entry_type: submission.entry_type,
    previous_school: submission.previous_school,
    on_path_programme: submission.on_path_programme,
    path_family_number: submission.path_family_number,
    national_student_registration_number:
      submission.national_student_registration_number,
    family_doctor_name: submission.family_doctor_name,
    medical_conditions: submission.medical_conditions,
    medical_conditions_other: submission.medical_conditions_other,
    primary_contact: submission.primary_contact,
    guardians: submission.guardians,
    authorized_contacts: submission.authorized_contacts,
  };

  return <ApplicationForm submissionId={submission.id} defaults={defaults} />;
}
