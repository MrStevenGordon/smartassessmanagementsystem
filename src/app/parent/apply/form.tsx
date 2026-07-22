"use client";

import { useActionState, useRef, useState } from "react";
import { saveApplication, type ActionState } from "../actions";
import { lookupSibling } from "@/lib/sibling-lookup";
import {
  parseApplicationForm,
  type ParsedApplication,
} from "@/lib/registration-parsing";

const initialState: ActionState = { error: null };

const ENTRY_TYPES = [
  { value: "pep", label: "PEP (new Grade 7 entrant)" },
  { value: "transfer", label: "Transfer" },
  { value: "special_entry", label: "Special entry" },
  { value: "ministry_placed", label: "Ministry placed" },
  { value: "sixth_form", label: "Sixth Form entry" },
];

const PARISHES = [
  "Kingston", "St. Andrew", "St. Catherine", "Clarendon", "Manchester",
  "St. Elizabeth", "Westmoreland", "Hanover", "St. James", "Trelawny",
  "St. Ann", "St. Mary", "Portland", "St. Thomas",
];

const MEDICAL_CONDITIONS = [
  { key: "hay_fever", label: "Hay fever" },
  { key: "asthma", label: "Asthma" },
  { key: "diabetes", label: "Diabetes" },
  { key: "sickle_cell", label: "Sickle cell" },
  { key: "heart_disease", label: "Heart disease" },
  { key: "epilepsy", label: "Epilepsy" },
  { key: "liver_kidney_disease", label: "Liver/kidney disease" },
  { key: "anemia", label: "Anemia" },
];

const STEPS = [
  { title: "Student", description: "Basic details" },
  { title: "Family", description: "Mother, father, and/or guardian" },
  { title: "Health", description: "Doctor and known conditions" },
  { title: "Contacts", description: "Authorized pickup/discussion contacts" },
  { title: "Review", description: "Confirm and submit" },
];

const inputClass =
  "w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400";
const labelClass = "block text-sm text-zinc-700 mb-1";

type GuardianDefault = {
  relationship_type: string;
  full_name: string;
  address?: string;
  occupation?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
};

type ContactDefault = {
  name: string;
  relationship?: string;
  address?: string;
  phone?: string;
};

type SiblingDefault = {
  name: string;
  student_number: string;
  matched_student_id: string | null;
};

type SiblingRow = {
  name: string;
  studentNumber: string;
  matchedId: string | null;
  status: "idle" | "checking" | "found" | "not_found";
  matchedName?: string;
};

export type ApplicationDefaults = {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  date_of_birth?: string;
  sex?: string;
  place_of_birth?: string;
  address?: string;
  city_or_town?: string;
  parish?: string;
  address_while_attending?: string;
  distance_from_school?: string;
  entry_type?: string;
  previous_school?: string;
  on_path_programme?: boolean;
  path_family_number?: string;
  national_student_registration_number?: string;
  family_doctor_name?: string;
  medical_conditions?: string[];
  medical_conditions_other?: string;
  primary_contact?: string;
  guardians?: GuardianDefault[];
  authorized_contacts?: ContactDefault[];
  siblings?: SiblingDefault[];
};

function splitName(fullName?: string) {
  if (!fullName) return { first: "", last: "" };
  const parts = fullName.trim().split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <span className="text-zinc-900 text-right">{value}</span>
    </div>
  );
}

