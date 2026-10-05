import React, { useEffect, useState } from 'react';
import { STRINGS } from '../strings';
import { Copy, Check, X, Monitor, Send } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ShowOnScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  joinCode: string;
  subjectName: string;
  sectionName: string;
}

export const ShowOnScreenModal: React.FC<ShowOnScreenModalProps> = ({
  isOpen,
  onClose,
  joinCode,
  subjectName,
  sectionName,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const joinCommand = `/join ${joinCode}`;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(joinCode);
    setCopiedCode(true);
    showToast(STRINGS.projector.copiedCode, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCommand = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(joinCommand);
    setCopiedCommand(true);
    showToast('Command copied: ' + joinCommand, 'success');
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const directLink = `https://t.me/${STRINGS.app.botHandle.replace('@', '')}?start=${joinCode.replace(/[^a-zA-Z0-9_]/g, '_')}`;

  const handleCopyDirectLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(directLink);
    showToast(STRINGS.projector.copiedLink || 'Direct Telegram link copied!', 'success');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-8 cursor-pointer overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Top Banner */}
      <div className="w-full max-w-3xl flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3 bg-white/95 px-4 py-2.5 rounded-2xl shadow-md border border-sky-100">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {subjectName}
            </h2>
            <p className="text-xs font-semibold text-sky-600">{sectionName}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-sm font-bold shadow-md"
          aria-label="Close projector mode"
        >
          <X className="w-4 h-4" />
          <span>Close (ESC)</span>
        </button>
      </div>

      {/* Center Giant Hero Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl my-auto py-8 px-6 sm:px-10 bg-white border border-sky-100 rounded-3xl shadow-2xl shadow-sky-900/20 text-center cursor-default pointer-events-auto relative overflow-hidden"
      >
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-widest font-extrabold text-sky-600 mb-2 block">
            Telegram Join Code
          </span>

          {/* Huge Join Code */}
          <div className="my-4 sm:my-6 p-4 sm:p-6 bg-sky-50/80 rounded-2xl border-2 border-sky-300 shadow-inner flex items-center justify-center gap-3 group">
            <span className="font-mono text-3xl sm:text-5xl md:text-6xl font-black tracking-wider text-slate-900 select-all">
              {joinCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-3 rounded-xl bg-white hover:bg-sky-100 border border-sky-200 text-sky-700 transition-colors ml-2 cursor-pointer shadow-xs"
              title="Copy Code"
            >
              {copiedCode ? <Check className="w-6 h-6 text-emerald-600" /> : <Copy className="w-6 h-6" />}
            </button>
          </div>

          {/* 1-Tap Join Link */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <a
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
              <span>1-Tap Join on Telegram</span>
            </a>
            <button
              onClick={handleCopyDirectLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Direct Link</span>
            </button>
          </div>

          {/* Step by step Instructions */}
          <div className="mt-4 text-left max-w-md mx-auto space-y-3">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p className="text-sm text-slate-800">
                Open Telegram and message <strong className="text-sky-700 font-bold">{STRINGS.app.botHandle}</strong> (or click the button above)
              </p>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div className="text-sm text-slate-800 flex-1">
                <span>Send command: </span>
                <button
                  onClick={handleCopyCommand}
                  className="inline-flex items-center gap-1.5 font-mono font-bold bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg hover:bg-sky-200 transition-colors text-xs ml-1 border border-sky-300"
                >
                  <span>{joinCommand}</span>
                  {copiedCommand ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <p className="text-sm text-slate-800">
                You will receive all announcements and slides instantly!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="text-center text-white/90 text-xs sm:text-sm pointer-events-auto py-2 font-medium">
        <p>{STRINGS.projector.tapToDismiss}</p>
      </div>
    </div>
  );
};
