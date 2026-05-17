export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { name, email, program, role, school, message } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ ok: false, error: 'Name and email are required.' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Open Ground <onboarding@resend.dev>',
        to: [process.env.NOTIFY_EMAIL],
        reply_to: email,
        subject: `New expression of interest — ${name}`,
        html: `
          <h2>New Expression of Interest</h2>
          <table>
            <tr><td><strong>Name</strong></td><td>${name}</td></tr>
            <tr><td><strong>Email</strong></td><td>${email}</td></tr>
            ${program ? `<tr><td><strong>Program</strong></td><td>${program}</td></tr>` : ''}
            ${role ? `<tr><td><strong>Role</strong></td><td>${role}</td></tr>` : ''}
            ${school ? `<tr><td><strong>School</strong></td><td>${school}</td></tr>` : ''}
            ${message ? `<tr><td><strong>Message</strong></td><td>${message}</td></tr>` : ''}
          </table>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Resend error:', err);
      return res.status(500).json({ ok: false, error: 'Failed to send email.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Submit error:', err);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
}
