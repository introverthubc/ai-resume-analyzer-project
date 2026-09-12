import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
const port = Number(process.env.PORT) || 5000;
const server = createApp().listen(port, '127.0.0.1', () => {
  console.log(`Backend running on http://localhost:${port} (session storage in memory)`);
  if (!process.env.GEMINI_API_KEY) console.log('Analysis needs GEMINI_API_KEY in .env. Uploads and versions are available.');
});
server.on('error', (error) => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Stop the other backend or set PORT in .env.` : 'Backend could not start.'); process.exitCode = 1; });