export default function ApplicationForm({
  submissionId,
  defaults,
}: {
  submissionId?: string;
  defaults?: ApplicationDefaults;
}) {
  const [state, formAction, pending] = useActionState(
    saveApplication,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [onPath, setOnPath] = useState(!!defaults?.on_path_programme);
  const [familyError, setFamilyError] = useState("");

  const mother = defaults?.guardians?.find(
    (g) => g.relationship_type === "mother"
  );
  const father = defaults?.guardians?.find(
    (g) => g.relationship_type === "father"
  );
  const guardian = defaults?.guardians?.find(
    (g) => g.relationship_type === "guardian"
  );
  const motherName = splitName(mother?.full_name);
  const fatherName = splitName(father?.full_name);

  const [motherFilled, setMotherFilled] = useState(!!mother);
  const [fatherFilled, setFatherFilled] = useState(!!father);
  const [guardianFilled, setGuardianFilled] = useState(!!guardian);
  const anyGuardianFilled = motherFilled || fatherFilled || guardianFilled;

  const contacts = defaults?.authorized_contacts ?? [];

  const [siblings, setSiblings] = useState<SiblingRow[]>(() => {
    const rows: SiblingRow[] = [0, 1, 2].map((i) => {
      const d = defaults?.siblings?.[i];
      return {
        name: d?.name ?? "",
        studentNumber: d?.student_number ?? "",
        matchedId: d?.matched_student_id ?? null,
        status: d?.matched_student_id ? "found" : "idle",
      };
    });
    return rows;
  });

  function updateSibling(index: number, patch: Partial<SiblingRow>) {
    setSiblings((rows) =>
      rows.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  }

  async function checkSibling(index: number) {
    const row = siblings[index];
    if (!row.studentNumber.trim()) return;
    updateSibling(index, { status: "checking" });
    const result = await lookupSibling(row.studentNumber);
    updateSibling(index, {
      status: result.found ? "found" : "not_found",
      matchedId: result.found ? result.studentId! : null,
      matchedName: result.fullName,
    });
  }

  const hasUnresolvedSibling = siblings.some(
    (r) => r.studentNumber.trim().length > 0 && r.status !== "found"
  );

  // Brief guard after any step change: a fast double-click meant for the
  // previous screen's button can otherwise land on the newly-rendered
  // button in that same spot (e.g. hitting "Submit" right after "Continue").
  const [navLocked, setNavLocked] = useState(false);
  function lockNavBriefly() {
    setNavLocked(true);
    setTimeout(() => setNavLocked(false), 400);
  }

  const [reviewData, setReviewData] = useState<ParsedApplication | null>(
    null
  );

  function goNext() {
    if (step === 0) {
      if (!formRef.current?.reportValidity()) return;
    }
    if (step === 1 && !anyGuardianFilled) {
      setFamilyError(
        "Fill in at least one of Mother, Father, or Guardian before continuing."
      );
      return;
    }
    if (step === 1 && hasUnresolvedSibling) {
      setFamilyError(
        "Check or remove the sibling entry before continuing — it hasn't been verified."
      );
      return;
    }
    setFamilyError("");
    const next = Math.min(step + 1, STEPS.length - 1);
    if (next === STEPS.length - 1 && formRef.current) {
      setReviewData(parseApplicationForm(new FormData(formRef.current)));
    }
    setStep(next);
    lockNavBriefly();
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
    lockNavBriefly();
  }

  return (
    <div>
      <h1 className="text-xl font-medium text-zinc-900 mb-6">
        {submissionId ? "Edit application" : "New application"}
      </h1>

      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i >= step}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                i <= step
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-400"
              } ${i < step ? "cursor-pointer" : ""}`}
            >
              {i < step ? "✓" : i + 1}
            </button>
            <span
              className={`ml-2 text-xs whitespace-nowrap ${
                i === step ? "text-zinc-900 font-medium" : "text-zinc-400"
              }`}
            >
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px bg-zinc-200 mx-3" />
            )}
          </div>
        ))}
      </div>

      <p className="text-sm text-zinc-500 mb-6">{STEPS[step].description}</p>

      <form
        ref={formRef}
        action={formAction}
        onSubmit={(e) => {
          if (step !== STEPS.length - 1) {
            e.preventDefault();
            goNext();
          }
        }}
      >
        {submissionId && (
          <input type="hidden" name="submission_id" value={submissionId} />
        )}

        <div className={step === 0 ? "space-y-4" : "hidden"}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>First name</label>
              <input
                name="first_name"
                required
                defaultValue={defaults?.first_name}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Middle name</label>
              <input
                name="middle_name"
                defaultValue={defaults?.middle_name}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input
                name="last_name"
                required
                defaultValue={defaults?.last_name}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Date of birth</label>
              <input
                name="date_of_birth"
                type="date"
                required
                defaultValue={defaults?.date_of_birth}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select
                name="sex"
                defaultValue={defaults?.sex ?? ""}
                className={inputClass}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Place of birth</label>
              <input
                name="place_of_birth"
                defaultValue={defaults?.place_of_birth}
                className={inputClass}
              />
            </div>
          </div>

          <div className="border border-zinc-200 rounded-md p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-800">Address</h3>
            <div>
              <label className={labelClass}>Street / community</label>
              <input
                name="address"
                defaultValue={defaults?.address}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Town / city</label>
                <input
                  name="city_or_town"
                  defaultValue={defaults?.city_or_town}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Parish</label>
                <select
                  name="parish"
                  defaultValue={defaults?.parish ?? ""}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  {PARISHES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Address while attending (if different)
              </label>
              <input
                name="address_while_attending"
                defaultValue={defaults?.address_while_attending}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Distance from school</label>
              <input
                name="distance_from_school"
                defaultValue={defaults?.distance_from_school}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Entry type</label>
              <select
                name="entry_type"
                defaultValue={defaults?.entry_type ?? ""}
                className={inputClass}
              >
                <option value="">Select</option>
                {ENTRY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Previous school</label>
              <input
                name="previous_school"
                defaultValue={defaults?.previous_school}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="on_path_programme"
                checked={onPath}
                onChange={(e) => setOnPath(e.target.checked)}
              />
              On the PATH programme
            </label>
          </div>

          {onPath && (
            <div>
              <label className={labelClass}>PATH family number</label>
              <input
                name="path_family_number"
                defaultValue={defaults?.path_family_number}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>
              National student registration number
            </label>
            <input
              name="national_student_registration_number"
              defaultValue={defaults?.national_student_registration_number}
              className={inputClass}
            />
          </div>
        </div>

        <div className={step === 1 ? "space-y-6" : "hidden"}>
          <p className="text-xs text-zinc-500">
            Fill in whichever apply. At least one is required.
          </p>

          <div className="border border-zinc-200 rounded-md p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-800">Mother</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input
                  name="mother_first_name"
                  defaultValue={motherName.first}
                  className={inputClass}
                  onChange={(e) =>
                    setMotherFilled(e.target.value.trim().length > 0)
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input
                  name="mother_last_name"
                  defaultValue={motherName.last}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                name="mother_address"
                defaultValue={mother?.address}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Occupation</label>
                <input
                  name="mother_occupation"
                  defaultValue={mother?.occupation}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="mother_email"
                  type="email"
                  defaultValue={mother?.email}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone 1</label>
                <input
                  name="mother_phone1"
                  defaultValue={mother?.phone1}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone 2</label>
                <input
                  name="mother_phone2"
                  defaultValue={mother?.phone2}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="border border-zinc-200 rounded-md p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-800">Father</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input
                  name="father_first_name"
                  defaultValue={fatherName.first}
                  className={inputClass}
                  onChange={(e) =>
                    setFatherFilled(e.target.value.trim().length > 0)
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input
                  name="father_last_name"
                  defaultValue={fatherName.last}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                name="father_address"
                defaultValue={father?.address}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Occupation</label>
                <input
                  name="father_occupation"
                  defaultValue={father?.occupation}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="father_email"
                  type="email"
                  defaultValue={father?.email}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone 1</label>
                <input
                  name="father_phone1"
                  defaultValue={father?.phone1}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone 2</label>
                <input
                  name="father_phone2"
                  defaultValue={father?.phone2}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="border border-zinc-200 rounded-md p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-800">Guardian</h3>
            <div>
              <label className={labelClass}>Name</label>
              <input
                name="guardian_name"
                defaultValue={guardian?.full_name}
                className={inputClass}
                onChange={(e) =>
                  setGuardianFilled(e.target.value.trim().length > 0)
                }
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                name="guardian_address"
                defaultValue={guardian?.address}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Occupation</label>
                <input
                  name="guardian_occupation"
                  defaultValue={guardian?.occupation}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="guardian_email"
                  type="email"
                  defaultValue={guardian?.email}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone 1</label>
                <input
                  name="guardian_phone1"
                  defaultValue={guardian?.phone1}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone 2</label>
                <input
                  name="guardian_phone2"
                  defaultValue={guardian?.phone2}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {anyGuardianFilled && (
            <div>
              <label className={labelClass}>Who is the primary contact?</label>
              <div className="flex gap-4 text-sm text-zinc-700">
                {motherFilled && (
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="primary_contact"
                      value="mother"
                      defaultChecked={defaults?.primary_contact === "mother"}
                    />
                    Mother
                  </label>
                )}
                {fatherFilled && (
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="primary_contact"
                      value="father"
                      defaultChecked={defaults?.primary_contact === "father"}
                    />
                    Father
                  </label>
                )}
                {guardianFilled && (
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="primary_contact"
                      value="guardian"
                      defaultChecked={defaults?.primary_contact === "guardian"}
                    />
                    Guardian
                  </label>
                )}
              </div>
            </div>
          )}

          {familyError && <p className="text-sm text-red-600">{familyError}</p>}

          <div className="border-t border-zinc-200 pt-4">
            <h3 className="text-sm font-medium text-zinc-800 mb-1">
              Siblings currently at this school
            </h3>
            <p className="text-xs text-zinc-500 mb-3">
              If a brother or sister already attends (or has graduated),
              enter their student ID and check it — this helps us connect
              your family&apos;s records.
            </p>

            {siblings.map((row, i) => (
              <div
                key={i}
                className="border border-zinc-200 rounded-md p-3 mb-2 space-y-2"
              >
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Sibling's name"
                    value={row.name}
                    onChange={(e) =>
                      updateSibling(i, { name: e.target.value })
                    }
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="Student ID#"
                      value={row.studentNumber}
                      onChange={(e) =>
                        updateSibling(i, {
                          studentNumber: e.target.value,
                          status: "idle",
                          matchedId: null,
                        })
                      }
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => checkSibling(i)}
                      disabled={
                        !row.studentNumber.trim() || row.status === "checking"
                      }
                      className="text-sm border border-zinc-300 rounded-md px-3 py-2 whitespace-nowrap disabled:opacity-50"
                    >
                      {row.status === "checking" ? "Checking..." : "Check"}
                    </button>
                  </div>
                </div>
                {row.status === "found" && (
                  <p className="text-xs text-emerald-700">
                    Found: {row.matchedName}
                  </p>
                )}
                {row.status === "not_found" && (
                  <p className="text-xs text-red-600">
                    No active or graduated student found with that ID.
                    Double-check it, or clear this row.
                  </p>
                )}
                <input
                  type="hidden"
                  name={`sibling_${i}_name`}
                  value={row.name}
                />
                <input
                  type="hidden"
                  name={`sibling_${i}_student_number`}
                  value={row.studentNumber}
                />
                <input
                  type="hidden"
                  name={`sibling_${i}_matched_id`}
                  value={row.matchedId ?? ""}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={step === 2 ? "space-y-4" : "hidden"}>
          <div>
            <label className={labelClass}>Family doctor</label>
            <input
              name="family_doctor_name"
              defaultValue={defaults?.family_doctor_name}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Medical conditions (tick any that apply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MEDICAL_CONDITIONS.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2 text-sm text-zinc-700"
                >
                  <input
                    type="checkbox"
                    name={`medical_${c.key}`}
                    defaultChecked={defaults?.medical_conditions?.includes(
                      c.key
                    )}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Other conditions</label>
            <input
              name="medical_conditions_other"
              defaultValue={defaults?.medical_conditions_other}
              className={inputClass}
            />
          </div>
        </div>

        <div className={step === 3 ? "space-y-4" : "hidden"}>
          <p className="text-xs text-zinc-500">
            People, other than the parents/guardians already listed,
            permitted to discuss or collect the student. Optional.
          </p>

          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="border border-zinc-200 rounded-md p-4 grid grid-cols-2 gap-4"
            >
              <div>
                <label className={labelClass}>Name</label>
                <input
                  name={`contact_${i}_name`}
                  defaultValue={contacts[i]?.name}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Relationship</label>
                <input
                  name={`contact_${i}_relationship`}
                  defaultValue={contacts[i]?.relationship}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input
                  name={`contact_${i}_address`}
                  defaultValue={contacts[i]?.address}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  name={`contact_${i}_phone`}
                  defaultValue={contacts[i]?.phone}
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>

        <div className={step === 4 ? "space-y-6" : "hidden"}>
          {reviewData && (
            <>
              <section>
                <h3 className="text-sm font-medium text-zinc-800 mb-2">
                  Student
                </h3>
                <div className="border border-zinc-200 rounded-md p-4 text-sm space-y-1.5">
                  <ReviewRow
                    label="Name"
                    value={[
                      reviewData.firstName,
                      reviewData.middleName,
                      reviewData.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <ReviewRow label="Date of birth" value={reviewData.dateOfBirth} />
                  <ReviewRow label="Gender" value={reviewData.sex} />
                  <ReviewRow label="Place of birth" value={reviewData.placeOfBirth} />
                  <ReviewRow
                    label="Address"
                    value={[
                      reviewData.address,
                      reviewData.cityOrTown,
                      reviewData.parish,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <ReviewRow
                    label="Entry type"
                    value={
                      ENTRY_TYPES.find((t) => t.value === reviewData.entryType)
                        ?.label
                    }
                  />
                  <ReviewRow label="Previous school" value={reviewData.previousSchool} />
                  <ReviewRow
                    label="PATH programme"
                    value={reviewData.onPathProgramme ? "Yes" : "No"}
                  />
                  <ReviewRow
                    label="National student registration number"
                    value={reviewData.nsrn}
                  />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-medium text-zinc-800 mb-2">
                  Family
                </h3>
                <div className="space-y-2">
                  {reviewData.guardianBlocks.map((g, i) => (
                    <div
                      key={i}
                      className="border border-zinc-200 rounded-md p-4 text-sm"
                    >
                      <p className="text-zinc-900 font-medium capitalize mb-1">
                        {g.relationshipType}: {g.fullName}
                        {g.relationshipType === reviewData.primaryContact && (
                          <span className="text-xs text-zinc-500 font-normal ml-2">
                            (primary contact)
                          </span>
                        )}
                      </p>
                      <p className="text-zinc-500">{g.address}</p>
                      <p className="text-zinc-500">
                        {g.occupation && `${g.occupation} · `}
                        {g.phone1}
                        {g.phone2 && ` / ${g.phone2}`}
                      </p>
                      <p className="text-zinc-500">{g.email}</p>
                    </div>
                  ))}
                </div>
              </section>

              {reviewData.siblings.length > 0 && (
                <section>
                  <h3 className="text-sm font-medium text-zinc-800 mb-2">
                    Siblings
                  </h3>
                  <div className="space-y-2">
                    {reviewData.siblings.map((s, i) => (
                      <div
                        key={i}
                        className="border border-zinc-200 rounded-md p-3 text-sm flex justify-between"
                      >
                        <span className="text-zinc-900">{s.name}</span>
                        <span className="text-zinc-500">
                          {s.studentNumber}
                          {s.matchedStudentId ? " · verified" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-sm font-medium text-zinc-800 mb-2">
                  Health
                </h3>
                <div className="border border-zinc-200 rounded-md p-4 text-sm space-y-1.5">
                  <ReviewRow label="Family doctor" value={reviewData.familyDoctorName} />
                  <ReviewRow
                    label="Conditions"
                    value={
                      reviewData.medicalConditions.length > 0
                        ? reviewData.medicalConditions
                            .map(
                              (c) =>
                                MEDICAL_CONDITIONS.find((m) => m.key === c)
                                  ?.label ?? c
                            )
                            .join(", ")
                        : "None reported"
                    }
                  />
                  <ReviewRow label="Other" value={reviewData.medicalConditionsOther} />
                </div>
              </section>

              {reviewData.authorizedContacts.length > 0 && (
                <section>
                  <h3 className="text-sm font-medium text-zinc-800 mb-2">
                    Authorized contacts
                  </h3>
                  <div className="space-y-2">
                    {reviewData.authorizedContacts.map((c, i) => (
                      <div
                        key={i}
                        className="border border-zinc-200 rounded-md p-3 text-sm flex justify-between"
                      >
                        <div>
                          <p className="text-zinc-900">{c.name}</p>
                          <p className="text-zinc-500">{c.relationship}</p>
                        </div>
                        <div className="text-right text-zinc-500">
                          <p>{c.address}</p>
                          <p>{c.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        </div>

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-zinc-200">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="text-sm text-zinc-600 disabled:opacity-0"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={navLocked}
              className="bg-zinc-900 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={pending || navLocked}
              onClick={() => formRef.current?.requestSubmit()}
              className="bg-zinc-900 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50"
            >
              {pending
                ? "Submitting..."
                : submissionId
                ? "Resubmit application"
                : "Submit application"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
