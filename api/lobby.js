// Simple in-memory lobby for game discovery
// Games auto-expire after 120 seconds without heartbeat

const games = globalThis.__strawberry_lobby || (globalThis.__strawberry_lobby = new Map());

function cleanExpired() {
  const now = Date.now();
  for (const [id, game] of games) {
    if (now - game.lastSeen > 120000) games.delete(id);
  }
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  cleanExpired();
  
  if (req.method === 'GET') {
    // List active games
    const list = Array.from(games.values());
    return res.json(list);
  }
  
  if (req.method === 'POST') {
    // Register/heartbeat a game
    const { roomCode, hostName, playerCount } = req.body || {};
    if (!roomCode) return res.status(400).json({ error: 'roomCode required' });
    games.set(roomCode, {
      roomCode,
      hostName: hostName || 'Unknown',
      playerCount: playerCount || 1,
      lastSeen: Date.now(),
      createdAt: games.get(roomCode)?.createdAt || Date.now()
    });
    return res.json({ ok: true });
  }
  
  if (req.method === 'DELETE') {
    // Remove a game
    const { roomCode } = req.body || {};
    if (roomCode) games.delete(roomCode);
    return res.json({ ok: true });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
