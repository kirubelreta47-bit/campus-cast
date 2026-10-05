import React, { useEffect } from 'react';
import { BroadcastResult } from '../types';
import { STRINGS } from '../strings';
import { Send, CheckCircle2, Loader2, ArrowRight, RefreshCw, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BroadcastConfirmSheetProps {
  isOpen: boolean;
  isSending: boolean;
  result: BroadcastResult | null;
  subscriberCount: number;
  subjectName: string;
  sectionName: string;
  onConfirm: () => void;
  onCancel: () => void;
  onSendAnother: () => void;
  onViewHistory: () => void;
}

export const BroadcastConfirmSheet: React.FC<BroadcastConfirmSheetProps> = ({
  isOpen,
  isSending,
  result,
  subscriberCount,
  subjectName,
  sectionName,
  onConfirm,
  onCancel,
  onSendAnother,
  onViewHistory,
}) => {
  useEffect(() => {
    if (result && !isSending) {
      try {
        confetti({
          particleCount: 65,
          spread: 55,
          origin: { y: 0.7 },
          colors: ['#0ea5e9', '#0284c7', '#38bdf8', '#10b981'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [result, isSending]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white border border-sky-100 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 relative overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
      >
        {/* Drag handle on mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

        {/* STATE 1: Confirmation Prompt */}
        {!isSending && !result && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <Send className="w-6 h-6 -rotate-12 translate-x-0.5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {STRINGS.broadcast.confirmTitle}
                  </h3>
                  <p className="text-xs text-sky-600 font-semibold">Telegram Channel Broadcast</p>
                </div>
              </div>

              <button
                onClick={onCancel}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1.5">
              <p className="text-sm text-slate-800 leading-relaxed font-semibold">
                {STRINGS.broadcast.confirmBody(subscriberCount, subjectName, sectionName)}
              </p>
              <p className="text-xs text-slate-500">
                {STRINGS.broadcast.confirmSubtext}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all cursor-pointer"
              >
                {STRINGS.broadcast.cancelBtn}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{STRINGS.broadcast.sendNowBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: Sending in progress */}
        {isSending && (
          <div className="py-8 text-center space-y-4">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-sky-600 animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Broadcasting to Telegram</h4>
              <p className="text-xs text-slate-500 mt-1">
                Dispatching push notifications to {subscriberCount} students...
              </p>
            </div>
          </div>
        )}

        {/* STATE 3: Delivery Result */}
        {!isSending && result && (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {STRINGS.broadcast.successTitle}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {STRINGS.broadcast.successSummary(result.deliveredCount, result.failedCount)}
              </p>
            </div>

            {/* Delivery Stats Box */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 text-center">
              <div className="p-3 rounded-xl bg-white border border-sky-100 shadow-2xs">
                <span className="text-2xl font-extrabold text-sky-600 font-mono">
                  {result.deliveredCount}
                </span>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Delivered</p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-sky-100 shadow-2xs">
                <span className={`text-2xl font-extrabold font-mono ${result.failedCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {result.failedCount}
                </span>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Failed</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={onSendAnother}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{STRINGS.broadcast.sendAnotherBtn}</span>
              </button>

              <button
                type="button"
                onClick={onViewHistory}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{STRINGS.broadcast.viewInHistoryBtn}</span>
                <ArrowRight className="w-4 h-4 text-sky-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
