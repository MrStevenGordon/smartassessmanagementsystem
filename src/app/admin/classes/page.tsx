import Link from "next/link";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function ClassesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user!.id)
    .single();

  const { data: currentYear } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("school_id", profile?.school_id)
    .eq("is_current", true)
    .maybeSingle();

  if (!currentYear) {
    return (
      <div>
        <h1 className="text-xl font-medium text-zinc-900 mb-4">Classes</h1>
        <p className="text-sm text-zinc-600 mb-3">
          Set up an academic year first.
        </p>
        <Link
          href="/admin/academic-year/new"
          className="text-sm underline text-zinc-700"
        >
          Set up academic year
        </Link>
      </div>
    );
  }

  const { data: gradeLevels } = await supabase
    .from("grade_levels")
    .select("id, name, short_code")
    .eq("school_id", profile?.school_id)
    .order("sort_order");

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, grade_level_id")
    .eq("academic_year_id", currentYear.id)
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-zinc-900">Classes</h1>
          <p className="text-sm text-zinc-500">{currentYear.name}</p>
        </div>
        <Link
          href="/admin/classes/new"
          className="text-sm bg-zinc-900 text-white rounded-md px-4 py-2"
        >
          Add classes
        </Link>
      </div>

      <div className="space-y-6">
        {(gradeLevels ?? []).map((gl) => {
          const gradeClasses = (classes ?? []).filter(
            (c) => c.grade_level_id === gl.id
          );
          return (
            <div key={gl.id}>
              <h2 className="text-sm font-medium text-zinc-700 mb-2">
                {gl.name}
              </h2>
              {gradeClasses.length === 0 ? (
                <p className="text-sm text-zinc-400">No classes yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {gradeClasses.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/classes/${c.id}/edit`}
                      className="group flex items-center gap-1.5 text-sm border border-zinc-200 rounded px-2 py-1 hover:border-zinc-400 hover:bg-zinc-50"
                    >
                      {c.name}
                      <Pencil
                        size={12}
                        className="text-zinc-300 group-hover:text-zinc-500"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
