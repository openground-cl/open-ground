export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;
  // TODO: handle submission
  res.status(200).json({ success: true, data: body });
}
