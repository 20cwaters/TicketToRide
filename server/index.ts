import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server } from 'socket.io';
import { registerRoomHandlers } from './rooms';

const PORT = Number(process.env.PORT) || 3001;
const isDev = process.env.NODE_ENV !== 'production';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  // In dev the Vite client runs on a different port; in production the
  // client is served from this same origin so CORS is unnecessary.
  cors: isDev ? { origin: true } : undefined,
});

registerRoomHandlers(io);

app.get('/healthz', (_req, res) => res.json({ ok: true }));

const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
  app.get('*', (_req, res) =>
    res
      .status(503)
      .send('Client build not found. Run "npm run build" first (dev: use the Vite server).'),
  );
}

server.listen(PORT, () => {
  console.log(`Ticket to Ride server listening on :${PORT}`);
});
