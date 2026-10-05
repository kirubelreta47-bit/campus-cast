import React from 'react';
import { BroadcastType, FileMetadata } from '../types';
import { FileText, FileSpreadsheet, Presentation, Image as ImageIcon, File, CheckCheck } from 'lucide-react';

interface TelegramPreviewProps {
  subjectName: string;
  sectionName: string;
  entryYear?: string;
  type: BroadcastType;
  message: string;
  fileMeta?: FileMetadata;
  lateMinutes?: number;
  newRoom?: string;
  note?: string;
}

export const TelegramPreview: React.FC<TelegramPreviewProps> = ({
  subjectName,
  sectionName,
  entryYear,
  type,
  message,
  fileMeta,
  lateMinutes = 15,
  newRoom = '',
  note = '',
}) => {
  const currentTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <File className="w-6 h-6 text-sky-600" />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-6 h-6 text-rose-500" />;
    if (ext === 'ppt' || ext === 'pptx') return <Presentation className="w-6 h-6 text-amber-500" />;
    if (ext === 'doc' || ext === 'docx') return <FileText className="w-6 h-6 text-blue-600" />;
    if (ext === 'xls' || ext === 'xlsx') return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return <ImageIcon className="w-6 h-6 text-purple-600" />;
    return <File className="w-6 h-6 text-sky-600" />;
  };

  const getDisplayHeader = () => {
    if (entryYear) {
      return `📚 ${subjectName} (${entryYear}) - ${sectionName}`;
    }
    return `📚 ${subjectName} - ${sectionName}`;
  };

  const getDisplayContent = () => {
    switch (type) {
      case 'canceled':
        return (
          <div className="space-y-1.5">
            <p className="font-bold text-rose-600 tracking-wide">
              ❌ CLASS CANCELED
            </p>
            {note ? (
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{note}</p>
            ) : (
              <p className="text-slate-500 italic">Today's class is canceled.</p>
            )}
          </div>
        );

      case 'late':
        return (
          <div className="space-y-1.5">
            <p className="font-bold text-amber-700 tracking-wide">
              ⏰ RUNNING LATE: Class will start about {lateMinutes} minutes later.
            </p>
            {note && (
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{note}</p>
            )}
          </div>
        );

      case 'room_change':
        return (
          <div className="space-y-1.5">
            <p className="font-bold text-sky-700 tracking-wide">
              📍 ROOM CHANGE: New room is {newRoom.trim() || '[New Room]'}.
            </p>
            {note && (
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{note}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <p className="font-bold text-sky-800 tracking-wide">
              📎 NEW FILE
            </p>
            {fileMeta ? (
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white shrink-0 shadow-2xs">
                  {getFileIcon(fileMeta.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{fileMeta.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {fileMeta.formattedSize || `${(fileMeta.size / (1024 * 1024)).toFixed(1)} MB`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                No file selected yet
              </div>
            )}
            {note && (
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm pt-1">{note}</p>
            )}
          </div>
        );

      case 'custom':
      default:
        return (
          <div className="space-y-1.5">
            <p className="font-bold text-sky-800 tracking-wide">
              📢 ANNOUNCEMENT
            </p>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {message || note || 'Enter your message to preview...'}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-sky-100 bg-white overflow-hidden shadow-sm">
      {/* Telegram Mock Header Bar */}
      <div className="bg-[#517DA2] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white text-[#517DA2] font-bold text-xs flex items-center justify-center shadow-xs">
            CC
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">CampusCast Bot</span>
              <span className="text-[10px] bg-sky-700/60 px-1.5 py-0.2 rounded font-medium">bot</span>
            </div>
            <p className="text-[10px] text-sky-100 leading-tight">Student Telegram Feed</p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-sky-900/30 px-2 py-0.5 rounded text-white/90">
          Live Preview
        </span>
      </div>

      {/* Telegram Chat Wallpaper */}
      <div className="p-4 sm:p-5 bg-[#E4ECF2] relative min-h-[160px]">
        {/* Telegram Message Bubble */}
        <div className="max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tl-xs bg-white border border-slate-200/80 p-3.5 shadow-sm relative text-sm">
          {/* Channel / Course Header */}
          <div className="pb-1.5 mb-1.5 border-b border-slate-100">
            <span className="font-bold text-xs text-sky-700 tracking-wide">
              {getDisplayHeader()}
            </span>
          </div>

          {/* Body Content */}
          <div className="text-slate-800 text-sm leading-relaxed">
            {getDisplayContent()}
          </div>

          {/* Bubble Timestamp & Double Checkmarks */}
          <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-400 select-none">
            <span>{currentTime}</span>
            <CheckCheck className="w-3.5 h-3.5 text-sky-600 inline" />
          </div>
        </div>
      </div>
    </div>
  );
};
