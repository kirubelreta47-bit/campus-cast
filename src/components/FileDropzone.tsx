import React, { useRef, useState } from 'react';
import { FileMetadata } from '../types';
import { UploadCloud, FileText, Presentation, FileSpreadsheet, Image as ImageIcon, File, X, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { STRINGS } from '../strings';

interface FileDropzoneProps {
  file: FileMetadata | null;
  onFileSelect: (file: FileMetadata | null) => void;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const ALLOWED_EXTENSIONS = [
  'pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'webp', 'gif'
];

export const FileDropzone: React.FC<FileDropzoneProps> = ({ file, onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFile = (selectedFile: File) => {
    setErrorMessage(null);

    // Validate size
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(STRINGS.toast.fileTooLarge);
      showToast(STRINGS.toast.fileTooLarge, 'error');
      return;
    }

    // Validate extension
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage(STRINGS.toast.invalidFileType);
      showToast(STRINGS.toast.invalidFileType, 'error');
      return;
    }

    // Format size
    let formattedSize = '';
    if (selectedFile.size < 1024 * 1024) {
      formattedSize = `${Math.round(selectedFile.size / 1024)} KB`;
    } else {
      formattedSize = `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`;
    }

    const metadata: FileMetadata = {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      formattedSize,
      url: URL.createObjectURL(selectedFile),
      rawFile: selectedFile,
    };

    onFileSelect(metadata);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-7 h-7 text-rose-500" />;
    if (ext === 'ppt' || ext === 'pptx') return <Presentation className="w-7 h-7 text-amber-500" />;
    if (ext === 'doc' || ext === 'docx') return <FileText className="w-7 h-7 text-blue-600" />;
    if (ext === 'xls' || ext === 'xlsx') return <FileSpreadsheet className="w-7 h-7 text-emerald-600" />;
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return <ImageIcon className="w-7 h-7 text-purple-600" />;
    return <File className="w-7 h-7 text-sky-600" />;
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
        onChange={onInputChange}
      />

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            isDragging
              ? 'border-sky-500 bg-sky-100/50 scale-[0.99]'
              : 'border-sky-200 bg-sky-50/40 hover:border-sky-400 hover:bg-sky-50'
          }`}
        >
          <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600 mb-2.5">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Click to upload or drag & drop document
          </p>
          <p className="text-xs text-slate-500 mt-1">
            PDF, PowerPoint, Word, Excel, Images (Max 20 MB)
          </p>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-white border border-sky-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-sky-50 shrink-0">
              {getFileIcon(file.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{file.formattedSize}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={removeFile}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
            aria-label="Remove file"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-rose-600 font-medium px-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
