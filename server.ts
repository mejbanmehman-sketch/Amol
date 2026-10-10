import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Default Fallback Public STUN Servers
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

// In-memory cache for temporary Metered TURN credentials (valid for ~15-30 min)
let cachedIceServers: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Secure Backend Endpoint: Provides temporary WebRTC ICE servers without exposing secrets
app.get('/api/webrtc-credentials', async (req, res) => {
  const meteredDomain = process.env.METERED_DOMAIN || 'amolerhisab.metered.live';
  const meteredSecretKey = process.env.METERED_SECRET_KEY;

  // If secret key is provided and cache is still fresh, serve from cache
  const now = Date.now();
  if (cachedIceServers && now - lastFetchTime < CACHE_TTL_MS) {
    return res.json({
      iceServers: cachedIceServers,
      hasTurn: true,
      source: 'cache'
    });
  }

  if (meteredSecretKey && meteredSecretKey.trim().length > 0) {
    try {
      const response = await fetch(
        `https://${meteredDomain}/api/v1/turn/credentials?apiKey=${meteredSecretKey.trim()}`
      );

      if (response.ok) {
        const meteredServers = await response.json();
        if (Array.isArray(meteredServers) && meteredServers.length > 0) {
          // Combine Google STUN + Metered TURN servers
          const combinedServers = [
            ...DEFAULT_ICE_SERVERS,
            ...meteredServers
          ];
          cachedIceServers = combinedServers;
          lastFetchTime = now;
          return res.json({
            iceServers: combinedServers,
            hasTurn: true,
            source: 'metered'
          });
        }
      } else {
        console.warn(`Metered API returned status ${response.status}:`, await response.text().catch(() => ''));
      }
    } catch (error) {
      console.error('Failed to fetch temporary credentials from Metered:', error);
    }
  }

  // Graceful fallback to Google STUN
  return res.json({
    iceServers: DEFAULT_ICE_SERVERS,
    hasTurn: false,
    source: 'google-stun',
    note: 'Running on Google STUN. Set METERED_SECRET_KEY in server environment for mobile carrier / symmetric NAT traversal.'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
