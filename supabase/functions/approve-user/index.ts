import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL = "https://myproductdashboard.lovable.app";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return Response.redirect(`${APP_URL}/login?approved=error`, 302);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("approval_token", token)
      .single();

    if (fetchError || !profile) {
      return Response.redirect(`${APP_URL}/login?approved=error`, 302);
    }

    if (profile.approved) {
      return Response.redirect(`${APP_URL}/login?approved=already`, 302);
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ approved: true })
      .eq("approval_token", token);

    if (updateError) {
      console.error("Error approving user:", updateError);
      return Response.redirect(`${APP_URL}/login?approved=error`, 302);
    }

    return Response.redirect(`${APP_URL}/login?approved=true`, 302);
  } catch (error) {
    console.error("Error in approve-user:", error);
    return Response.redirect(`${APP_URL}/login?approved=error`, 302);
  }
});
