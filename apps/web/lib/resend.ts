import { Resend } from "resend"

export async function sendMagicLinkEmail(to: string, url: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
    to,
    subject: "Your Khedra sign-in link",
    html: magicLinkHtml(url),
  })

  if (error) throw new Error(error.message)
}

function magicLinkHtml(url: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to Khedra</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:32px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 10px;vertical-align:middle;">
                    <span style="font-size:16px;">📅</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">khedra</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;letter-spacing:-0.5px;">
                Sign in to Khedra
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#71717a;line-height:1.6;">
                Click the button below to sign in. This link expires in 24 hours and can only be used once.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#18181b;">
                    <a href="${url}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Sign in to Khedra →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:28px 0 0;font-size:13px;color:#a1a1aa;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin:4px 0 0;font-size:13px;color:#18181b;word-break:break-all;">
                <a href="${url}" style="color:#18181b;">${url}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f4f4f5;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                If you didn't request this email, you can safely ignore it. Someone may have entered your email by mistake.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
