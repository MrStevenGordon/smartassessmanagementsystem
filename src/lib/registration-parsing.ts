export type GuardianBlock = {
  relationshipType: "mother" | "father" | "guardian";
  fullName: string;
  address: string;
  occupation: string;
  phone1: string;
  phone2: string;
  email: string;
};

export type AuthorizedContact = {
  name: string;
  relationship: string;
  address: string;
  phone: string;
};

export const MEDICAL_CONDITION_KEYS = [
  "hay_fever",
  "asthma",
  "diabetes",
  "sickle_cell",
  "heart_disease",
  "epilepsy",
  "liver_kidney_disease",
  "anemia",
];

export type ParsedApplication = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  placeOfBirth: string;
  address: string;
  cityOrTown: string;
  parish: string | null;
  addressWhileAttending: string;
  distanceFromSchool: string;
  entryType: string | null;
  previousSchool: string;
  onPathProgramme: boolean;
  pathFamilyNumber: string;
  nsrn: string;
  guardianBlocks: GuardianBlock[];
  primaryContact: string;
  medicalConditions: string[];
  medicalConditionsOther: string;
  familyDoctorName: string;
  authorizedContacts: AuthorizedContact[];
  error: string | null;
};

export function parseApplicationForm(formData: FormData): ParsedApplication {
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

  let error: string | null = null;

  if (!firstName || !lastName || !dateOfBirth) {
    error = "First name, last name, and date of birth are required.";
  }

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

  if (!error && guardianBlocks.length === 0) {
    error = "At least one of Mother, Father, or Guardian is required.";
  }

  let primaryContact = String(formData.get("primary_contact") || "");
  if (guardianBlocks.length === 1) {
    primaryContact = guardianBlocks[0].relationshipType;
  }
  if (
    !error &&
    !guardianBlocks.some((g) => g.relationshipType === primaryContact)
  ) {
    error = "Pick which parent/guardian is the primary contact.";
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

  const authorizedContacts: AuthorizedContact[] = [];
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

  return {
    firstName,
    middleName,
    lastName,
    dateOfBirth,
    sex,
    placeOfBirth,
    address,
    cityOrTown,
    parish,
    addressWhileAttending,
    distanceFromSchool,
    entryType,
    previousSchool,
    onPathProgramme,
    pathFamilyNumber,
    nsrn,
    guardianBlocks,
    primaryContact,
    medicalConditions,
    medicalConditionsOther,
    familyDoctorName,
    authorizedContacts,
    error,
  };
}
