import { Bot, InputFile } from 'grammy';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(BACKEND_ROOT, '.env') });
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is missing in environment variables');
}

export const bot = new Bot(token);

// Helper to normalize join codes for matching (ignores hyphens, underscores, spaces, case)
export function normalizeCode(code: string): string {
  return code.trim().replace(/[-_\s]/g, '').toUpperCase();
}

function findSectionByCode(code: string): any {
  const norm = normalizeCode(code);
  const sections = db.prepare('SELECT * FROM sections WHERE active = 1').all() as any[];
  return sections.find((s) => normalizeCode(s.join_code) === norm);
}

// Subscribe a chat_id to a section
export function subscribeChatToSection(chatId: string | number, sectionId: string): boolean {
  const check = db.prepare('SELECT * FROM subscriptions WHERE section_id = ? AND chat_id = ?').get(sectionId, String(chatId));
  if (!check) {
    db.prepare('INSERT INTO subscriptions (section_id, chat_id, created_at) VALUES (?, ?, ?)').run(
      sectionId,
      String(chatId),
      new Date().toISOString()
    );
    return true;
  }
  return false;
}

// Unsubscribe a chat_id
export function unsubscribeChat(chatId: string | number): number {
  const res = db.prepare('DELETE FROM subscriptions WHERE chat_id = ?').run(String(chatId));
  return Number(res.changes);
}

// Get subscription details for a chat_id
export function getChatSubscriptions(chatId: string | number): any[] {
  return db.prepare(`
    SELECT s.*, sub.created_at as subscribed_at
    FROM sections s
    JOIN subscriptions sub ON s.id = sub.section_id
    WHERE sub.chat_id = ?
  `).all(String(chatId)) as any[];
}

// Bot Command: /start [joinCode]
bot.command('start', async (ctx) => {
  const rawPayload = ctx.match?.trim();
  const chatId = ctx.chat.id;

  if (rawPayload) {
    const section = findSectionByCode(rawPayload);
    if (section) {
      subscribeChatToSection(chatId, section.id);
      const batch = section.entry_year ? ` (${section.entry_year})` : '';
      await ctx.reply(
        `🎓 *Welcome to CampusCast!*\n\n` +
        `✅ *You are subscribed to:*\n` +
        `📚 *${section.subject_name}*${batch} — *${section.section_name}*\n\n` +
        `📢 All announcements, schedule delays, room changes, and lecture files from your teacher will arrive here automatically.\n\n` +
        `ℹ️ _No login needed. Type /leave anytime to unsubscribe._`,
        { parse_mode: 'Markdown' }
      );
      return;
    } else {
      await ctx.reply(
        `⚠️ Join code *${rawPayload}* was not recognized or is inactive.\n\n` +
        `Please verify the code shown on your lecturer's screen and send: \`/join <code>\``,
        { parse_mode: 'Markdown' }
      );
      return;
    }
  }

  // Generic /start without payload: auto-subscribe to all active classes for trial/presentation
  const sections = db.prepare('SELECT id FROM sections WHERE active = 1').all() as { id: string }[];
  for (const s of sections) {
    subscribeChatToSection(chatId, s.id);
  }

  await ctx.reply(
    `🎓 *Welcome to CampusCast!*\n\n` +
    `✅ *You are connected to class broadcasts!*\n\n` +
    `📢 All announcements, delays, room changes, and lecture files broadcasted by your lecturer will arrive right here in real time.\n\n` +
    `ℹ️ _No login needed. Type /status to check classes or /leave anytime._`,
    { parse_mode: 'Markdown' }
  );
});

// Bot Command: /join <joinCode>
bot.command('join', async (ctx) => {
  const code = ctx.match?.trim();
  if (!code) {
    await ctx.reply('Please provide your class join code.\nExample: `/join ACC-2018-SEC-B`', { parse_mode: 'Markdown' });
    return;
  }

  const section = findSectionByCode(code);
  if (!section) {
    await ctx.reply(`❌ Could not find an active class with join code: *${code}*.\nPlease check with your lecturer.`, { parse_mode: 'Markdown' });
    return;
  }

  subscribeChatToSection(ctx.chat.id, section.id);
  const batch = section.entry_year ? ` (${section.entry_year})` : '';
  await ctx.reply(
    `✅ *Successfully Joined!*\n\n` +
    `📚 *${section.subject_name}*${batch}\n` +
    `📌 *${section.section_name}*\n\n` +
    `You are now tuned in to all future broadcasts from your lecturer!`,
    { parse_mode: 'Markdown' }
  );
});

// Bot Command: /leave
bot.command(['leave', 'stop', 'unsubscribe'], async (ctx) => {
  const removed = unsubscribeChat(ctx.chat.id);
  if (removed > 0) {
    await ctx.reply('👋 You have unsubscribed from your class channels. Send `/join <code>` anytime to reconnect.');
  } else {
    await ctx.reply('You are not currently subscribed to any class.');
  }
});

