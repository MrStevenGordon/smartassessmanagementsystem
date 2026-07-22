"use client";

import { useActionState, useRef, useState } from "react";
import { saveApplication, type ActionState } from "../actions";

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
};

function splitName(fullName?: string) {
  if (!fullName) return { first: "", last: "" };
  const parts = fullName.trim().split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
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
    setFamilyError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
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

      <form ref={formRef} action={formAction}>
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
              className="bg-zinc-900 text-white rounded-md px-4 py-2 text-sm"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
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
