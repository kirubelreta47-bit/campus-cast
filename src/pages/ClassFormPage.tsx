import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import * as api from '../services/api';
import { useToast } from '../context/ToastContext';
import { STRINGS } from '../strings';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Check, 
  X, 
  Loader2, 
  AlertTriangle, 
  Sparkles, 
  BookOpen, 
  Hash,
  ChevronDown,
  Building2,
  Layers,
  Calendar
} from 'lucide-react';

interface DepartmentItem {
  id: string;
  name: string;
  codePrefix: string;
}

const DEPARTMENTS: DepartmentItem[] = [
  { id: 'acc', name: 'Accounting & Finance', codePrefix: 'ACC' },
  { id: 'pharm', name: 'Pharmacy', codePrefix: 'PHARM' },
  { id: 'mkt', name: 'Marketing', codePrefix: 'MKT' },
  { id: 'cs', name: 'Computer Science & IT', codePrefix: 'CS' },
  { id: 'econ', name: 'Economics', codePrefix: 'ECON' },
  { id: 'mgmt', name: 'Management', codePrefix: 'MGMT' },
  { id: 'med', name: 'Medicine & Health Sciences', codePrefix: 'MED' },
  { id: 'eng', name: 'Engineering & Technology', codePrefix: 'ENG' },
  { id: 'law', name: 'Law', codePrefix: 'LAW' },
];

const ENTRY_YEARS = [
  { id: '2020', name: '2020 Entry', code: '2020' },
  { id: '2019', name: '2019 Entry', code: '2019' },
  { id: '2018', name: '2018 Entry', code: '2018' },
  { id: '2017', name: '2017 Entry', code: '2017' },
  { id: '2016', name: '2016 Entry', code: '2016' },
  { id: '2015', name: '2015 Entry', code: '2015' },
  { id: '2021', name: '2021 Entry', code: '2021' },
  { id: '2022', name: '2022 Entry', code: '2022' },
  { id: '2023', name: '2023 Entry', code: '2023' },
  { id: '2024', name: '2024 Entry', code: '2024' },
  { id: '2025', name: '2025 Entry', code: '2025' },
  { id: '2026', name: '2026 Entry', code: '2026' },
];

// Sections from Section A up to Section H
const SECTIONS_A_TO_H = [
  { id: 'sec_a', name: 'Section A', codeSuffix: 'SEC-A' },
  { id: 'sec_b', name: 'Section B', codeSuffix: 'SEC-B' },
  { id: 'sec_c', name: 'Section C', codeSuffix: 'SEC-C' },
  { id: 'sec_d', name: 'Section D', codeSuffix: 'SEC-D' },
  { id: 'sec_e', name: 'Section E', codeSuffix: 'SEC-E' },
  { id: 'sec_f', name: 'Section F', codeSuffix: 'SEC-F' },
  { id: 'sec_g', name: 'Section G', codeSuffix: 'SEC-G' },
  { id: 'sec_h', name: 'Section H', codeSuffix: 'SEC-H' },
];

