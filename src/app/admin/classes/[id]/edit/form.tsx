"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  updateClass,
  deleteClass,
  type ActionState,
} from "../../../actions";

const initialState: ActionState = { error: null };

export default function EditClassForm({
  id,
  name,
  gradeLevelName,
}: {
  id: string;
  name: string;
  gradeLevelName: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateClass,
    initialState
  );

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-medium text-zinc-900 mb-1">Edit class</h1>
      <p className="text-sm text-zinc-500 mb-6">{gradeLevelName}</p>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={id} />
        <div>
          <label className="block text-sm text-zinc-700 mb-1" htmlFor="name">
            Class name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={name}
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="bg-zinc-900 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
          <Link
            href="/admin/classes"
            className="text-sm text-zinc-500 underline"
          >
            Cancel
          </Link>
        </div>
      </form>

      <form action={deleteClass} className="mt-6 pt-6 border-t border-zinc-200">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="text-sm text-red-600 underline"
        >
          Delete this class
        </button>
      </form>
    </div>
  );
}
