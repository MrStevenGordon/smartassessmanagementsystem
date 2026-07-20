import { createClient } from "@/lib/supabase/server";
import NewStaffForm from "./form";

export default async function NewStaffPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user!.id)
    .single();

  const { data: gradeLevels } = await supabase
    .from("grade_levels")
    .select("id, name")
    .eq("school_id", profile?.school_id)
    .order("sort_order");

  return <NewStaffForm gradeLevels={gradeLevels ?? []} />;
}
