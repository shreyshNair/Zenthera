import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Beaker, Info, ShieldCheck } from 'lucide-react';
import FileUpload from './FileUpload';
import AnalysisLoader from './AnalysisLoader';
import ResultsPanel from './ResultsPanel';
import { uploadGenome, PredictionResult } from '../api/predictApi';
import { exportResultsToPdf } from '../utils/exportPdf';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [state, setState] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [results, setResults] = useState<PredictionResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      // Simulate real upload time + prediction
      const data = await uploadGenome(file);
      setResults(data);
      setState('analyzing');
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalysisComplete = () => {
    setState('results');
  };

  const handleReset = () => {
    setState('upload');
    setResults(null);
  };

  const handleExport = () => {
    exportResultsToPdf('analysis-results', `Zenthera_Report_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-purple-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Beaker className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-bold text-slate-900 tracking-tight">Zenthera Lab</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
              <ShieldCheck className="w-3 h-3" />
              SECURE ANALYSIS
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 mt-16 p-6 md:p-12">
        <div className="max-w-5xl mx-auto">
          
          <AnimatePresence mode="wait">
            {state === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-10"
              >
                <div className="lg:col-span-3 space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold text-slate-900 leading-tight">
                      Ready to predict <span className="text-purple-600">AMR</span> profiles?
                    </h2>
                    <p className="text-lg text-slate-500 max-w-lg">
                      Upload your bacterial genomic data to receive real-time antibiotic resistance predictions.
                    </p>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                    <FileUpload onFileSelect={handleFileSelect} isProcessing={isUploading} />
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-blue-50/50 text-blue-800 rounded-2xl border border-blue-100">
                    <Info className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Security Note</p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Your data is processed locally on our secure ML nodes and is never used for training without consent. 
                        Files are encrypted during transit.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold mb-4">Supported Formats</h3>
                      <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                          FASTA Sequences (.fasta)
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                          FNA Nucleotide Files (.fna)
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                          Multi-FASTA Batches
                        </li>
                      </ul>
                      <div className="mt-8 pt-8 border-t border-slate-800">
                        <p className="text-xs text-slate-400 leading-relaxed font-mono">
                          SYSTEM_STATUS: ONLINE<br />
                          GPU_ACCEL: ENABLED<br />
                          LATENCY: 140ms
                        </p>
                      </div>
                    </div>
                    {/* Decorative DNA bg for the black card */}
                    <div className="absolute -bottom-10 -right-10 opacity-10">
                      <Beaker className="w-48 h-48 rotate-12" />
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-3xl border border-dashed border-slate-300">
                    <p className="text-xs text-slate-400 text-center leading-relaxed">
                      "Zenthera represents a shift from traditional culture-based methods toward near-instant genomic diagnostic workflows."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {state === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex items-center justify-center min-h-[60vh]"
              >
                <AnalysisLoader onComplete={handleAnalysisComplete} />
              </motion.div>
            )}

            {state === 'results' && results && (
              <motion.div
                key="results"
                id="analysis-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto"
              >
                <ResultsPanel 
                  results={results} 
                  onReset={handleReset} 
                  onExport={handleExport}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-8 bg-white/50 backdrop-blur-sm px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">© 2024 Zenthera AI. Experimental clinical diagnostic tool.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-slate-400 hover:text-purple-600">Privacy Policy</a>
            <a href="#" className="text-xs text-slate-400 hover:text-purple-600">Documentation</a>
            <a href="#" className="text-xs text-slate-400 hover:text-purple-600">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
