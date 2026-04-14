// src/components/Dashboard.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PredictionResult {
  id: string;
  antibiotic: string;
  prediction: 'Resistant' | 'Susceptible';
  confidence: number;
  mechanism?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'results' | 'history'>('upload');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => 
      f.name.endsWith('.fasta') || f.name.endsWith('.fna') || f.name.endsWith('.fa')
    );
    
    if (files.length > 0) {
      simulateUpload(files[0]);
    }
  }, []);

  const simulateUpload = (file: File) => {
    const newFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      status: 'uploading',
      progress: 0
    };
    
    setUploadedFiles([newFile]);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadedFiles(prev => prev.map(f => 
        f.id === newFile.id ? { ...f, progress } : f
      ));
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setUploadedFiles(prev => prev.map(f => 
            f.id === newFile.id ? { ...f, status: 'processing' } : f
          ));
          runAnalysis();
        }, 500);
      }
    }, 200);
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const mockResults: PredictionResult[] = [
        { id: '1', antibiotic: 'Meropenem', prediction: 'Resistant', confidence: 94.2, mechanism: 'blaKPC' },
        { id: '2', antibiotic: 'Ciprofloxacin', prediction: 'Susceptible', confidence: 87.5 },
        { id: '3', antibiotic: 'Vancomycin', prediction: 'Susceptible', confidence: 91.3 },
        { id: '4', antibiotic: 'Gentamicin', prediction: 'Resistant', confidence: 76.8, mechanism: 'aac(6)-Ib' },
        { id: '5', antibiotic: 'Colistin', prediction: 'Susceptible', confidence: 82.1 },
      ];
      setResults(mockResults);
      setIsAnalyzing(false);
      setActiveTab('results');
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'complete' })));
    }, 3000);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      simulateUpload(e.target.files[0]);
    }
  };

  const exportPDF = () => {
    alert('Generating PDF report... (Demo functionality)');
  };

  const clearResults = () => {
    setResults([]);
    setUploadedFiles([]);
    setActiveTab('upload');
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Grid (Matching Landing Page) */}
      <div className="fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundSize: '40px 40px',
          backgroundImage: `linear-gradient(to right, #64748b 1px, transparent 1px),
                           linear-gradient(to bottom, #64748b 1px, transparent 1px)`,
        }}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Zenthera <span className="text-purple-600 font-light">Lab</span></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white/80 backdrop-blur-md rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-slate-600 uppercase tracking-wider">Secure Analysis</span>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              title="Back to Landing"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-slate-200 w-fit shadow-sm">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'upload' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            New Analysis
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            disabled={results.length === 0}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'results' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Results {results.length > 0 && `(${results.length})`}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'history' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            History
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'upload' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Upload Zone */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative bg-white rounded-3xl border-2 border-dashed transition-all duration-300 ${
                      isDragging 
                        ? 'border-purple-500 bg-purple-50/50 scale-[1.02]' 
                        : 'border-slate-200 hover:border-purple-300'
                    } p-12 shadow-lg`}
                  >
                    <input 
                      type="file" 
                      accept=".fasta,.fna,.fa" 
                      onChange={handleFileInput}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    <div className="text-center">
                      <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-colors ${
                        isDragging ? 'bg-purple-100' : 'bg-slate-50'
                      }`}>
                        <svg className={`w-10 h-10 transition-colors ${isDragging ? 'text-purple-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">
                        {isDragging ? 'Drop to Upload' : 'Upload Genomic Data'}
                      </h3>
                      <p className="text-slate-500 mb-6">
                        Drag and drop your <span className="text-purple-600 font-mono">.fasta</span> or <span className="text-purple-600 font-mono">.fna</span> files here
                      </p>
                      
                      <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-purple-300 hover:text-purple-600 transition-all shadow-sm">
                        Browse Files
                      </button>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {uploadedFiles.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                        Processing Queue
                      </h4>
                      <div className="space-y-3">
                        {uploadedFiles.map((file) => (
                          <div key={file.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-slate-800 text-sm">{file.name}</span>
                                <span className="text-xs text-slate-500 font-mono">{file.size}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                                  style={{ width: `${file.progress}%` }}
                                />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {file.status === 'uploading' && `Uploading... ${file.progress}%`}
                                {file.status === 'processing' && 'Analyzing k-mer frequencies...'}
                                {file.status === 'complete' && 'Analysis complete'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Security Note */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">Security Note</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Your data is processed locally on our secure ML nodes and is never used for training without consent. Files are encrypted during transit.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'results' && results.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Results Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">Analysis Results</h3>
                      <p className="text-slate-500 text-sm mt-1">Resistance prediction based on k-mer frequency analysis</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={clearResults}
                        className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                      >
                        Clear
                      </button>
                      <button 
                        onClick={exportPDF}
                        className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export PDF
                      </button>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Antibiotic</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prediction</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Confidence</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mechanism</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {results.map((result, idx) => (
                            <motion.tr 
                              key={result.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-6 py-4 font-medium text-slate-800">{result.antibiotic}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                  result.prediction === 'Resistant' 
                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                    : 'bg-green-100 text-green-700 border border-green-200'
                                }`}>
                                  {result.prediction === 'Resistant' ? (
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  {result.prediction}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full bg-purple-500"
                                      style={{ width: `${result.confidence}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-mono text-slate-600">{result.confidence}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                {result.mechanism || <span className="text-slate-300 italic">None detected</span>}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-sm text-slate-500 mb-1">Total Predictions</div>
                      <div className="text-3xl font-bold text-slate-800">{results.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-sm text-slate-500 mb-1">Resistant</div>
                      <div className="text-3xl font-bold text-red-600">{results.filter(r => r.prediction === 'Resistant').length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-sm text-slate-500 mb-1">Susceptible</div>
                      <div className="text-3xl font-bold text-green-600">{results.filter(r => r.prediction === 'Susceptible').length}</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-12 text-center shadow-lg border border-slate-200"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Analysis History</h3>
                  <p className="text-slate-500">Your previous analyses will appear here</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Info Cards */}
          <div className="space-y-6">
            {/* System Status */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl">
              <h4 className="text-lg font-bold mb-4 text-slate-200">System Status</h4>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">STATUS</span>
                  <span className="text-green-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    ONLINE
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">GPU_ACCEL</span>
                  <span className="text-purple-400">ENABLED</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">LATENCY</span>
                  <span className="text-slate-300">140ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">QUEUE</span>
                  <span className="text-slate-300">0 pending</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Supported Formats</div>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    FASTA Sequences (.fasta)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    FNA Nucleotide Files (.fna)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Multi-FASTA Batches
                  </li>
                </ul>
              </div>
            </div>

            {/* Quote */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-3xl p-6 border border-purple-100">
              <svg className="w-8 h-8 text-purple-300 mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
              <p className="text-slate-600 text-sm italic leading-relaxed mb-4">
                "Zenthera represents a shift from traditional culture-based methods toward near-instant genomic diagnostic workflows."
              </p>
              <div className="text-xs text-slate-500 font-medium">
                — Clinical Microbiology Journal, 2024
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4">Analysis Tips</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Ensure files are &lt;50MB for optimal processing</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Use standard FASTA format headers</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Quality scores are not required</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-20 py-8 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2024 Zenthera AI. Experimental clinical diagnostic tool.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-purple-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-purple-600 transition-colors">Documentation</a>
            <a href="#" className="hover:text-purple-600 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
