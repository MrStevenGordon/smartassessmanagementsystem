import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signOut } from "@/app/actions";
import SignupForm from "./form";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const admin = createAdminClient();
  const { data: school } = await admin
    .from("schools")
    .select("id, name")
    .eq("code", code)
    .maybeSingle();

  if (!school) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-sm text-zinc-500">
          We couldn&apos;t find that school. Check the link and try again.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: parentRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("school_id", school.id)
      .eq("role", "parent")
      .maybeSingle();

    if (parentRole) {
      redirect("/parent");
    }

    // Signed in as something else (registrar, admin, a different school's
    // parent, etc.) — don't silently bounce them, since that's confusing.
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12 text-center">
        <div className="max-w-sm">
          <p className="text-sm text-zinc-600 mb-4">
            You&apos;re signed in with an account that doesn&apos;t have
            parent access here. Log out to apply as a parent.
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm underline text-zinc-700"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-lg font-medium text-zinc-900 mb-1">
          {school.name}
        </h1>
        <p className="text-sm text-zinc-500 mb-6">Student registration</p>

        <SignupForm schoolCode={code} />

        <p className="text-sm text-zinc-500 mt-4">
          Already applied?{" "}
          <Link href="/login" className="underline text-zinc-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
