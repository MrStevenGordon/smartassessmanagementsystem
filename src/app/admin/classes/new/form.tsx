"use client";

import { useActionState } from "react";
import { createClasses, type ActionState } from "../../actions";

const initialState: ActionState = { error: null };

type GradeLevel = { id: string; name: string; short_code: string };

export default function NewClassesForm({
  academicYearId,
  gradeLevels,
}: {
  academicYearId: string;
  gradeLevels: GradeLevel[];
}) {
  const [state, formAction, pending] = useActionState(
    createClasses,
    initialState
  );

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-medium text-zinc-900 mb-6">Add classes</h1>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="academic_year_id" value={academicYearId} />

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
            htmlFor="class_names"
          >
            Class names
          </label>
          <textarea
            id="class_names"
            name="class_names"
            required
            rows={4}
            placeholder="One per line or comma-separated, e.g. 1-1, 1-2, 1-3"
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="bg-zinc-900 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Saving..." : "Add classes"}
        </button>
      </form>
    </div>
  );
}
