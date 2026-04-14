import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'fasta' || extension === 'fna') {
        onFileSelect(file);
      } else {
        setError('Invalid file type. Please upload a .fasta or .fna file.');
      }
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.fasta', '.fna'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const selectedFile = acceptedFiles[0];

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative group cursor-pointer transition-all duration-300 border-2 border-dashed rounded-2xl p-12 text-center
          ${isDragActive ? 'border-purple-500 bg-purple-50/50' : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            {isDragActive ? 'Drop your genome here' : 'Upload Genomic Data'}
          </h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Drag and drop your <span className="font-mono text-purple-600">.fasta</span> or <span className="font-mono text-purple-600">.fna</span> files here
          </p>
        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-200 group-hover:border-purple-300 rounded-tl-md transition-colors" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-200 group-hover:border-purple-300 rounded-tr-md transition-colors" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-200 group-hover:border-purple-300 rounded-bl-md transition-colors" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-200 group-hover:border-purple-300 rounded-br-md transition-colors" />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {selectedFile && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <File className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 truncate max-w-[200px] md:max-w-xs">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            {!isProcessing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelect(null as any); // Reset in parent if needed
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;
