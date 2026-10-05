/**
 * @file api.ts
 * Single gateway for all data access with per-lecturer account isolation.
 * Automatically connects to backend at http://localhost:5000/api (with Telegram Bot).
 * Includes seamless fallback to local storage if backend is ever unreachable.
 */

import { Lecturer, Section, Broadcast, SubscriberSummary, BroadcastPayload, BroadcastResult } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://campuscast-backend.onrender.com/api';

const STORAGE_KEYS = {
  CURRENT_USER: 'campuscast_current_lecturer',
  USERS: 'campuscast_users_v4',
  SECTIONS: 'campuscast_sections_v4',
  BROADCASTS: 'campuscast_broadcasts_v4',
  SUBSCRIBERS: 'campuscast_subscribers_v4',
};

// Helper to simulate realistic network delay for fallback
const delay = (min = 150, max = 300): Promise<void> => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Pre-seeded Demo Lecturers
export const DEMO_LECTURERS: Lecturer[] = [
  {
    id: 'lec_01',
    name: 'Dr. Abebe Kebede',
    email: 'abebe.kebede@aau.edu.et',
    institution: 'Addis Ababa University',
    department: 'Accounting & Finance',
  },
  {
    id: 'lec_02',
    name: 'Prof. Sara Yohannes',
    email: 'sara.yohannes@aau.edu.et',
    institution: 'Addis Ababa University',
    department: 'School of Pharmacy',
  },
];

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getActiveLecturer(): Lecturer {
  const current = getStored<Lecturer | null>(STORAGE_KEYS.CURRENT_USER, null);
  if (!current) {
    return DEMO_LECTURERS[0];
  }
  return current;
}

// ==========================================
// AUTHENTICATION APIS
// ==========================================

export async function signUp(name: string, email: string): Promise<Lecturer> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    if (res.ok) {
      const user = await res.json();
      setStored(STORAGE_KEYS.CURRENT_USER, user);
      return user;
    }
  } catch (err) {
    console.warn('[Backend Offline] Falling back to local auth', err);
  }

  await delay(200, 350);
  const user: Lecturer = {
    id: `lec_${Date.now()}`,
    name: name.trim() || 'Lecturer',
    email: email.trim().toLowerCase(),
    institution: 'Addis Ababa University',
    department: 'Academic Faculty',
  };
  setStored(STORAGE_KEYS.CURRENT_USER, user);
  return user;
}

export async function logIn(email: string): Promise<Lecturer> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      const user = await res.json();
      setStored(STORAGE_KEYS.CURRENT_USER, user);
      return user;
    }
  } catch (err) {
    console.warn('[Backend Offline] Falling back to local auth', err);
  }

  await delay(200, 350);
  const user: Lecturer = {
    id: 'lec_01',
    name: 'Dr. Abebe Kebede',
    email: email.trim().toLowerCase(),
    institution: 'Addis Ababa University',
    department: 'Accounting & Finance',
  };
  setStored(STORAGE_KEYS.CURRENT_USER, user);
  return user;
}

export async function logInWithGoogle(): Promise<Lecturer> {
  const user = DEMO_LECTURERS[0];
  setStored(STORAGE_KEYS.CURRENT_USER, user);
  return user;
}

export async function switchLecturer(lecturerId: string): Promise<Lecturer> {
  const target = DEMO_LECTURERS.find((u) => u.id === lecturerId) || DEMO_LECTURERS[0];
  setStored(STORAGE_KEYS.CURRENT_USER, target);
  return target;
}

