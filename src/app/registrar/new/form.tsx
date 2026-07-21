"use client";

import { useActionState, useState } from "react";
import { registerStudent, type ActionState } from "../actions";

const initialState: ActionState = { error: null };

type GradeLevel = { id: string; name: string; short_code: string };
type ClassRow = { id: string; name: string; grade_level_id: string };

const ENTRY_TYPES = [
  { value: "pep", label: "PEP (new Grade 7 entrant)" },
  { value: "transfer", label: "Transfer" },
  { value: "special_entry", label: "Special entry" },
  { value: "ministry_placed", label: "Ministry placed" },
  { value: "sixth_form", label: "Sixth Form entry" },
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

export default function RegisterStudentForm({
  gradeLevels,
  classes,
}: {
  gradeLevels: GradeLevel[];
  classes: ClassRow[];
}) {
  const [state, formAction, pending] = useActionState(
    registerStudent,
    initialState
  );
  const [gradeLevelId, setGradeLevelId] = useState("");
  const [onPath, setOnPath] = useState(false);
  const [motherFilled, setMotherFilled] = useState(false);
  const [fatherFilled, setFatherFilled] = useState(false);
  const [guardianFilled, setGuardianFilled] = useState(false);

  const availableClasses = classes.filter(
    (c) => c.grade_level_id === gradeLevelId
  );

  const anyGuardianFilled = motherFilled || fatherFilled || guardianFilled;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium text-zinc-900 mb-6">
        Register student
      </h1>

      <form action={formAction} className="space-y-10">
        {/* Student information */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-700 border-b border-zinc-200 pb-2">
            Student information
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>First name</label>
              <input name="first_name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Middle name</label>
              <input name="middle_name" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input name="last_name" required className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Date of birth</label>
              <input
                name="date_of_birth"
                type="date"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select name="sex" className={inputClass}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Place of birth</label>
              <input name="place_of_birth" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Address</label>
            <input name="address" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Address while attending (if different)
              </label>
              <input name="address_while_attending" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Distance from school</label>
              <input name="distance_from_school" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Entry type</label>
              <select name="entry_type" className={inputClass}>
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
              <input name="previous_school" className={inputClass} />
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
              <input name="path_family_number" className={inputClass} />
            </div>
          )}

          <div>
            <label className={labelClass}>
              National student registration number
            </label>
            <input
              name="national_student_registration_number"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Grade level</label>
              <select
                name="grade_level_id"
                required
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
                required
                disabled={!gradeLevelId}
                className={`${inputClass} disabled:bg-zinc-50`}
              >
                <option value="">
                  {gradeLevelId ? "Select a class" : "Pick a grade level first"}
                </option>
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Parent & guardian information */}
        <section className="space-y-6">
          <h2 className="text-sm font-medium text-zinc-700 border-b border-zinc-200 pb-2">
            Parent / guardian information
          </h2>
          <p className="text-xs text-zinc-500 -mt-4">
            Fill in whichever apply. At least one is required.
          </p>

          <div className="border border-zinc-200 rounded-md p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-800">Mother</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input
                  name="mother_first_name"
                  className={inputClass}
                  onChange={(e) =>
                    setMotherFilled(e.target.value.trim().length > 0)
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input name="mother_last_name" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input name="mother_address" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Occupation</label>
                <input name="mother_occupation" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="mother_email"
                  type="email"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone 1</label>
                <input name="mother_phone1" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone 2</label>
                <input name="mother_phone2" className={inputClass} />
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
                  className={inputClass}
                  onChange={(e) =>
                    setFatherFilled(e.target.value.trim().length > 0)
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input name="father_last_name" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input name="father_address" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Occupation</label>
                <input name="father_occupation" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="father_email"
                  type="email"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone 1</label>
                <input name="father_phone1" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone 2</label>
                <input name="father_phone2" className={inputClass} />
              </div>
            </div>
          </div>

          <div className="border border-zinc-200 rounded-md p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-800">Guardian</h3>
            <div>
              <label className={labelClass}>Name</label>
              <input
                name="guardian_name"
                className={inputClass}
                onChange={(e) =>
                  setGuardianFilled(e.target.value.trim().length > 0)
                }
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input name="guardian_address" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Occupation</label>
                <input name="guardian_occupation" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="guardian_email"
                  type="email"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone 1</label>
                <input name="guardian_phone1" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone 2</label>
                <input name="guardian_phone2" className={inputClass} />
              </div>
            </div>
          </div>

          {anyGuardianFilled && (
            <div>
              <label className={labelClass}>
                Who is the primary contact?
              </label>
              <div className="flex gap-4 text-sm text-zinc-700">
                {motherFilled && (
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="primary_contact"
                      value="mother"
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
                    />
                    Guardian
                  </label>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Medical information */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-700 border-b border-zinc-200 pb-2">
            Medical information
          </h2>

          <div>
            <label className={labelClass}>Family doctor</label>
            <input name="family_doctor_name" className={inputClass} />
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
                  <input type="checkbox" name={`medical_${c.key}`} />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Other conditions</label>
            <input name="medical_conditions_other" className={inputClass} />
          </div>
        </section>

        {/* Authorized contacts */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-700 border-b border-zinc-200 pb-2">
            Authorized contacts
          </h2>
          <p className="text-xs text-zinc-500 -mt-2">
            People, other than the parents/guardians above, permitted to
            discuss or collect the student. Optional.
          </p>

          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="border border-zinc-200 rounded-md p-4 grid grid-cols-2 gap-4"
            >
              <div>
                <label className={labelClass}>Name</label>
                <input name={`contact_${i}_name`} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Relationship</label>
                <input
                  name={`contact_${i}_relationship`}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input name={`contact_${i}_address`} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input name={`contact_${i}_phone`} className={inputClass} />
              </div>
            </div>
          ))}
        </section>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="bg-zinc-900 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Registering..." : "Register student"}
        </button>
      </form>
    </div>
  );
}
