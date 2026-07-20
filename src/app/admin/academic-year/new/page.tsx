"use client";

import { useActionState } from "react";
import { createAcademicYear, type ActionState } from "../../actions";

const initialState: ActionState = { error: null };

export default function NewAcademicYearPage() {
  const [state, formAction, pending] = useActionState(
    createAcademicYear,
    initialState
  );

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-medium text-zinc-900 mb-6">
        Set up academic year
      </h1>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-700 mb-1" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. 2026-2027"
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <div>
          <label
            className="block text-sm text-zinc-700 mb-1"
            htmlFor="start_date"
          >
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <div>
          <label
            className="block text-sm text-zinc-700 mb-1"
            htmlFor="end_date"
          >
            End date
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-zinc-900 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Saving..." : "Create academic year"}
        </button>
      </form>
    </div>
  );
}