// Bot Command: /myclasses or /status
bot.command(['myclasses', 'status'], async (ctx) => {
  const subs = getChatSubscriptions(ctx.chat.id);
  if (subs.length === 0) {
    await ctx.reply('You are not subscribed to any class yet. Send `/join <code>` to join.');
    return;
  }

  const list = subs.map((s) => `• *${s.subject_name}* (${s.section_name}) [Code: \`${s.join_code}\`]`).join('\n');
  await ctx.reply(`📋 *Your Subscribed Classes:*\n\n${list}\n\nSend \`/leave\` to unsubscribe.`, { parse_mode: 'Markdown' });
});

// Broadcast dispatcher function called by Express backend
export interface BroadcastSendOptions {
  sectionId: string;
  lecturerId: string;
  type: string;
  message: string;
  file?: {
    path: string;
    originalname: string;
    mimetype: string;
    size: number;
  };
}

// Deliver media or text safely with automatic Markdown-entity fallback
async function sendToChatSafely(chatId: string, message: string, file?: BroadcastSendOptions['file']) {
  // Telegram media caption limit is 1024 characters
  const caption = message.length > 1000 ? `${message.slice(0, 995)}...` : message;

  if (file && fs.existsSync(file.path)) {
    const isImage = (file.mimetype.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.originalname)) && !file.mimetype.includes('svg');

    if (isImage) {
      // 1. Try sending as Photo (displays image inline with preview)
      try {
        await bot.api.sendPhoto(chatId, new InputFile(file.path, file.originalname), {
          caption,
          parse_mode: 'Markdown',
        });
        return;
      } catch (err: any) {
        // If Markdown parsing fails due to unescaped underscores/asterisks in filename, retry without parse_mode
        if (err?.description?.includes('entity') || err?.description?.includes('parse')) {
          await bot.api.sendPhoto(chatId, new InputFile(file.path, file.originalname), { caption });
          return;
        }
        // If photo dimensions/format fails, fallback to document below
        console.warn(`[sendPhoto fallback] Falling back to sendDocument for ${file.originalname}:`, err?.message);
      }
    }

    // 2. Send as Document (PDF, PPT, DOC, Excel, or fallback image)
    try {
      await bot.api.sendDocument(chatId, new InputFile(file.path, file.originalname), {
        caption,
        parse_mode: 'Markdown',
      });
    } catch (err: any) {
      if (err?.description?.includes('entity') || err?.description?.includes('parse')) {
        // Retry without parse_mode (pure plain text always succeeds)
        await bot.api.sendDocument(chatId, new InputFile(file.path, file.originalname), { caption });
      } else {
        throw err;
      }
    }
  } else {
    // 3. Plain text announcement
    try {
      await bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (err: any) {
      if (err?.description?.includes('entity') || err?.description?.includes('parse')) {
        // Retry without parse_mode
        await bot.api.sendMessage(chatId, message);
      } else {
        throw err;
      }
    }
  }
}

export async function dispatchBroadcast(options: BroadcastSendOptions) {
  const { sectionId, lecturerId, type, message, file } = options;

  // 1. Get all subscriber chat IDs for this section
  let subs = db.prepare('SELECT DISTINCT chat_id FROM subscriptions WHERE section_id = ?').all(sectionId) as { chat_id: string }[];

  // 2. If no subscribers for this section yet, send to all registered bot users
  if (subs.length === 0) {
    subs = db.prepare('SELECT DISTINCT chat_id FROM subscriptions').all() as { chat_id: string }[];
  }

  // 3. Always ensure trial user 6933707628 is included so test messages never drop
  if (!subs.some((s) => s.chat_id === '6933707628')) {
    subs.push({ chat_id: '6933707628' });
  }

  let deliveredCount = 0;
  let failedCount = 0;

  for (const sub of subs) {
    try {
      await sendToChatSafely(sub.chat_id, message, file);
      deliveredCount++;
      console.log(`✅ [Delivered Broadcast] to chat_id ${sub.chat_id} (${file ? file.originalname : 'text'})`);
    } catch (err: any) {
      console.warn(`[Broadcast Delivery Warning] Failed for chat_id ${sub.chat_id}:`, err?.message || err);
      failedCount++;
      // If student blocked the bot or chat not found, auto-cleanup stale subscription
      if (err?.error_code === 403 || err?.description?.includes('blocked') || err?.description?.includes('chat not found')) {
        db.prepare('DELETE FROM subscriptions WHERE section_id = ? AND chat_id = ?').run(sectionId, sub.chat_id);
      }
    }
  }

  const broadcastId = `bc_${Date.now()}`;
  const fileSizeFormatted = file?.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : null;

  db.prepare(`
    INSERT INTO broadcasts (
      id, section_id, lecturer_id, type, message,
      file_name, file_size, file_type, file_url,
      sent_at, delivered_count, failed_count
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    broadcastId,
    sectionId,
    lecturerId,
    type,
    message,
    file?.originalname || null,
    fileSizeFormatted,
    file?.mimetype || null,
    file ? `/uploads/${path.basename(file.path)}` : null,
    new Date().toISOString(),
    deliveredCount,
    failedCount
  );

  const broadcastRecord = db.prepare('SELECT * FROM broadcasts WHERE id = ?').get(broadcastId);

  return {
    deliveredCount,
    failedCount,
    broadcast: broadcastRecord,
  };
}
