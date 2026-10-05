import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { db } from './db.js';
import { dispatchBroadcast, normalizeCode } from './bot.js';

import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '..');

const router = express.Router();

// Setup Multer for file uploads (max 25MB)
const uploadsDir = path.join(BACKEND_ROOT, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e5)}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

// Helper to get active lecturer ID (default to first lecturer for trial run)
function getLecturerId(req: Request): string {
  return (req.headers['x-lecturer-id'] as string) || 'lec_01';
}

// ------------------------------------
// BOT INFO
// ------------------------------------
router.get('/bot/info', (_req: Request, res: Response) => {
  res.json({
    username: process.env.BOT_USERNAME || 'CampusCastTrialBot',
    botUrl: `https://t.me/${process.env.BOT_USERNAME || 'CampusCastTrialBot'}`,
  });
});

// ------------------------------------
// AUTH / LECTURERS
// ------------------------------------
router.get('/auth/me', (req: Request, res: Response) => {
  const lecturerId = getLecturerId(req);
  let lecturer = db.prepare('SELECT * FROM lecturers WHERE id = ?').get(lecturerId) as any;
  if (!lecturer) {
    lecturer = db.prepare('SELECT * FROM lecturers LIMIT 1').get() as any;
  }
  res.json(lecturer);
});

router.post('/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let lecturer = db.prepare('SELECT * FROM lecturers WHERE LOWER(email) = LOWER(?)').get(email.trim()) as any;
  if (!lecturer) {
    const inferredName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const id = `lec_${Date.now()}`;
    db.prepare(`
      INSERT INTO lecturers (id, name, email, institution, department)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, `Prof. ${inferredName}`, email.trim().toLowerCase(), 'University Faculty', 'Academic Department');
    lecturer = db.prepare('SELECT * FROM lecturers WHERE id = ?').get(id);
  }

  res.json(lecturer);
});

router.get('/lecturers', (_req: Request, res: Response) => {
  const lecturers = db.prepare('SELECT * FROM lecturers').all();
  res.json(lecturers);
});

// ------------------------------------
// SECTIONS (CLASSES)
// ------------------------------------
router.get('/sections', (req: Request, res: Response) => {
  const lecturerId = getLecturerId(req);
  const sections = db.prepare(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM subscriptions sub WHERE sub.section_id = s.id) as subscribersCount
    FROM sections s
    WHERE s.lecturer_id = ?
    ORDER BY s.created_at DESC
  `).all(lecturerId) as any[];

  res.json(
    sections.map((s) => ({
      id: s.id,
      lecturerId: s.lecturer_id,
      subjectName: s.subject_name,
      sectionName: s.section_name,
      entryYear: s.entry_year,
      joinCode: s.join_code,
      active: Boolean(s.active),
      createdAt: s.created_at,
      subscribersCount: Number(s.subscribersCount || 0),
    }))
  );
});

router.get('/sections/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const section = db.prepare(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM subscriptions sub WHERE sub.section_id = s.id) as subscribersCount
    FROM sections s
    WHERE s.id = ?
  `).get(id) as any;

  if (!section) {
    return res.status(404).json({ error: 'Section not found' });
  }

  res.json({
    id: section.id,
    lecturerId: section.lecturer_id,
    subjectName: section.subject_name,
    sectionName: section.section_name,
    entryYear: section.entry_year,
    joinCode: section.join_code,
    active: Boolean(section.active),
    createdAt: section.created_at,
    subscribersCount: Number(section.subscribersCount || 0),
  });
});

router.post('/sections', (req: Request, res: Response) => {
  const lecturerId = getLecturerId(req);
  const { subjectName, sectionName, entryYear, joinCode, active = true } = req.body;

  if (!subjectName || !sectionName || !joinCode) {
    return res.status(400).json({ error: 'subjectName, sectionName, and joinCode are required' });
  }

  let cleanCode = joinCode.trim().toUpperCase();
  const existing = db.prepare('SELECT id FROM sections WHERE UPPER(join_code) = ?').get(cleanCode);
  if (existing) {
    cleanCode = `${cleanCode}-${Math.floor(Math.random() * 90 + 10)}`;
  }

  const id = `sec_${Date.now()}`;
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO sections (id, lecturer_id, subject_name, section_name, entry_year, join_code, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, lecturerId, subjectName.trim(), sectionName.trim(), entryYear?.trim() || null, cleanCode, active ? 1 : 0, createdAt);

  // Auto-subscribe trial account and all active bot chats to the new section
  const insertSub = db.prepare('INSERT OR IGNORE INTO subscriptions (section_id, chat_id, created_at) VALUES (?, ?, ?)');
  insertSub.run(id, '6933707628', createdAt);
  const knownSubs = db.prepare('SELECT DISTINCT chat_id FROM subscriptions').all() as { chat_id: string }[];
  for (const s of knownSubs) {
    insertSub.run(id, s.chat_id, createdAt);
  }

  const subCount = (db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE section_id = ?').get(id) as any)?.count || 1;

  res.status(201).json({
    id,
    lecturerId,
    subjectName,
    sectionName,
    entryYear,
    joinCode: cleanCode,
    active: Boolean(active),
    createdAt,
    subscribersCount: Number(subCount),
  });
});

router.put('/sections/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { subjectName, sectionName, entryYear, joinCode, active } = req.body;

  const current = db.prepare('SELECT * FROM sections WHERE id = ?').get(id) as any;
  if (!current) {
    return res.status(404).json({ error: 'Section not found' });
  }

  if (joinCode) {
    const cleanCode = joinCode.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM sections WHERE UPPER(join_code) = ? AND id != ?').get(cleanCode, id);
    if (existing) {
      return res.status(409).json({ error: 'Join code already in use' });
    }
  }

  db.prepare(`
    UPDATE sections
    SET subject_name = COALESCE(?, subject_name),
        section_name = COALESCE(?, section_name),
        entry_year = COALESCE(?, entry_year),
        join_code = COALESCE(?, join_code),
        active = COALESCE(?, active)
    WHERE id = ?
  `).run(
    subjectName || null,
    sectionName || null,
    entryYear !== undefined ? entryYear : null,
    joinCode ? joinCode.trim().toUpperCase() : null,
    active !== undefined ? (active ? 1 : 0) : null,
    id
  );

  const updated = db.prepare(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM subscriptions sub WHERE sub.section_id = s.id) as subscribersCount
    FROM sections s
    WHERE s.id = ?
  `).get(id) as any;

  res.json({
    id: updated.id,
    lecturerId: updated.lecturer_id,
    subjectName: updated.subject_name,
    sectionName: updated.section_name,
    entryYear: updated.entry_year,
    joinCode: updated.join_code,
    active: Boolean(updated.active),
    createdAt: updated.created_at,
    subscribersCount: Number(updated.subscribersCount || 0),
  });
});

