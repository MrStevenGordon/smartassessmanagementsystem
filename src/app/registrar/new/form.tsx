"use client";

import { useActionState, useState } from "react";
import { registerStudent, type ActionState } from "../actions";

const initialState: ActionState = { error: null };

type GradeLevel = { id: string; name: string; short_code: string };
type ClassRow = { id: string; name: string; grade_level_id: string };

type Guardian = {
  key: number;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  isPrimary: boolean;
};

let guardianKeySeq = 0;

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
  const [guardians, setGuardians] = useState<Guardian[]>([
    {
      key: guardianKeySeq++,
      name: "",
      relationship: "",
      phone: "",
      email: "",
      isPrimary: true,
    },
  ]);

  const availableClasses = classes.filter(
    (c) => c.grade_level_id === gradeLevelId
  );

  function addGuardian() {
    setGuardians((g) => [
      ...g,
      {
        key: guardianKeySeq++,
        name: "",
        relationship: "",
        phone: "",
        email: "",
        isPrimary: false,
      },
    ]);
  }

  function removeGuardian(key: number) {
    setGuardians((g) => g.filter((x) => x.key !== key));
  }

  function updateGuardian(key: number, patch: Partial<Guardian>) {
    setGuardians((g) =>
      g.map((x) => (x.key === key ? { ...x, ...patch } : x))
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-medium text-zinc-900 mb-6">
        Register student
      </h1>

      <form action={formAction} className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-700">
            Student information
          </h2>

          <div>
            <label
              className="block text-sm text-zinc-700 mb-1"
              htmlFor="full_name"
            >
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              required
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm text-zinc-700 mb-1"
                htmlFor="date_of_birth"
              >
                Date of birth
              </label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                required
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-700 mb-1" htmlFor="sex">
                Sex
              </label>
              <select
                id="sex"
                name="sex"
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label
              className="block text-sm text-zinc-700 mb-1"
              htmlFor="address"
            >
              Address
            </label>
            <input
              id="address"
              name="address"
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label
              className="block text-sm text-zinc-700 mb-1"
              htmlFor="previous_school"
            >
              Previous school
            </label>
            <input
              id="previous_school"
              name="previous_school"
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm text-zinc-700 mb-1"
                htmlFor="grade_level_id"
              >
                Grade level
              </label>
              <select
                id="grade_level_id"
                name="grade_level_id"
                required
                value={gradeLevelId}
                onChange={(e) => setGradeLevelId(e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
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
              <label
                className="block text-sm text-zinc-700 mb-1"
                htmlFor="class_id"
              >
                Class
              </label>
              <select
                id="class_id"
                name="class_id"
                required
                disabled={!gradeLevelId}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:bg-zinc-50"
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

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-700">
              Parents / guardians
            </h2>
            <button
              type="button"
              onClick={addGuardian}
              className="text-sm text-zinc-600 underline"
            >
              Add another guardian
            </button>
          </div>

          <input type="hidden" name="guardian_count" value={guardians.length} />

          {guardians.map((g, i) => (
            <div
              key={g.key}
              className="border border-zinc-200 rounded-md p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-700 mb-1">
                    Name
                  </label>
                  <input
                    name={`guardian_${i}_name`}
                    required
                    value={g.name}
                    onChange={(e) =>
                      updateGuardian(g.key, { name: e.target.value })
                    }
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-700 mb-1">
                    Relationship
                  </label>
                  <input
                    name={`guardian_${i}_relationship`}
                    required
                    placeholder="e.g. Mother, Father, Guardian"
                    value={g.relationship}
                    onChange={(e) =>
                      updateGuardian(g.key, { relationship: e.target.value })
                    }
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-700 mb-1">
                    Phone
                  </label>
                  <input
                    name={`guardian_${i}_phone`}
                    value={g.phone}
                    onChange={(e) =>
                      updateGuardian(g.key, { phone: e.target.value })
                    }
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-700 mb-1">
                    Email
                  </label>
                  <input
                    name={`guardian_${i}_email`}
                    type="email"
                    required
                    value={g.email}
                    onChange={(e) =>
                      updateGuardian(g.key, { email: e.target.value })
                    }
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    name={`guardian_${i}_primary`}
                    checked={g.isPrimary}
                    onChange={(e) =>
                      updateGuardian(g.key, { isPrimary: e.target.checked })
                    }
                  />
                  Primary contact
                </label>
                {guardians.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGuardian(g.key)}
                    className="text-sm text-red-600 underline"
                  >
                    Remove
                  </button>
                )}
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
