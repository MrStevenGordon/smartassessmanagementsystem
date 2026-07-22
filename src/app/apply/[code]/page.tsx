import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    if (profile?.school_id === school.id) {
      redirect("/parent");
    }
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
