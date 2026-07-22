"use client";

import { useActionState } from "react";
import { signUpParent, type SignupState } from "./actions";

const initialState: SignupState = { error: null };

export default function SignupForm({ schoolCode }: { schoolCode: string }) {
  const [state, formAction, pending] = useActionState(
    signUpParent,
    initialState
  );

  return (
    <form
      action={formAction}
      className="border border-zinc-200 rounded-lg p-6 space-y-4"
    >
      <input type="hidden" name="school_code" value={schoolCode} />

      <div>
        <label className="block text-sm text-zinc-700 mb-1" htmlFor="full_name">
          Your full name
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
        <label className="block text-sm text-zinc-700 mb-1" htmlFor="password">
          Choose a password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-zinc-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Creating account..." : "Start application"}
      </button>
    </form>
  );
}
