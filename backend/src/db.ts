import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '..');
const dataDir = path.join(BACKEND_ROOT, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'campuscast.db');
export const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS lecturers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    institution TEXT,
    department TEXT,
    avatar_url TEXT
  );

  CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    lecturer_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    section_name TEXT NOT NULL,
    entry_year TEXT,
    join_code TEXT UNIQUE NOT NULL,
    active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    section_id TEXT NOT NULL,
    chat_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (section_id, chat_id)
  );

  CREATE TABLE IF NOT EXISTS broadcasts (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL,
    lecturer_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    file_name TEXT,
    file_size TEXT,
    file_type TEXT,
    file_url TEXT,
    sent_at TEXT NOT NULL,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0
  );
`);

// Pre-seed demo lecturer if table is empty
const checkLecturer = db.prepare('SELECT COUNT(*) as count FROM lecturers').get() as { count: number };
if (!checkLecturer || checkLecturer.count === 0) {
  const insertLec = db.prepare(`
    INSERT INTO lecturers (id, name, email, institution, department)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertLec.run('lec_01', 'Dr. Abebe Kebede', 'abebe.kebede@aau.edu.et', 'Addis Ababa University', 'Accounting & Finance');
  insertLec.run('lec_02', 'Prof. Sara Yohannes', 'sara.yohannes@aau.edu.et', 'Addis Ababa University', 'School of Pharmacy');

  const insertSec = db.prepare(`
    INSERT INTO sections (id, lecturer_id, subject_name, section_name, entry_year, join_code, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSec.run('sec_01', 'lec_01', 'Accounting & Finance', 'Section A', '2016 Entry', 'ACC-2016-SEC-A', 1, new Date().toISOString());
  insertSec.run('sec_02', 'lec_01', 'Accounting & Finance', 'Section B', '2018 Entry', 'ACC-2018-SEC-B', 1, new Date().toISOString());
  insertSec.run('sec_03', 'lec_01', 'Marketing', 'Section C', '2020 Entry', 'MKT-2020-SEC-C', 1, new Date().toISOString());
  insertSec.run('sec_04', 'lec_02', 'Pharmacy', 'Section A', '2015 Entry', 'PHARM-2015-SEC-A', 1, new Date().toISOString());
}
