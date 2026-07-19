"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        action={formAction}
        className="w-full max-w-sm border border-zinc-200 rounded-lg p-6"
      >
        <h1 className="text-lg font-medium text-zinc-900 mb-6">Sign in</h1>

        <label className="block text-sm text-zinc-700 mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />

        <label className="block text-sm text-zinc-700 mb-1" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />

        {state.error && (
          <p className="text-sm text-red-600 mb-4">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-zinc-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