export const ClassFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [selectedDeptId, setSelectedDeptId] = useState<string>(DEPARTMENTS[0].id);
  const [customDepartmentName, setCustomDepartmentName] = useState('');
  
  // Entry Year / Batch selection
  const [selectedEntryYear, setSelectedEntryYear] = useState<string>(ENTRY_YEARS[2].id); // 2018 default
  const [customEntryYear, setCustomEntryYear] = useState('');

  // Section dropdown selection (Section A to H)
  const [selectedSectionId, setSelectedSectionId] = useState<string>(SECTIONS_A_TO_H[0].id);

  const [joinCode, setJoinCode] = useState('');
  const [active, setActive] = useState(true);
  const [isCodeCustomized, setIsCodeCustomized] = useState(false);

  // Live availability states
  const [checkingCode, setCheckingCode] = useState(false);
  const [isCodeAvailable, setIsCodeAvailable] = useState<boolean | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Resolve effective department name
  const effectiveDepartmentName =
    selectedDeptId === '__custom__'
      ? customDepartmentName
      : DEPARTMENTS.find((d) => d.id === selectedDeptId)?.name || customDepartmentName;

  // Resolve effective entry year
  const effectiveEntryYear =
    selectedEntryYear === '__custom__'
      ? customEntryYear
      : ENTRY_YEARS.find((y) => y.id === selectedEntryYear)?.name || customEntryYear || '2018 Entry';

  // Resolve effective section name (Section A - H)
  const effectiveSectionName =
    SECTIONS_A_TO_H.find((s) => s.id === selectedSectionId)?.name || 'Section A';

  // Load section for edit mode
  useEffect(() => {
    if (!id) return;

    async function loadSection() {
      try {
        const section = await api.getSection(id!);
        if (!section) {
          showToast('Section not found or unauthorized', 'error');
          navigate('/');
          return;
        }

        // Match department
        const matchedDept = DEPARTMENTS.find(
          (d) => d.name.toLowerCase() === section.subjectName.toLowerCase()
        );
        if (matchedDept) {
          setSelectedDeptId(matchedDept.id);
        } else {
          setSelectedDeptId('__custom__');
          setCustomDepartmentName(section.subjectName);
        }

        // Match entry year
        if (section.entryYear) {
          const matchedYear = ENTRY_YEARS.find(
            (y) => y.name.toLowerCase() === section.entryYear?.toLowerCase() || y.id === section.entryYear
          );
          if (matchedYear) {
            setSelectedEntryYear(matchedYear.id);
          } else {
            setSelectedEntryYear('__custom__');
            setCustomEntryYear(section.entryYear);
          }
        }

        // Match section (A to H)
        const matchedSec = SECTIONS_A_TO_H.find(
          (s) =>
            s.name.toLowerCase() === section.sectionName.toLowerCase() ||
            section.sectionName.toLowerCase().includes(s.name.toLowerCase())
        );
        setSelectedSectionId(matchedSec?.id || SECTIONS_A_TO_H[0].id);

        setJoinCode(section.joinCode);
        setActive(section.active);
        setIsCodeCustomized(true);
        setIsCodeAvailable(true);
      } catch {
        showToast('Error loading section details', 'error');
        navigate('/');
      } finally {
        setLoadingInitial(false);
      }
    }
    loadSection();
  }, [id, navigate, showToast]);

  // Generate Telegram join code like PHARM-2015-SEC-A or ACC-2020-SEC-B
  const generateSuggestedCode = () => {
    let deptPrefix = '';
    if (selectedDeptId === '__custom__') {
      deptPrefix = customDepartmentName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    } else {
      const dept = DEPARTMENTS.find((d) => d.id === selectedDeptId);
      deptPrefix = dept?.codePrefix || 'DEPT';
    }

    let yearPrefix = '';
    if (selectedEntryYear === '__custom__') {
      yearPrefix = customEntryYear.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
    } else {
      const yr = ENTRY_YEARS.find((y) => y.id === selectedEntryYear);
      yearPrefix = yr?.code || '';
    }

    const sec = SECTIONS_A_TO_H.find((s) => s.id === selectedSectionId);
    const suffix = sec?.codeSuffix || 'SEC-A';

    const parts = [deptPrefix, yearPrefix, suffix].filter(Boolean);
    return parts.join('-');
  };

  // Live auto-generate join code
  useEffect(() => {
    if (!isEditMode && !isCodeCustomized) {
      const generated = generateSuggestedCode();
      if (generated) {
        setJoinCode(generated);
      }
    }
  }, [selectedDeptId, selectedEntryYear, selectedSectionId, customDepartmentName, customEntryYear, isCodeCustomized, isEditMode]);

  // Debounced live join code availability check
  useEffect(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);

    const cleanCode = joinCode.trim().toUpperCase();
    if (cleanCode.length < 3) {
      setIsCodeAvailable(null);
      setCheckingCode(false);
      return;
    }

    setCheckingCode(true);
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const available = await api.isJoinCodeAvailable(cleanCode, id);
        setIsCodeAvailable(available);
      } catch {
        setIsCodeAvailable(null);
      } finally {
        setCheckingCode(false);
      }
    }, 350);

    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, [joinCode, id]);

  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCodeCustomized(true);
    const val = e.target.value.toUpperCase().replace(/\s+/g, '');
    setJoinCode(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveDepartmentName.trim() || !effectiveSectionName.trim() || !joinCode.trim()) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (isCodeAvailable === false) {
      showToast('Please choose an available join code', 'error');
      return;
    }

    setSaving(true);
    try {
      if (isEditMode && id) {
        await api.updateSection(id, {
          subjectName: effectiveDepartmentName.trim(),
          entryYear: effectiveEntryYear.trim(),
          sectionName: effectiveSectionName.trim(),
          joinCode: joinCode.trim().toUpperCase(),
          active,
        });
        showToast(STRINGS.toast.classSaved, 'success');
        navigate(`/class/${id}`);
      } else {
        const created = await api.createSection({
          subjectName: effectiveDepartmentName.trim(),
          entryYear: effectiveEntryYear.trim(),
          sectionName: effectiveSectionName.trim(),
          joinCode: joinCode.trim().toUpperCase(),
          active,
        });
        showToast(STRINGS.toast.classSaved, 'success');
        navigate(`/class/${created.id}`);
      }
    } catch {
      showToast('Failed to save class section', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await api.deleteSection(id);
      showToast(STRINGS.toast.classDeleted, 'info');
      navigate('/');
    } catch {
      showToast('Failed to delete section', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#F4F9FD] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F9FD] text-slate-900 pb-20">
      {/* Top Bar Navigation */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-sky-100 px-4 py-3.5 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to={isEditMode ? `/class/${id}` : '/'}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isEditMode ? 'Back to Class' : STRINGS.section.backToClasses}</span>
          </Link>

          <h1 className="text-base font-extrabold text-slate-900">
            {isEditMode ? STRINGS.classForm.editTitle : STRINGS.classForm.newTitle}
          </h1>

          <div className="w-10" />
        </div>
      </div>

      {/* Main Form Container */}
      <main className="max-w-2xl mx-auto px-4 pt-6">
        <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isEditMode ? `Edit ${effectiveDepartmentName || 'Class'}` : 'New Class Section'}
              </h2>
              <p className="text-xs text-slate-500">
                Group your class by Department, Entry Batch, and Section (A to H) so each cohort receives separate broadcasts.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Academic Department Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>{STRINGS.classForm.selectDepartmentLabel}</span> <span className="text-sky-600">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setIsCodeCustomized(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white cursor-pointer font-semibold"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.codePrefix})
                    </option>
                  ))}
                  <option value="__custom__">+ Custom / Other Department</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Custom Department Name Input if selected */}
              {selectedDeptId === '__custom__' && (
                <div className="mt-2.5 animate-in fade-in duration-150">
                  <input
                    type="text"
                    required
                    value={customDepartmentName}
                    onChange={(e) => setCustomDepartmentName(e.target.value)}
                    placeholder={STRINGS.classForm.customDepartmentPlaceholder}
                    className="w-full bg-white border border-sky-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}
            </div>

            {/* 2. Entry Year / Batch Selection (e.g. 2015 Entry to 2026 Entry) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>{STRINGS.classForm.selectEntryYearLabel}</span> <span className="text-sky-600">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={selectedEntryYear}
                  onChange={(e) => {
                    setSelectedEntryYear(e.target.value);
                    setIsCodeCustomized(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white cursor-pointer font-semibold"
                >
                  {ENTRY_YEARS.map((yr) => (
                    <option key={yr.id} value={yr.id}>
                      {yr.name}
                    </option>
                  ))}
                  <option value="__custom__">+ Custom Entry Year / Cohort</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Custom Entry Year Input if selected */}
              {selectedEntryYear === '__custom__' && (
                <div className="mt-2.5 animate-in fade-in duration-150">
                  <input
                    type="text"
                    required
                    value={customEntryYear}
                    onChange={(e) => setCustomEntryYear(e.target.value)}
                    placeholder={STRINGS.classForm.customEntryYearPlaceholder}
                    className="w-full bg-white border border-sky-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}
            </div>

            {/* 3. Section Dropdown Selection (Section A through Section H) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                <span>{STRINGS.classForm.selectSectionLabel}</span> <span className="text-sky-600">*</span>
              </label>
              
              <div className="relative">
                <select
                  required
                  value={selectedSectionId}
                  onChange={(e) => {
                    setSelectedSectionId(e.target.value);
                    setIsCodeCustomized(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white cursor-pointer font-semibold"
                >
                  {SECTIONS_A_TO_H.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} ({sec.codeSuffix})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 4. Telegram Join Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {STRINGS.classForm.joinCodeLabel} <span className="text-sky-600">*</span>
                </label>
                {!isCodeCustomized && (
                  <span className="text-[11px] text-sky-600 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Auto-generated: {effectiveEntryYear} · {effectiveSectionName}
                  </span>
                )}
              </div>

              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={handleJoinCodeChange}
                  placeholder="e.g. PHARM-2015-SEC-A"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-slate-900 font-mono font-bold tracking-wide uppercase text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />

                {/* Availability Indicator */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                  {checkingCode && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                  {!checkingCode && isCodeAvailable === true && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                  {!checkingCode && isCodeAvailable === false && (
                    <X className="w-4 h-4 text-rose-600" />
                  )}
                </div>
              </div>

              {/* Helper text / live feedback */}
              <div className="mt-1.5 px-1">
                {checkingCode && (
                  <p className="text-xs text-slate-500">{STRINGS.classForm.checkingAvailability}</p>
                )}
                {!checkingCode && isCodeAvailable === true && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>{STRINGS.classForm.codeAvailable}</span>
                  </p>
                )}
                {!checkingCode && isCodeAvailable === false && (
                  <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
                    <X className="w-3 h-3" />
                    <span>{STRINGS.classForm.codeTaken}</span>
                  </p>
                )}
                {!checkingCode && isCodeAvailable === null && (
                  <p className="text-xs text-slate-500">{STRINGS.classForm.joinCodeHelp}</p>
                )}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {STRINGS.classForm.activeStatusLabel}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {STRINGS.classForm.activeStatusHelp}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                  active ? 'bg-sky-500' : 'bg-slate-300'
                }`}
                aria-label="Toggle section active state"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 shadow-xs ${
                    active ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={saving || checkingCode || isCodeAvailable === false}
                className="w-full sm:flex-1 min-h-[48px] rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditMode ? STRINGS.classForm.saveChanges : STRINGS.classForm.createSection}</span>
                  </>
                )}
              </button>

              {isEditMode && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full sm:w-auto min-h-[48px] px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{STRINGS.classForm.deleteSection}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                {STRINGS.classForm.deleteConfirmTitle}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {STRINGS.classForm.deleteConfirmDesc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
              >
                {STRINGS.classForm.cancel}
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{STRINGS.classForm.confirmDelete}</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