router.delete('/sections/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM sections WHERE id = ?').run(id);
  db.prepare('DELETE FROM subscriptions WHERE section_id = ?').run(id);
  db.prepare('DELETE FROM broadcasts WHERE section_id = ?').run(id);
  res.json({ success: true, message: 'Section and subscribers removed' });
});

router.get('/sections/check-code/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const currentSectionId = req.query.currentId as string | undefined;

  const norm = normalizeCode(code);
  const sections = db.prepare('SELECT id, join_code FROM sections').all() as any[];
  const match = sections.find((s) => normalizeCode(s.join_code) === norm);

  if (!match) {
    return res.json({ available: true });
  }

  res.json({ available: match.id === currentSectionId });
});

// Subscriber summary - Privacy-First: returns active count only!
router.get('/sections/:id/subscribers', (req: Request, res: Response) => {
  const { id } = req.params;
  const result = db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE section_id = ?').get(id) as { count: number };
  res.json({
    activeCount: Number(result?.count || 0),
    firstNames: [], // No names stored or returned to respect student privacy!
  });
});

// ------------------------------------
// BROADCAST DISPATCH & HISTORY
// ------------------------------------
router.post('/broadcasts', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const lecturerId = getLecturerId(req);
    const { sectionId, type, message } = req.body;

    if (!sectionId || !type || !message) {
      return res.status(400).json({ error: 'sectionId, type, and message are required' });
    }

    let section = db.prepare('SELECT * FROM sections WHERE id = ?').get(sectionId) as any;
    if (!section) {
      console.warn(`[Broadcast Resilience] Section ${sectionId} not in DB. Auto-registering section for broadcast.`);
      try {
        db.prepare(`
          INSERT OR IGNORE INTO sections (id, lecturer_id, subject_name, section_name, join_code, active, created_at)
          VALUES (?, ?, ?, ?, ?, 1, ?)
        `).run(sectionId, lecturerId, 'Academic Class', 'Section', `SEC_${Date.now()}`, new Date().toISOString());
      } catch (e) {
        // ignore duplicate
      }
    }

    const file = req.file;

    const result = await dispatchBroadcast({
      sectionId,
      lecturerId,
      type,
      message,
      file,
    });

    res.json(result);
  } catch (err: any) {
    console.error('[Broadcast Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch broadcast' });
  }
});

router.get('/sections/:id/broadcasts', (req: Request, res: Response) => {
  const { id } = req.params;
  const broadcasts = db.prepare(`
    SELECT * FROM broadcasts
    WHERE section_id = ?
    ORDER BY sent_at DESC
  `).all(id) as any[];

  res.json(
    broadcasts.map((b) => ({
      id: b.id,
      sectionId: b.section_id,
      lecturerId: b.lecturer_id,
      type: b.type,
      message: b.message,
      fileName: b.file_name,
      fileSize: b.file_size,
      fileType: b.file_type,
      fileUrl: b.file_url,
      sentAt: b.sent_at,
      deliveredCount: Number(b.delivered_count || 0),
      failedCount: Number(b.failed_count || 0),
    }))
  );
});

export default router;
