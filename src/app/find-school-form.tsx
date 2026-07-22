"use client";

import { useActionState } from "react";
import Link from "next/link";
import { findSchool, type FindSchoolState } from "./actions";

const initialState: FindSchoolState = { error: null };

export default function FindSchoolForm() {
  const [state, formAction, pending] = useActionState(
    findSchool,
    initialState
  );

  return (
    <div>
      <form action={formAction} className="flex gap-2">
        <input
          name="query"
          placeholder="Your school's name"
          className="flex-1 border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-zinc-900 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Searching..." : "Find"}
        </button>
      </form>

      {state.error && (
        <p className="text-sm text-red-600 mt-2">{state.error}</p>
      )}

      {state.searched && (
        <div className="mt-3">
          {state.results && state.results.length > 0 ? (
            <ul className="space-y-1">
              {state.results.map((s) => (
                <li key={s.code}>
                  <Link
                    href={`/apply/${s.code}`}
                    className="text-sm text-zinc-700 underline"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">
              No school found. Check the spelling, or ask your school for
              their registration link directly.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
