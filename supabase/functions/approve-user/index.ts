import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(htmlPage("Invalid Request", "No approval token provided.", false), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up profile by approval_token
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("approval_token", token)
      .single();

    if (fetchError || !profile) {
      return new Response(htmlPage("Not Found", "This approval link is invalid or has already been used.", false), {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    if (profile.approved) {
      return new Response(htmlPage("Already Approved", `${profile.full_name || profile.email} has already been approved.`, true), {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Approve the user
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ approved: true })
      .eq("approval_token", token);

    if (updateError) {
      console.error("Error approving user:", updateError);
      return new Response(htmlPage("Error", "Failed to approve user. Please try again.", false), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response(
      htmlPage("User Approved ✅", `<strong>${profile.full_name || "User"}</strong> (${profile.email}) now has access to the PM Master Dashboard.`, true),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Error in approve-user:", error);
    return new Response(htmlPage("Error", "An unexpected error occurred.", false), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
});

function htmlPage(title: string, message: string, success: boolean): string {
  const color = success ? "hsl(173, 58%, 39%)" : "hsl(0, 72%, 51%)";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; background: #f8fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border-radius: 16px; padding: 48px; max-width: 440px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    h1 { color: ${color}; font-size: 24px; margin: 0 0 16px; }
    p { color: hsl(220, 10%, 46%); font-size: 15px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
