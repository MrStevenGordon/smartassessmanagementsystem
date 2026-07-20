import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewClassesForm from "./form";

export default async function NewClassesPage() {
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
    .select("id")
    .eq("school_id", profile?.school_id)
    .eq("is_current", true)
    .maybeSingle();

  if (!currentYear) {
    redirect("/admin/academic-year/new");
  }

  const { data: gradeLevels } = await supabase
    .from("grade_levels")
    .select("id, name, short_code")
    .eq("school_id", profile?.school_id)
    .order("sort_order");

  return (
    <NewClassesForm
      academicYearId={currentYear!.id}
      gradeLevels={gradeLevels ?? []}
    />
  );
}
