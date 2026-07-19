"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createSchool, type CreateSchoolState } from "../actions";

const initialState: CreateSchoolState = { error: null };

export default function NewSchoolPage() {
  const [state, formAction, pending] = useActionState(
    createSchool,
    initialState
  );

  if (state.success) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-medium text-zinc-900 mb-4">
          {state.success.schoolName} created
        </h1>
        <p className="text-sm text-zinc-600 mb-4">
          Grade levels (First Form through Upper Sixth) have been set up.
          Share these sign-in details with the school administrator — they
          should change the password on first login.
        </p>
        <div className="border border-zinc-200 rounded-md p-4 text-sm mb-6">
          <p>
            <span className="text-zinc-500">Email:</span>{" "}
            {state.success.adminEmail}
          </p>
          <p>
            <span className="text-zinc-500">Temporary password:</span>{" "}
            <span className="font-mono">{state.success.tempPassword}</span>
          </p>
        </div>
        <Link href="/platform" className="text-sm underline text-zinc-700">
          Back to schools
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-medium text-zinc-900 mb-6">New school</h1>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-700 mb-1" htmlFor="name">
            School name
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-700 mb-1" htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            required
            placeholder="e.g. clarendon-college"
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <div>
          <label
            className="block text-sm text-zinc-700 mb-1"
            htmlFor="timezone"
          >
            Timezone
          </label>
          <input
            id="timezone"
            name="timezone"
            defaultValue="America/Jamaica"
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <hr className="border-zinc-200" />

        <div>
          <label
            className="block text-sm text-zinc-700 mb-1"
            htmlFor="admin_name"
          >
            First school administrator — name
          </label>
          <input
            id="admin_name"
            name="admin_name"
            required
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <div>
          <label
            className="block text-sm text-zinc-700 mb-1"
            htmlFor="admin_email"
          >
            First school administrator — email
          </label>
          <input
            id="admin_email"
            name="admin_email"
            type="email"
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
          {pending ? "Creating..." : "Create school"}
        </button>
      </form>
    </div>
  );
}
