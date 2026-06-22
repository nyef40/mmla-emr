import 'dotenv/config';
import { createServer } from 'http';
import { initializeSocketServer } from '../src/lib/socket-server';

const port = Number(process.env.SOCKET_PORT || 3001);
const host = process.env.SOCKET_HOST || '0.0.0.0';

const server = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('MMLA EMR Socket.IO server');
});

initializeSocketServer(server);

server.listen(port, host, () => {
  console.log(`Socket server listening on http://${host}:${port}`);
  console.log(`Socket path: /api/socket`);
  console.log(`CORS origin: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing process:`);
    console.error(`  lsof -i :${port} -P -n`);
    console.error(`  kill <PID>`);
    process.exit(1);
  }
  throw err;
});
