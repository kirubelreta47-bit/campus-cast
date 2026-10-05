import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Section } from '../types';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { STRINGS } from '../strings';
import { 
  Plus, 
  Copy, 
  Check, 
  Users, 
  Search, 
  ChevronRight, 
  Layers, 
  BookOpen,
  Calendar
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const { lecturer } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSections() {
      setLoading(true);
      try {
        const data = await api.getSections();
        setSections(data);
      } catch {
        showToast('Failed to load classes', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchSections();
  }, [lecturer?.id, showToast]);

  const handleCopyCode = (e: React.MouseEvent, section: Section) => {
    e.stopPropagation();
    navigator.clipboard.writeText(section.joinCode);
    setCopiedCodeId(section.id);
    showToast(`Join code ${section.joinCode} copied!`, 'success');
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const filteredSections = sections.filter(
    (s) =>
      s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.entryYear && s.entryYear.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.joinCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSubscribers = sections.reduce((acc, curr) => acc + (curr.subscribersCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F4F9FD] text-slate-900 pb-24 sm:pb-16">
      {/* Hero Welcome Banner */}
      <div className="bg-white border-b border-sky-100 px-4 pt-6 pb-8 shadow-2xs">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100">
                  Lecturer Portal
                </span>
                {lecturer?.department && (
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    · {lecturer.department}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {lecturer ? `Welcome, ${lecturer.name}` : 'My Classes'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {STRINGS.home.activeClassesDesc}
              </p>
            </div>

            {/* Top Stat Summary Cards */}
            <div className="flex items-center gap-2.5">
              <div className="px-4 py-2.5 rounded-2xl bg-sky-50/80 border border-sky-100 flex items-center gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-lg font-bold text-slate-900 font-mono tabular-nums leading-none">
                    {totalSubscribers}
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {STRINGS.home.totalSubscribers}
                  </p>
                </div>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-sky-50/80 border border-sky-100 flex items-center gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-lg font-bold text-slate-900 font-mono tabular-nums leading-none">
                    {sections.length}
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    My Classes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search bar & Actions Bar */}
          <div className="flex items-center gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={STRINGS.home.searchPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
              />
            </div>

            <Link
              to="/class/new"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{STRINGS.home.addClass}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-5 rounded-2xl bg-white border border-sky-100 shadow-xs animate-pulse flex flex-col sm:flex-row justify-between gap-4"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="h-5 w-48 bg-slate-200 rounded-md" />
                  <div className="h-4 w-32 bg-slate-100 rounded-md" />
                  <div className="h-8 w-40 bg-slate-100 rounded-lg mt-2" />
                </div>
                <div className="h-10 w-28 bg-slate-100 rounded-xl self-start sm:self-center" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State when this lecturer has no classes yet */}
        {!loading && sections.length === 0 && (
          <div className="my-8 p-8 sm:p-12 text-center bg-white border border-sky-100 rounded-3xl space-y-4 max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mx-auto shadow-inner">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{STRINGS.home.emptyStateTitle}</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                {STRINGS.home.emptyStateDesc}
              </p>
            </div>
            <Link
              to="/class/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{STRINGS.home.createFirstClassBtn}</span>
            </Link>
          </div>
        )}

        {/* Empty Search State */}
        {!loading && sections.length > 0 && filteredSections.length === 0 && (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Search className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-800">{STRINGS.home.noClassesFound}</p>
            <p className="text-xs text-slate-400">{STRINGS.home.noClassesMatchSearch}</p>
          </div>
        )}

        {/* List of Section Cards for this Lecturer */}
        {!loading && filteredSections.length > 0 && (
          <div className="space-y-3">
            {filteredSections.map((section) => {
              const isCopied = copiedCodeId === section.id;
              return (
                <div
                  key={section.id}
                  onClick={() => navigate(`/class/${section.id}`)}
                  className="group p-5 rounded-2xl bg-white border border-sky-100 hover:border-sky-300 hover:shadow-md transition-all duration-200 shadow-xs cursor-pointer relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Class Info */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                          {section.subjectName}
                        </h3>
                        
                        {/* Entry Year Badge */}
                        {section.entryYear && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-sky-600" />
                            <span>{section.entryYear}</span>
                          </span>
                        )}

                        <span className="text-slate-300">·</span>
                        
                        <span className="text-sm font-bold text-slate-700">
                          {section.sectionName}
                        </span>

                        {section.active ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                            {STRINGS.home.active}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                            {STRINGS.home.inactive}
                          </span>
                        )}
                      </div>

                      {/* Join Code Monospace Pill with Big Copy Button */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                        <div className="inline-flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-sky-50 border border-sky-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Code:
                          </span>
                          <span className="font-mono font-extrabold text-slate-900 text-xs sm:text-sm tracking-wide">
                            {section.joinCode}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(e, section)}
                            className={`min-h-[30px] px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white hover:bg-sky-100 border border-sky-200 text-sky-700'
                            }`}
                            aria-label={`Copy join code ${section.joinCode}`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{STRINGS.home.copied}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{STRINGS.home.copyCode}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Subscribers Count */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Users className="w-3.5 h-3.5 text-sky-600" />
                          <span className="font-mono text-slate-800 font-bold tabular-nums">
                            {section.subscribersCount || 0}
                          </span>
                          <span>{STRINGS.home.studentsCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Broadcast action CTA */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100">
                        <span>Broadcast</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Action for Mobile */}
      <div className="fixed bottom-6 right-4 sm:hidden z-30">
        <Link
          to="/class/new"
          className="flex items-center justify-center gap-2 h-14 px-6 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm shadow-xl shadow-sky-500/30 active:scale-95 transition-all"
          aria-label="Add new class section"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>Add Class</span>
        </Link>
      </div>
    </div>
  );
};