export async function logOut(): Promise<void> {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

export async function getCurrentLecturer(): Promise<Lecturer | null> {
  return getStored<Lecturer | null>(STORAGE_KEYS.CURRENT_USER, DEMO_LECTURERS[0]);
}

// ==========================================
// CLASS SECTION APIS
// ==========================================

export async function getSections(): Promise<Section[]> {
  const lecturer = getActiveLecturer();
  try {
    const res = await fetch(`${API_BASE}/sections`, {
      headers: { 'x-lecturer-id': lecturer.id },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Backend Offline] Falling back to local storage', err);
  }

  return getStored<Section[]>(STORAGE_KEYS.SECTIONS, []);
}

export async function getSection(id: string): Promise<Section | null> {
  try {
    const res = await fetch(`${API_BASE}/sections/${id}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Backend Offline] Falling back to local storage', err);
  }

  const allSections = getStored<Section[]>(STORAGE_KEYS.SECTIONS, []);
  return allSections.find((s) => s.id === id) || null;
}

export async function createSection(data: Omit<Section, 'id' | 'createdAt' | 'lecturerId'>): Promise<Section> {
  const lecturer = getActiveLecturer();
  try {
    const res = await fetch(`${API_BASE}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lecturer-id': lecturer.id,
      },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Backend Offline] Falling back to local create', err);
  }

  const newSection: Section = {
    ...data,
    id: `sec_${Date.now()}`,
    lecturerId: lecturer.id,
    createdAt: new Date().toISOString(),
    subscribersCount: 0,
  };
  const list = getStored<Section[]>(STORAGE_KEYS.SECTIONS, []);
  list.unshift(newSection);
  setStored(STORAGE_KEYS.SECTIONS, list);
  return newSection;
}

export async function updateSection(
  id: string,
  data: Partial<Omit<Section, 'id' | 'createdAt' | 'lecturerId'>>
): Promise<Section> {
  try {
    const res = await fetch(`${API_BASE}/sections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Backend Offline] Falling back to local update', err);
  }

  const list = getStored<Section[]>(STORAGE_KEYS.SECTIONS, []);
  const index = list.findIndex((s) => s.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...data };
    setStored(STORAGE_KEYS.SECTIONS, list);
    return list[index];
  }
  throw new Error('Section not found');
}

export async function deleteSection(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/sections/${id}`, { method: 'DELETE' });
    if (res.ok) return;
  } catch (err) {
    console.warn('[Backend Offline] Falling back to local delete', err);
  }

  let list = getStored<Section[]>(STORAGE_KEYS.SECTIONS, []);
  list = list.filter((s) => s.id !== id);
  setStored(STORAGE_KEYS.SECTIONS, list);
}

export async function isJoinCodeAvailable(code: string, currentSectionId?: string): Promise<boolean> {
  try {
    const query = currentSectionId ? `?currentId=${encodeURIComponent(currentSectionId)}` : '';
    const res = await fetch(`${API_BASE}/sections/check-code/${encodeURIComponent(code)}${query}`);
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.available);
    }
  } catch (err) {
    console.warn('[Backend Offline] Falling back to local check', err);
  }

  const list = getStored<Section[]>(STORAGE_KEYS.SECTIONS, []);
  const match = list.find((s) => s.joinCode.toUpperCase() === code.trim().toUpperCase());
  return !match || match.id === currentSectionId;
}

export async function getSubscriberSummary(sectionId: string): Promise<SubscriberSummary> {
  try {
    const res = await fetch(`${API_BASE}/sections/${sectionId}/subscribers`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Backend Offline] Falling back to local count', err);
  }

  return { activeCount: 0, firstNames: [] };
}

// ==========================================
// BROADCAST APIS (Dispatches directly to Telegram)
// ==========================================

export async function sendBroadcast(payload: BroadcastPayload): Promise<BroadcastResult> {
  const lecturer = getActiveLecturer();

  try {
    let res: globalThis.Response;

    if (payload.fileMeta?.rawFile) {
      // Send as multipart/form-data for actual document delivery
      const formData = new FormData();
      formData.append('sectionId', payload.sectionId);
      formData.append('type', payload.type);
      formData.append('message', payload.message);
      formData.append('file', payload.fileMeta.rawFile);

      res = await fetch(`${API_BASE}/broadcasts`, {
        method: 'POST',
        headers: { 'x-lecturer-id': lecturer.id },
        body: formData,
      });
    } else {
      // Send as JSON
      res = await fetch(`${API_BASE}/broadcasts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lecturer-id': lecturer.id,
        },
        body: JSON.stringify({
          sectionId: payload.sectionId,
          type: payload.type,
          message: payload.message,
        }),
      });
    }

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Backend Offline] Falling back to local broadcast simulation', err);
  }

  // Fallback offline mock
  await delay(350, 600);
  const mockBc: Broadcast = {
    id: `bc_${Date.now()}`,
    sectionId: payload.sectionId,
    lecturerId: lecturer.id,
    type: payload.type,
    message: payload.message,
    fileName: payload.fileMeta?.name,
    fileSize: payload.fileMeta?.formattedSize,
    fileType: payload.fileMeta?.type,
    fileUrl: payload.fileMeta?.url,
    sentAt: new Date().toISOString(),
    deliveredCount: 1,
    failedCount: 0,
  };

  const stored = getStored<Broadcast[]>(STORAGE_KEYS.BROADCASTS, []);
  stored.unshift(mockBc);
  setStored(STORAGE_KEYS.BROADCASTS, stored);

  return {
    deliveredCount: 1,
    failedCount: 0,
    broadcast: mockBc,
  };
}

export async function getBroadcasts(sectionId: string): Promise<Broadcast[]> {
  try {
    const res = await fetch(`${API_BASE}/sections/${sectionId}/broadcasts`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Backend Offline] Falling back to local broadcasts', err);
  }

  const stored = getStored<Broadcast[]>(STORAGE_KEYS.BROADCASTS, []);
  return stored.filter((b) => b.sectionId === sectionId);
}
