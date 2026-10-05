import React from 'react';
import { BroadcastType, FileMetadata } from '../types';
import { STRINGS } from '../strings';
import { FileDropzone } from './FileDropzone';
import { XCircle, Clock, MapPin, Paperclip, MessageSquare } from 'lucide-react';

interface QuickActionGridProps {
  selectedType: BroadcastType;
  onSelectType: (type: BroadcastType) => void;
  lateMinutes: number;
  onLateMinutesChange: (mins: number) => void;
  isCustomLate: boolean;
  onIsCustomLateChange: (isCustom: boolean) => void;
  newRoom: string;
  onNewRoomChange: (room: string) => void;
  fileMeta: FileMetadata | null;
  onFileSelect: (file: FileMetadata | null) => void;
  note: string;
  onNoteChange: (note: string) => void;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  selectedType,
  onSelectType,
  lateMinutes,
  onLateMinutesChange,
  isCustomLate,
  onIsCustomLateChange,
  newRoom,
  onNewRoomChange,
  fileMeta,
  onFileSelect,
  note,
  onNoteChange,
}) => {
  const actions: {
    type: BroadcastType;
    label: string;
    sub: string;
    icon: React.ReactNode;
    colorScheme: {
      activeBorder: string;
      activeBg: string;
      iconBg: string;
      iconColor: string;
      indicator: string;
    };
  }[] = [
    {
      type: 'canceled',
      label: STRINGS.broadcast.quickActions.canceled,
      sub: STRINGS.broadcast.quickActions.canceledSub,
      icon: <XCircle className="w-6 h-6" />,
      colorScheme: {
        activeBorder: 'border-rose-400 ring-2 ring-rose-300',
        activeBg: 'bg-rose-50/70',
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
        indicator: 'bg-rose-500',
      },
    },
    {
      type: 'late',
      label: STRINGS.broadcast.quickActions.late,
      sub: STRINGS.broadcast.quickActions.lateSub,
      icon: <Clock className="w-6 h-6" />,
      colorScheme: {
        activeBorder: 'border-amber-400 ring-2 ring-amber-300',
        activeBg: 'bg-amber-50/70',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        indicator: 'bg-amber-500',
      },
    },
    {
      type: 'room_change',
      label: STRINGS.broadcast.quickActions.roomChange,
      sub: STRINGS.broadcast.quickActions.roomChangeSub,
      icon: <MapPin className="w-6 h-6" />,
      colorScheme: {
        activeBorder: 'border-sky-500 ring-2 ring-sky-300',
        activeBg: 'bg-sky-50/70',
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-700',
        indicator: 'bg-sky-500',
      },
    },
    {
      type: 'file',
      label: STRINGS.broadcast.quickActions.fileDrop,
      sub: STRINGS.broadcast.quickActions.fileDropSub,
      icon: <Paperclip className="w-6 h-6" />,
      colorScheme: {
        activeBorder: 'border-blue-500 ring-2 ring-blue-300',
        activeBg: 'bg-blue-50/70',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-700',
        indicator: 'bg-blue-600',
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* 2x2 Quick Action Grid */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          {STRINGS.broadcast.quickActionsTitle}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((act) => {
            const isSelected = selectedType === act.type;
            return (
              <button
                key={act.type}
                type="button"
                onClick={() => onSelectType(act.type)}
                className={`min-h-[100px] p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative cursor-pointer group shadow-2xs ${
                  isSelected
                    ? `${act.colorScheme.activeBg} ${act.colorScheme.activeBorder} shadow-sm`
                    : 'bg-white border-sky-100 text-slate-700 hover:border-sky-300 hover:bg-sky-50/30'
                }`}
              >
                {/* Active Indicator Pin */}
                {isSelected && (
                  <span className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${act.colorScheme.indicator}`} />
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isSelected ? act.colorScheme.iconBg : 'bg-slate-100 group-hover:bg-sky-100'
                } ${isSelected ? act.colorScheme.iconColor : 'text-slate-600'}`}>
                  {act.icon}
                </div>

                <div className="mt-2">
                  <p className="font-bold text-sm text-slate-900 tracking-tight">{act.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{act.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Sub-form based on selected action */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-sky-100 shadow-sm space-y-4">
        {selectedType === 'canceled' && (
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-rose-600 font-bold text-sm">
              <XCircle className="w-4 h-4" />
              <span>{STRINGS.broadcast.quickActions.canceled}</span>
            </div>
            <p className="text-xs text-slate-500">
              Notification will highlight class cancellation with high priority.
            </p>
          </div>
        )}

        {selectedType === 'late' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <Clock className="w-4 h-4" />
              <span>{STRINGS.broadcast.lateSelectLabel}</span>
            </div>
            {/* Chip selector for 15 / 30 / 45 / Custom */}
            <div className="flex flex-wrap gap-2">
              {[15, 30, 45].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    onIsCustomLateChange(false);
                    onLateMinutesChange(mins);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    !isCustomLate && lateMinutes === mins
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {mins} min
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  onIsCustomLateChange(true);
                  if (lateMinutes === 15 || lateMinutes === 30 || lateMinutes === 45) {
                    onLateMinutesChange(20);
                  }
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  isCustomLate
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Custom
              </button>
            </div>

            {isCustomLate && (
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={lateMinutes || ''}
                  onChange={(e) => onLateMinutesChange(Math.max(1, parseInt(e.target.value) || 0))}
                  placeholder="Minutes"
                  className="w-32 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-600 font-medium">minutes late</span>
              </div>
            )}
          </div>
        )}

        {selectedType === 'room_change' && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sky-800 font-bold text-sm">
              <MapPin className="w-4 h-4" />
              <span>{STRINGS.broadcast.roomInputLabel}</span>
            </label>
            <input
              type="text"
              value={newRoom}
              onChange={(e) => onNewRoomChange(e.target.value)}
              placeholder={STRINGS.broadcast.roomInputPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>
        )}

        {selectedType === 'file' && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sky-800 font-bold text-sm mb-1">
              <Paperclip className="w-4 h-4" />
              <span>{STRINGS.broadcast.fileUploadTitle}</span>
            </label>
            <FileDropzone file={fileMeta} onFileSelect={onFileSelect} />
          </div>
        )}

        {/* Optional Note Textarea for every preset */}
        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
              <span>{STRINGS.broadcast.generalNoteLabel}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">{note.length} / 500</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value.slice(0, 500))}
            rows={3}
            placeholder={
              selectedType === 'canceled'
                ? STRINGS.broadcast.canceledDefaultNote
                : selectedType === 'late'
                ? STRINGS.broadcast.lateDefaultNote
                : selectedType === 'room_change'
                ? STRINGS.broadcast.roomDefaultNote
                : STRINGS.broadcast.generalNotePlaceholder
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
          />
        </div>
      </div>
    </div>
  );
};
