import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user!.id)
    .single();

  const { data: school } = await supabase
    .from("schools")
    .select("code")
    .eq("id", profile?.school_id)
    .single();

  const { data: currentYear } = await supabase
    .from("academic_years")
    .select("id, name, start_date, end_date")
    .eq("school_id", profile?.school_id)
    .eq("is_current", true)
    .maybeSingle();

  const { count: classCount } = currentYear
    ? await supabase
        .from("classes")
        .select("id", { count: "exact", head: true })
        .eq("academic_year_id", currentYear.id)
    : { count: 0 };

  return (
    <div>
      <h1 className="text-xl font-medium text-zinc-900 mb-6">Overview</h1>

      {!currentYear ? (
        <div className="border border-zinc-200 rounded-md p-4">
          <p className="text-sm text-zinc-600 mb-3">
            No academic year has been set up yet. Classes and enrollment
            can&apos;t be created until one exists.
          </p>
          <Link
            href="/admin/academic-year/new"
            className="text-sm bg-zinc-900 text-white rounded-md px-4 py-2 inline-block"
          >
            Set up academic year
          </Link>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-md p-4">
          <p className="text-sm text-zinc-900 font-medium">
            {currentYear.name}
          </p>
          <p className="text-sm text-zinc-500 mb-3">
            {currentYear.start_date} — {currentYear.end_date}
          </p>
          <p className="text-sm text-zinc-600">
            {classCount ?? 0} class{classCount === 1 ? "" : "es"} set up
          </p>
        </div>
      )}

      <div className="border border-zinc-200 rounded-md p-4 mt-4">
        <p className="text-sm text-zinc-900 font-medium mb-1">
          Parent application link
        </p>
        <p className="text-sm text-zinc-500 mb-2">
          Share this with parents so they can submit registrations directly.
        </p>
        <code className="text-sm bg-zinc-50 border border-zinc-200 rounded px-2 py-1 inline-block">
          /apply/{school?.code}
        </code>
      </div>
    </div>
  );
}
