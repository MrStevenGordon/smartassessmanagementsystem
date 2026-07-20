"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createStaffAccount, type CreateStaffState } from "../../actions";

const initialState: CreateStaffState = { error: null };

const ROLES = [
  { value: "registrar", label: "Registrar" },
  { value: "teacher", label: "Teacher" },
  { value: "school_admin", label: "School Administrator" },
  { value: "principal", label: "Principal" },
  { value: "grade_supervisor", label: "Grade Supervisor" },
];

export default function NewStaffForm({
  gradeLevels,
}: {
  gradeLevels: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    createStaffAccount,
    initialState
  );
  const [role, setRole] = useState("registrar");

  if (state.success) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-medium text-zinc-900 mb-4">
          {state.success.fullName} added
        </h1>
        <p className="text-sm text-zinc-600 mb-4">
          Share these sign-in details. They should change the password on
          first login.
        </p>
        <div className="border border-zinc-200 rounded-md p-4 text-sm mb-6">
          <p>
            <span className="text-zinc-500">Email:</span>{" "}
            {state.success.email}
          </p>
          <p>
            <span className="text-zinc-500">Temporary password:</span>{" "}
            <span className="font-mono">{state.success.tempPassword}</span>
          </p>
        </div>
        <Link href="/admin/staff" className="text-sm underline text-zinc-700">
          Back to staff accounts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-medium text-zinc-900 mb-6">
        New staff account
      </h1>

      <form action={formAction} className="space-y-4">
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

        <div>
          <label className="block text-sm text-zinc-700 mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-700 mb-1" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {role === "grade_supervisor" && (
          <div>
            <label
              className="block text-sm text-zinc-700 mb-1"
              htmlFor="grade_level_id"
            >
              Grade level supervised
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
        )}

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="bg-zinc-900 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
