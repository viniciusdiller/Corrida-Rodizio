import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

serve(async () => {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !serviceKey) {
    return new Response("Missing env", { status: 500 });
  }

  const supabase = createClient(url, serviceKey);
  let totalDeleted = 0;

  while (true) {
    const { data, error } = await supabase
      .from("race_photos")
      .select("id, image_path")
      .lt("expires_at", new Date().toISOString())
      .limit(1000);

    if (error) {
      return new Response("Query failed", { status: 500 });
    }

    if (!data || data.length === 0) break;

    const paths = data.map((row) => row.image_path);
    const { error: removeError } = await supabase.storage
      .from("race-photos")
      .remove(paths);

    if (removeError) {
      return new Response("Storage delete failed", { status: 500 });
    }

    const ids = data.map((row) => row.id);
    const { error: deleteError } = await supabase
      .from("race_photos")
      .delete()
      .in("id", ids);

    if (deleteError) {
      return new Response("DB delete failed", { status: 500 });
    }

    totalDeleted += data.length;
  }

  return Response.json({ deleted: totalDeleted });
});
