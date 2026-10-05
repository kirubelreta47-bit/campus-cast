export interface Lecturer {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  institution?: string;
  department?: string;
}

export interface Section {
  id: string;
  lecturerId: string;
  subjectName: string; // Department / Program Name (e.g. Accounting & Finance, Pharmacy)
  sectionName: string; // Section (e.g. Section A, Section B)
  entryYear?: string;  // Entry Batch / Year (e.g. "2015 Entry", "2018 Entry", "2020 Entry")
  joinCode: string;
  active: boolean;
  createdAt: string;
  subscribersCount?: number;
}

export type BroadcastType = 'canceled' | 'late' | 'room_change' | 'file' | 'custom';

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  url?: string;
  formattedSize?: string;
  rawFile?: File;
}

export interface Broadcast {
  id: string;
  sectionId: string;
  lecturerId: string;
  type: BroadcastType;
  message: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  fileUrl?: string;
  sentAt: string;
  deliveredCount: number;
  failedCount: number;
}

export interface SubscriberSummary {
  activeCount: number;
  firstNames: string[];
}

export interface BroadcastPayload {
  sectionId: string;
  type: BroadcastType;
  message: string;
  fileMeta?: FileMetadata;
  extraMeta?: {
    lateMinutes?: number;
    newRoom?: string;
    note?: string;
  };
}

export interface BroadcastResult {
  deliveredCount: number;
  failedCount: number;
  broadcast: Broadcast;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
