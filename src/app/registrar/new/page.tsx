import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RegisterStudentForm from "./form";

export default async function NewStudentPage() {
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

  // Registration only applies to First Form (new entrants) through Lower
  // Sixth (transfers, or Fifth Form leavers returning/arriving for Lower
  // Sixth). Upper Sixth students are promoted from Lower Sixth, not
  // registered directly.
  const { data: gradeLevels } = await supabase
    .from("grade_levels")
    .select("id, name, short_code")
    .eq("school_id", profile?.school_id)
    .neq("short_code", "13")
    .order("sort_order");

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, grade_level_id")
    .eq("academic_year_id", currentYear!.id)
    .order("name");

  return (
    <RegisterStudentForm
      gradeLevels={gradeLevels ?? []}
      classes={classes ?? []}
    />
  );
}
