/**
 * POST /api/send-welcome-email
 * INTERNAL route — called only by the Stripe webhook after subscription.confirmed.
 * Protected by CRON_SECRET so it's not publicly accessible.
 *
 * Body: { email: string; firstName?: string }
 */
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// NOTE: do NOT instantiate Resend at module top-level.
// Next.js evaluates module code during build-time page collection,
// which would throw "Missing API key" if RESEND_API_KEY isn't in the
// build environment. Lazy-init inside the handler instead.

const buildHtml = (firstName: string) => `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background-color: #F8F5EC; font-family: Helvetica, sans-serif; color: #1B1B1B; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 2px solid #1B1B1B; border-radius: 36px 4px 36px 4px; overflow: hidden; }
    .header { background-color: #1B1B1B; padding: 40px; text-align: center; }
    .header h1 { color: #F8F5EC; margin: 0; font-size: 32px; text-transform: uppercase; letter-spacing: -1px; }
    .header p { color: #00FD00; font-family: monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 10px 0 0; }
    .content { padding: 40px; }
    .intro { font-size: 20px; font-weight: bold; line-height: 1.4; margin-bottom: 20px; }
    .feature { margin-bottom: 24px; }
    .feature h3 { color: #0456fb; margin: 0 0 4px; font-size: 18px; }
    .feature p { margin: 0; font-size: 16px; color: #555; }
    .cta { text-align: center; margin-top: 40px; }
    .btn { background-color: #0456fb; color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 20px 4px 20px 4px; font-weight: bold; display: inline-block; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ASTRONAT</h1>
      <p>SYSTEM ACCESS GRANTED</p>
    </div>
    <div class="content">
      <div class="intro">Hey ${firstName || 'Stargazer'}, your cosmic operating system is online.</div>
      <p>Your subscription is active and your chart is fully unlocked. Here is what you can do now:</p>
      
      <div class="feature">
        <h3>🌍 Travel Astrology</h3>
        <p>Explore your Astrocartography map to find your high-frequency soul destinations.</p>
      </div>
      <div class="feature">
        <h3>💞 Couples &amp; Connection</h3>
        <p>Sync charts with anyone to see your synastry and collective vibration.</p>
      </div>
      <div class="feature">
        <h3>🎯 Life Goals</h3>
        <p>Draft your monthly goals and align them with real-time planetary transits.</p>
      </div>

      <div class="cta">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://astronat.vercel.app'}/home" class="btn">Enter The Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>`

export async function POST(req: Request) {
  // Basic internal auth: webhook passes a shared secret
  const authHeader = req.headers.get('x-internal-secret')
  if (authHeader !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Lazy-init: only instantiated on real requests, not at build time
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { email, firstName } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: 'AstroNat <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to AstroNat — System Unlocked 🪐',
      html: buildHtml(firstName || ''),
    })

    if (error) {
      console.error('[welcome-email] Resend error:', error)
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }

    console.log('[welcome-email] Sent to', email, '| ID:', data?.id)
    return NextResponse.json({ success: true, id: data?.id })
  } catch (err: any) {
    console.error('[welcome-email] Unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
