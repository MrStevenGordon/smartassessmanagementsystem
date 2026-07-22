"use client";

import { useActionState, useState } from "react";
import {
  approveSubmission,
  declineSubmission,
  type ActionState,
} from "../actions";

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

const inputClass =
  "w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400";
const labelClass = "block text-sm text-zinc-700 mb-1";

type GuardianRow = {
  relationship_type: string;
  full_name: string;
  address?: string;
  occupation?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
};

type ContactRow = {
  name: string;
  relationship?: string;
  address?: string;
  phone?: string;
};

function splitName(fullName?: string) {
  if (!fullName) return { first: "", last: "" };
  const parts = fullName.trim().split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

export default function ReviewForm({
  submission,
  gradeLevels,
  classes,
  hasCurrentYear,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submission: any;
  gradeLevels: { id: string; name: string; short_code: string }[];
  classes: { id: string; name: string; grade_level_id: string }[];
  hasCurrentYear: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    approveSubmission,
    initialState
  );
  const [gradeLevelId, setGradeLevelId] = useState("");
  const [showDecline, setShowDecline] = useState(false);

  const guardians: GuardianRow[] = submission.guardians ?? [];
  const contacts: ContactRow[] = submission.authorized_contacts ?? [];
  const mother = guardians.find((g) => g.relationship_type === "mother");
  const father = guardians.find((g) => g.relationship_type === "father");
  const guardian = guardians.find((g) => g.relationship_type === "guardian");
  const motherName = splitName(mother?.full_name);
  const fatherName = splitName(father?.full_name);

  const availableClasses = classes.filter(
    (c) => c.grade_level_id === gradeLevelId
  );
  const isPending = submission.status === "submitted";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-zinc-900">
          {submission.first_name} {submission.last_name}
        </h1>
        <span className="text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-600 capitalize">
          {submission.status}
        </span>
      </div>

      {!isPending && (
        <p className="text-sm text-zinc-500 mb-6">
          This application has already been {submission.status}. Fields are
          shown for reference only.
        </p>
      )}

      <form action={formAction}>
        <input type="hidden" name="submission_id" value={submission.id} />

        <fieldset disabled={!isPending} className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-zinc-700 border-b border-zinc-200 pb-2">
              Student information
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input
                  name="first_name"
                  required
                  defaultValue={submission.first_name}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Middle name</label>
                <input
                  name="middle_name"
                  defaultValue={submission.middle_name}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input
                  name="last_name"
                  required
                  defaultValue={submission.last_name}
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
                  defaultValue={submission.date_of_birth}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select
                  name="sex"
                  defaultValue={submission.sex ?? ""}
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
                  defaultValue={submission.place_of_birth}
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
                  defaultValue={submission.address}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Town / city</label>
                  <input
                    name="city_or_town"
                    defaultValue={submission.city_or_town}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Parish</label>
                  <select
                    name="parish"
                    defaultValue={submission.parish ?? ""}
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
                  Address while attending
                </label>
                <input
                  name="address_while_attending"
                  defaultValue={submission.address_while_attending}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Distance from school</label>
                <input
                  name="distance_from_school"
                  defaultValue={submission.distance_from_school}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Entry type</label>
                <select
                  name="entry_type"
                  defaultValue={submission.entry_type ?? ""}
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
                  defaultValue={submission.previous_school}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="on_path_programme"
                  defaultChecked={submission.on_path_programme}
                />
                On the PATH programme
              </label>
            </div>

            <div>
              <label className={labelClass}>PATH family number</label>
              <input
                name="path_family_number"
                defaultValue={submission.path_family_number}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                National student registration number
              </label>
              <input
                name="national_student_registration_number"
                defaultValue={
                  submission.national_student_registration_number
                }
                className={inputClass}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-medium text-zinc-700 border-b border-zinc-200 pb-2">
              Assign grade &amp; class
            </h2>
            {!hasCurrentYear ? (
              <p className="text-sm text-red-600">
                No current academic year is set up — set one up before
                approving.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Grade level</label>
                  <select
                    name="grade_level_id"
                    required={isPending}
                    value={gradeLevelId}
                    onChange={(e) => setGradeLevelId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select a grade level</option>
                    {gradeLevels.map((gl) => (
                      <option key={gl.id} value={gl.id}>
                        {gl.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Class</label>
                  <select
                    name="class_id"
                    required={isPending}
                    disabled={!gradeLevelId}
                    className={`${inputClass} disabled:bg-zinc-50`}
                  >
                    <option value="">
                      {gradeLevelId
                        ? "Select a class"
                        : "Pick a grade level first"}
                    </option>
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <h2 className="text-sm font-medium text-zinc-700 border-b border-zinc-200 pb-2">
              Parent / guardian information
            </h2>

            <div className="border border-zinc-200 rounded-md p-4 space-y-3">
              <h3 className="text-sm font-medium text-zinc-800">Mother</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="mother_first_name"
                  placeholder="First name"
                  defaultValue={motherName.first}
                  className={inputClass}
                />
                <input
                  name="mother_last_name"
                  placeholder="Last name"
                  defaultValue={motherName.last}
                  className={inputClass}
                />
              </div>
              <input
                name="mother_address"
                placeholder="Address"
                defaultValue={mother?.address}
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="mother_occupation"
                  placeholder="Occupation"
                  defaultValue={mother?.occupation}
                  className={inputClass}
                />
                <input
                  name="mother_email"
                  type="email"
                  placeholder="Email"
                  defaultValue={mother?.email}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="mother_phone1"
                  placeholder="Phone 1"
                  defaultValue={mother?.phone1}
                  className={inputClass}
                />
                <input
                  name="mother_phone2"
                  placeholder="Phone 2"
                  defaultValue={mother?.phone2}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="border border-zinc-200 rounded-md p-4 space-y-3">
              <h3 className="text-sm font-medium text-zinc-800">Father</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="father_first_name"
                  placeholder="First name"
                  defaultValue={fatherName.first}
                  className={inputClass}
                />
                <input
                  name="father_last_name"
                  placeholder="Last name"
                  defaultValue={fatherName.last}
                  className={inputClass}
                />
              </div>
              <input
                name="father_address"
                placeholder="Address"
                defaultValue={father?.address}
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="father_occupation"
                  placeholder="Occupation"
                  defaultValue={father?.occupation}
                  className={inputClass}
                />
                <input
                  name="father_email"
                  type="email"
                  placeholder="Email"
                  defaultValue={father?.email}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="father_phone1"
                  placeholder="Phone 1"
                  defaultValue={father?.phone1}
                  className={inputClass}
                />
                <input
                  name="father_phone2"
                  placeholder="Phone 2"
                  defaultValue={father?.phone2}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="border border-zinc-200 rounded-md p-4 space-y-3">
              <h3 className="text-sm font-medium text-zinc-800">Guardian</h3>
              <input
                name="guardian_name"
                placeholder="Name"
                defaultValue={guardian?.full_name}
                className={inputClass}
              />
              <input
                name="guardian_address"
                placeholder="Address"
                defaultValue={guardian?.address}
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="guardian_occupation"
                  placeholder="Occupation"
                  defaultValue={guardian?.occupation}
                  className={inputClass}
                />
                <input
                  name="guardian_email"
                  type="email"
                  placeholder="Email"
                  defaultValue={guardian?.email}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="guardian_phone1"
                  placeholder="Phone 1"
                  defaultValue={guardian?.phone1}
                  className={inputClass}
                />
                <input
                  name="guardian_phone2"
                  placeholder="Phone 2"
                  defaultValue={guardian?.phone2}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Primary contact</label>
              <div className="flex gap-4 text-sm text-zinc-700">
                {["mother", "father", "guardian"].map((rel) => (
                  <label key={rel} className="flex items-center gap-1.5 capitalize">
                    <input
                      type="radio"
                      name="primary_contact"
                      value={rel}
                      defaultChecked={submission.primary_contact === rel}
                    />
                    {rel}
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-medium text-zinc-700 border-b border-zinc-200 pb-2">
              Medical information
            </h2>
            <input
              name="family_doctor_name"
              placeholder="Family doctor"
              defaultValue={submission.family_doctor_name}
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-2">
              {MEDICAL_CONDITIONS.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2 text-sm text-zinc-700"
                >
                  <input
                    type="checkbox"
                    name={`medical_${c.key}`}
                    defaultChecked={submission.medical_conditions?.includes(
                      c.key
                    )}
                  />
                  {c.label}
                </label>
              ))}
            </div>
            <input
              name="medical_conditions_other"
              placeholder="Other conditions"
              defaultValue={submission.medical_conditions_other}
              className={inputClass}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-medium text-zinc-700 border-b border-zinc-200 pb-2">
              Authorized contacts
            </h2>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="border border-zinc-200 rounded-md p-4 grid grid-cols-2 gap-4"
              >
                <input
                  name={`contact_${i}_name`}
                  placeholder="Name"
                  defaultValue={contacts[i]?.name}
                  className={inputClass}
                />
                <input
                  name={`contact_${i}_relationship`}
                  placeholder="Relationship"
                  defaultValue={contacts[i]?.relationship}
                  className={inputClass}
                />
                <input
                  name={`contact_${i}_address`}
                  placeholder="Address"
                  defaultValue={contacts[i]?.address}
                  className={inputClass}
                />
                <input
                  name={`contact_${i}_phone`}
                  placeholder="Phone"
                  defaultValue={contacts[i]?.phone}
                  className={inputClass}
                />
              </div>
            ))}
          </section>
        </fieldset>

        {state.error && (
          <p className="text-sm text-red-600 mt-4">{state.error}</p>
        )}

        {isPending && (
          <div className="flex items-center gap-3 mt-8 pt-4 border-t border-zinc-200">
            <button
              type="submit"
              disabled={pending || !hasCurrentYear}
              className="bg-zinc-900 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50"
            >
              {pending ? "Approving..." : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => setShowDecline((v) => !v)}
              className="text-sm text-red-600 underline"
            >
              Decline
            </button>
          </div>
        )}
      </form>

      {isPending && showDecline && (
        <form
          action={declineSubmission}
          className="mt-4 border border-zinc-200 rounded-md p-4"
        >
          <input type="hidden" name="submission_id" value={submission.id} />
          <label className={labelClass}>
            Reason (shown to the parent, optional)
          </label>
          <textarea
            name="decline_reason"
            rows={2}
            className={inputClass}
          />
          <button
            type="submit"
            className="mt-3 bg-red-600 text-white rounded-md px-4 py-2 text-sm"
          >
            Confirm decline
          </button>
        </form>
      )}
    </div>
  );
}
