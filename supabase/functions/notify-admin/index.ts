const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name, approval_token, user_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const approveUrl = `${supabaseUrl}/functions/v1/approve-user?token=${approval_token}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: 'Inter', Arial, sans-serif; background-color: #ffffff; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; background: #f8fafb; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
          <h1 style="color: hsl(220, 25%, 10%); font-size: 20px; margin: 0 0 8px;">New Dashboard Access Request</h1>
          <p style="color: hsl(220, 10%, 46%); font-size: 14px; margin: 0 0 24px;">A new user has requested access to the PM Master Dashboard.</p>
          
          <div style="background: #ffffff; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px; font-size: 14px;"><strong>Name:</strong> ${full_name || "Unknown"}</p>
            <p style="margin: 0 0 8px; font-size: 14px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Requested at:</strong> ${new Date().toISOString()}</p>
          </div>
          
          <a href="${approveUrl}" 
             style="display: inline-block; background-color: hsl(173, 58%, 39%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Approve Access
          </a>
          
          <p style="color: hsl(220, 10%, 46%); font-size: 12px; margin-top: 24px;">
            Clicking the button above will immediately grant this user access to the dashboard.
          </p>
        </div>
      </body>
      </html>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PM Dashboard <onboarding@resend.dev>",
        to: ["disha.bhanot@gmail.com"],
        subject: `Access Request: ${full_name || email} wants dashboard access`,
        html: emailHtml,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Approval email sent", id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-admin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
