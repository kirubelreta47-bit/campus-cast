import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Section, Broadcast, BroadcastType, FileMetadata, BroadcastResult } from '../types';
import * as api from '../services/api';
import { useToast } from '../context/ToastContext';
import { STRINGS } from '../strings';
import { QuickActionGrid } from '../components/QuickActionGrid';
import { TelegramPreview } from '../components/TelegramPreview';
import { ShowOnScreenModal } from '../components/ShowOnScreenModal';
import { BroadcastConfirmSheet } from '../components/BroadcastConfirmSheet';
import { 
  ArrowLeft, 
  Settings, 
  Copy, 
  Check, 
  Monitor, 
  Users, 
  Send, 
  Clock, 
  History, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image as ImageIcon, 
  File, 
  Download, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RotateCcw,
  Calendar
} from 'lucide-react';

export const ClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [section, setSection] = useState<Section | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'broadcast' | 'history'>('broadcast');

  // Broadcast composer state
  const [selectedType, setSelectedType] = useState<BroadcastType>('canceled');
  const [lateMinutes, setLateMinutes] = useState(15);
  const [isCustomLate, setIsCustomLate] = useState(false);
  const [newRoom, setNewRoom] = useState('');
  const [fileMeta, setFileMeta] = useState<FileMetadata | null>(null);
  const [note, setNote] = useState('');

  // Modals & Sheets
  const [showProjectorModal, setShowProjectorModal] = useState(false);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState(false);

  // History filter
  const [historyFilter, setHistoryFilter] = useState<'all' | 'files'>('all');

  const loadClassData = useCallback(async () => {
    if (!id) return;
    try {
      const [secData, bcData, subData] = await Promise.all([
        api.getSection(id),
        api.getBroadcasts(id),
        api.getSubscriberSummary(id),
      ]);

      if (!secData) {
        showToast('Class not found or unauthorized', 'error');
        navigate('/');
        return;
      }

      setSection(secData);
      setBroadcasts(bcData);
      setSubscriberCount(subData.activeCount);
    } catch {
      showToast('Error loading class information', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    loadClassData();
  }, [loadClassData]);

  const handleCopyCode = () => {
    if (!section) return;
    navigator.clipboard.writeText(section.joinCode);
    setCopiedCode(true);
    showToast(STRINGS.section.copiedJoinCode, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const generateBroadcastMessage = () => {
    if (!section) return '';
    const yearTag = section.entryYear ? ` (${section.entryYear})` : '';
    const subjectPrefix = `📚 ${section.subjectName}${yearTag} - ${section.sectionName}\n\n`;

    switch (selectedType) {
      case 'canceled':
        return `${subjectPrefix}❌ CLASS CANCELED\n\n${note.trim() || STRINGS.broadcast.canceledDefaultNote}`;
      case 'late':
        return `${subjectPrefix}⏰ RUNNING LATE: Class will start about ${lateMinutes} minutes later.\n\n${note.trim() || STRINGS.broadcast.lateDefaultNote}`;
      case 'room_change':
        return `${subjectPrefix}📍 ROOM CHANGE: New room is ${newRoom.trim() || '[Room Unspecified]'}.\n\n${note.trim() || STRINGS.broadcast.roomDefaultNote}`;
      case 'file':
        return `${subjectPrefix}📎 NEW FILE: ${fileMeta?.name || 'Attachment'}\n\n${note.trim() || 'Please find the attached lecture material.'}`;
      case 'custom':
      default:
        return `${subjectPrefix}📢 ANNOUNCEMENT\n\n${note.trim()}`;
    }
  };

  const isBroadcastValid = () => {
    if (selectedType === 'room_change' && !newRoom.trim()) return false;
    if (selectedType === 'file' && !fileMeta) return false;
    if (selectedType === 'custom' && !note.trim()) return false;
    return true;
  };

  const handleOpenConfirm = () => {
    if (!isBroadcastValid()) {
      if (selectedType === 'room_change') showToast('Please specify the new room number', 'error');
      else if (selectedType === 'file') showToast('Please upload a file to broadcast', 'error');
      else if (selectedType === 'custom') showToast('Please enter an announcement message', 'error');
      return;
    }
    setBroadcastResult(null);
    setShowConfirmSheet(true);
  };

  const handleSendBroadcast = async () => {
    if (!id || !section) return;
    setIsSending(true);

    try {
      const payloadMessage = generateBroadcastMessage();
      const res = await api.sendBroadcast({
        sectionId: id,
        type: selectedType,
        message: payloadMessage,
        fileMeta: fileMeta || undefined,
        extraMeta: {
          lateMinutes,
          newRoom,
          note,
        },
      });

      setBroadcastResult(res);
      showToast(STRINGS.toast.broadcastSent, 'success');

      // Refresh broadcasts history
      const updatedBc = await api.getBroadcasts(id);
      setBroadcasts(updatedBc);
    } catch {
      showToast('Failed to dispatch broadcast', 'error');
      setShowConfirmSheet(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetForm = () => {
    setShowConfirmSheet(false);
    setBroadcastResult(null);
    setNote('');
    setNewRoom('');
    setFileMeta(null);
    setSelectedType('canceled');
  };

  const handleReuseBroadcast = (bc: Broadcast) => {
    setSelectedType(bc.type);
    if (bc.type === 'room_change') {
      const match = bc.message.match(/New room is ([^.\n]+)/i);
      if (match) setNewRoom(match[1]);
    }
    const noteMatch = bc.message.split('\n\n');
    if (noteMatch.length > 2) {
      setNote(noteMatch.slice(2).join('\n\n'));
    }
    setActiveTab('broadcast');
    showToast('Loaded into composer', 'info');
  };

  const formatBroadcastDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isYesterday =
        new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

      const timeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Addis_Ababa',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);

      if (isToday) return `Today, ${timeStr}`;
      if (isYesterday) return `Yesterday, ${timeStr}`;

      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Addis_Ababa',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <File className="w-5 h-5 text-sky-600" />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-rose-500" />;
    if (ext === 'ppt' || ext === 'pptx') return <Presentation className="w-5 h-5 text-amber-500" />;
    if (ext === 'doc' || ext === 'docx') return <FileText className="w-5 h-5 text-blue-600" />;
    if (ext === 'xls' || ext === 'xlsx') return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return <ImageIcon className="w-5 h-5 text-purple-600" />;
    return <File className="w-5 h-5 text-sky-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F9FD] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  if (!section) return null;

  const filteredBroadcasts = broadcasts.filter((b) => {
    if (historyFilter === 'files') return b.type === 'file';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4F9FD] text-slate-900 pb-28 sm:pb-20">
      {/* Top App Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-sky-100 px-4 py-3.5 shadow-2xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{STRINGS.section.backToClasses}</span>
            <span className="sm:hidden">Classes</span>
          </Link>

          <div className="text-center truncate px-2">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate max-w-[200px] sm:max-w-[320px]">
              {section.subjectName}
            </h1>
            <p className="text-[11px] text-sky-600 font-bold truncate">
              {section.entryYear ? `${section.entryYear} · ` : ''}{section.sectionName}
            </p>
          </div>

          <Link
            to={`/class/${id}/edit`}
            className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-slate-600 hover:text-slate-900 hover:bg-sky-100 transition-colors cursor-pointer"
            title={STRINGS.section.editClass}
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Hero Section Banner */}
      <div className="bg-white border-b border-sky-100 px-4 py-5 shadow-2xs">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100">
                  Telegram Channel
                </span>
                
                {section.entryYear && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-sky-600" />
                    <span>{section.entryYear}</span>
                  </span>
                )}

                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500 font-semibold">@CampusCastBot</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {section.subjectName}
              </h2>
              <p className="text-sm font-bold text-slate-600 mt-0.5">
                {section.entryYear ? `${section.entryYear} — ` : ''}{section.sectionName}
              </p>
            </div>

            {/* Subscriber Count Badge */}
            <div className="flex items-center gap-2 self-start sm:self-center px-3.5 py-2 rounded-2xl bg-sky-50/80 border border-sky-100 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs">
                <span className="font-extrabold text-slate-900 font-mono tabular-nums text-sm mr-1">
                  {subscriberCount}
                </span>
                <span className="text-slate-600 font-semibold">{STRINGS.section.activeSubscribers}</span>
              </div>
            </div>
          </div>

          {/* Join Code Display with Copy and Show on Screen */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* Monospace Code Pill */}
            <div className="flex items-center gap-2 p-1.5 pl-3.5 rounded-2xl bg-sky-50 border border-sky-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Code:
              </span>
              <span className="font-mono font-extrabold text-slate-900 text-sm sm:text-base tracking-wider">
                {section.joinCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  copiedCode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white hover:bg-sky-100 border border-sky-200 text-sky-800'
                }`}
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{STRINGS.section.copiedJoinCode}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{STRINGS.section.copyJoinCode}</span>
                  </>
                )}
              </button>
            </div>

            {/* Show on screen button */}
            <button
              type="button"
              onClick={() => setShowProjectorModal(true)}
              className="min-h-[42px] px-4 py-2 rounded-2xl bg-white hover:bg-sky-50 border border-sky-200 text-sky-800 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <Monitor className="w-4 h-4 text-sky-600" />
              <span>{STRINGS.section.showOnScreen}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Core Tabs: Broadcast & History */}
      <div className="sticky top-14 z-10 bg-white/95 backdrop-blur-md border-b border-sky-100 px-4 shadow-2xs">
        <div className="max-w-3xl mx-auto flex items-center gap-3 py-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{STRINGS.section.tabs.broadcast}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{STRINGS.section.tabs.history}</span>
            {broadcasts.length > 0 && (
              <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                activeTab === 'history' ? 'bg-white text-sky-600' : 'bg-slate-100 text-slate-600'
              }`}>
                {broadcasts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content Area */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        {/* ========================================================= */}
        {/* TAB 1: BROADCAST COMPOSER */}
        {/* ========================================================= */}
        {activeTab === 'broadcast' && (
          <div className="space-y-6">
            {/* Quick Action Grid */}
            <QuickActionGrid
              selectedType={selectedType}
              onSelectType={setSelectedType}
              lateMinutes={lateMinutes}
              onLateMinutesChange={setLateMinutes}
              isCustomLate={isCustomLate}
              onIsCustomLateChange={setIsCustomLate}
              newRoom={newRoom}
              onNewRoomChange={setNewRoom}
              fileMeta={fileMeta}
              onFileSelect={setFileMeta}
              note={note}
              onNoteChange={setNote}
            />

            {/* Live Telegram Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                {STRINGS.broadcast.previewTitle}
              </label>
              <TelegramPreview
                subjectName={section.subjectName}
                sectionName={section.sectionName}
                entryYear={section.entryYear}
                type={selectedType}
                message={note}
                fileMeta={fileMeta || undefined}
                lateMinutes={lateMinutes}
                newRoom={newRoom}
                note={note}
              />
            </div>

            {/* Bottom Anchored Broadcast Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenConfirm}
                disabled={!isBroadcastValid()}
                className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-sky-500/25 active:scale-[0.99] transition-all cursor-pointer"
              >
                <Send className="w-5 h-5 -rotate-12" />
                <span>{STRINGS.broadcast.broadcastBtnWithCount(subscriberCount)}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: BROADCAST HISTORY */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Filter Pill Tabs */}
            <div className="flex items-center justify-between gap-3 pb-1">
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-sky-100 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    historyFilter === 'all'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {STRINGS.history.filterAll} ({broadcasts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('files')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    historyFilter === 'files'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {STRINGS.history.filterFiles} ({broadcasts.filter((b) => b.type === 'file').length})
                </button>
              </div>

              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Timezone: Africa/Addis_Ababa
              </span>
            </div>

            {/* Empty History State */}
            {filteredBroadcasts.length === 0 && (
              <div className="py-16 text-center bg-white border border-sky-100 rounded-3xl p-8 space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mx-auto">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{STRINGS.history.emptyTitle}</h3>
                  <p className="text-xs text-slate-500 mt-1">{STRINGS.history.emptyDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('broadcast')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{STRINGS.history.sendFirstBtn}</span>
                </button>
              </div>
            )}

            {/* History Cards List */}
            {filteredBroadcasts.length > 0 && (
              <div className="space-y-3">
                {filteredBroadcasts.map((bc) => (
                  <div
                    key={bc.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-3 relative group hover:border-sky-300 transition-colors"
                  >
                    {/* Header: Type Badge & Timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {bc.type === 'canceled' && (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Canceled</span>
                          </span>
                        )}
                        {bc.type === 'late' && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Running Late</span>
                          </span>
                        )}
                        {bc.type === 'room_change' && (
                          <span className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold flex items-center gap-1.5">
                            <span>📍 Room Change</span>
                          </span>
                        )}
                        {bc.type === 'file' && (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5">
                            <span>📎 File Drop</span>
                          </span>
                        )}
                        {bc.type === 'custom' && (
                          <span className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
                            Announcement
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-500 font-medium font-mono">
                        {formatBroadcastDate(bc.sentAt)}
                      </span>
                    </div>

                    {/* Message Body */}
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {bc.message}
                    </p>

                    {/* Attached File Card if any */}
                    {bc.fileName && (
                      <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-white border border-sky-100 shrink-0 shadow-2xs">
                            {getFileIcon(bc.fileName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{bc.fileName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{bc.fileSize || 'Document'}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => showToast(`Mock download started for ${bc.fileName}`, 'info')}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-sky-100 border border-sky-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-sky-600" />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                      </div>
                    )}

                    {/* Stats & Reuse Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-mono tabular-nums font-bold">{bc.deliveredCount}</span>
                          <span className="text-slate-500">delivered</span>
                        </span>

                        {bc.failedCount > 0 && (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-mono tabular-nums font-bold">{bc.failedCount}</span>
                            <span className="text-slate-500">failed</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReuseBroadcast(bc)}
                        className="text-slate-500 hover:text-sky-600 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{STRINGS.history.resend}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Projector Fullscreen Overlay Modal */}
      <ShowOnScreenModal
        isOpen={showProjectorModal}
        onClose={() => setShowProjectorModal(false)}
        joinCode={section.joinCode}
        subjectName={section.entryYear ? `${section.subjectName} (${section.entryYear})` : section.subjectName}
        sectionName={section.sectionName}
      />

      {/* Broadcast Confirmation & Result Sheet */}
      <BroadcastConfirmSheet
        isOpen={showConfirmSheet}
        isSending={isSending}
        result={broadcastResult}
        subscriberCount={subscriberCount}
        subjectName={section.entryYear ? `${section.subjectName} - ${section.entryYear}` : section.subjectName}
        sectionName={section.sectionName}
        onConfirm={handleSendBroadcast}
        onCancel={() => setShowConfirmSheet(false)}
        onSendAnother={handleResetForm}
        onViewHistory={() => {
          setShowConfirmSheet(false);
          setBroadcastResult(null);
          setActiveTab('history');
        }}
      />
    </div>
  );
};
