import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReviewForm from "./review-form";

export default async function ReviewSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: submission } = await supabase
    .from("registration_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (!submission) {
    notFound();
  }

  const { data: currentYear } = await supabase
    .from("academic_years")
    .select("id")
    .eq("school_id", submission.school_id)
    .eq("is_current", true)
    .maybeSingle();

  const { data: gradeLevels } = await supabase
    .from("grade_levels")
    .select("id, name, short_code")
    .eq("school_id", submission.school_id)
    .neq("short_code", "13")
    .order("sort_order");

  const { data: classes } = currentYear
    ? await supabase
        .from("classes")
        .select("id, name, grade_level_id")
        .eq("academic_year_id", currentYear.id)
        .order("name")
    : { data: [] };

  return (
    <ReviewForm
      submission={submission}
      gradeLevels={gradeLevels ?? []}
      classes={classes ?? []}
      hasCurrentYear={!!currentYear}
    />
  );
}
