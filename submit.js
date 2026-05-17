export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL; // your email

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Content-Type': 'application/json',
  };

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
  }

  const { name, email, program, message } = body;

  // Basic validation
  if (!name || !email) {
    return new Response(JSON.stringify({ error: 'Name and email are required' }), { status: 400, headers });
  }

  // Email format check
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers });
  }

  // Sanitize (trim, cap length)
  const row = {
    name: name.trim().slice(0, 200),
    email: email.trim().toLowerCase().slice(0, 200),
    program: (program || '').trim().slice(0, 200),
    message: (message || '').trim().slice(0, 2000),
  };

  // 1. Save to Supabase
  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(row),
  });

  if (!dbRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to save submission' }), { status: 500, headers });
  }

  // 2. Send email via Resend
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Open Ground <onboarding@resend.dev>',
      to: NOTIFY_EMAIL,
      subject: `New interest: ${row.name} — ${row.program || 'No program selected'}`,
      html: `
        <h2>New Form Submission</h2>
        <p><strong>Name:</strong> ${row.name}</p>
        <p><strong>Email:</strong> ${row.email}</p>
        <p><strong>Program:</strong> ${row.program || '—'}</p>
        <p><strong>Message:</strong> ${row.message || '—'}</p>
      `,
    }),
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}