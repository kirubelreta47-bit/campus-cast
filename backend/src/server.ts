import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import routes from './routes.js';
import { bot } from './bot.js';

import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(BACKEND_ROOT, '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-lecturer-id'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadsDir = path.join(BACKEND_ROOT, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Mount REST API
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    bot: process.env.BOT_USERNAME || 'CampusCastTrialBot',
    time: new Date().toISOString(),
  });
});

// Serve frontend dashboard directly from Express if built
const distDir = path.resolve(BACKEND_ROOT, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Start Express server and Telegram bot polling
app.listen(PORT, () => {
  console.log(`🚀 [CampusCast Backend] Running on http://localhost:${PORT}`);
  console.log(`🤖 Starting Telegram Bot polling for @${process.env.BOT_USERNAME || 'CampusCastTrialBot'}...`);

  bot.start({
    onStart: (botInfo) => {
      console.log(`✅ [Telegram Bot Connected] Logged in as @${botInfo.username} (ID: ${botInfo.id})`);
    },
  }).catch((err) => {
    console.error('❌ [Telegram Bot Error]:', err);
  });
});
