import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Database, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  RotateCcw,
  ChevronRight,
  Info
} from 'lucide-react';
import Navbar from './Navbar';
import { uploadGenome, PredictionResult as ApiResult } from '../api/predictApi';

interface DashboardResult {
  id: string;
  antibiotic: string;
  prediction: 'Resistant' | 'Susceptible';
  confidence: number;
  mechanism?: string;
  model: string;
  confidence_tier: string;
}

interface GenomeInfo {
  header: string;
  seq_length: number;
  gc_pct: number;
  organism_match: boolean;
  matched_genus: string | null;
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
  const [activeTab, setActiveTab] = useState<'vigilance' | 'vengeance'>('vigilance');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [results, setResults] = useState<DashboardResult[]>([]);
  const [genomeInfo, setGenomeInfo] = useState<GenomeInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setError(null);
    const newFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      status: 'uploading',
      progress: 0
    };
    
    setUploadedFiles([newFile]);
    
    // Simulate initial upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadedFiles(prev => prev.map(f => 
        f.id === newFile.id ? { ...f, progress: Math.min(progress, 90) } : f
      ));
      if (progress >= 90) clearInterval(interval);
    }, 100);

    try {
      setIsAnalyzing(true);
      const apiResult = await uploadGenome(file);
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === newFile.id ? { ...f, status: 'complete', progress: 100 } : f
      ));

      setGenomeInfo(apiResult.genome);
      
      const dashboardResults: DashboardResult[] = apiResult.predictions.map((p, idx) => ({
        id: idx.toString(),
        antibiotic: p.antibiotic,
        prediction: p.phenotype,
        confidence: p.confidence,
        model: p.model,
        confidence_tier: p.confidence_tier,
        mechanism: p.det_found ? 'Deterministic Match' : undefined
      }));

      setResults(dashboardResults);
      setIsAnalyzing(false);
      setTimeout(() => setActiveTab('vengeance'), 800);

    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please ensure the backend is running.');
      setUploadedFiles(prev => prev.map(f => 
        f.id === newFile.id ? { ...f, status: 'error' } : f
      ));
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-brand-orange selection:text-white">
      <Navbar />

      {/* Page Header */}
      <header className="pt-32 pb-16 border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8"
          >
            <div>
              <div className="flex items-center gap-3 text-brand-orange mb-4 font-bold uppercase tracking-[0.2em] text-sm">
                <Activity className="w-5 h-5" />
                <span>Diagnostic Portal</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif italic text-slate-900 leading-none">
                {activeTab === 'vigilance' ? 'Vigilance' : 'Vengeance'}
              </h1>
              <p className="mt-6 text-xl text-slate-500 max-w-2xl font-light">
                {activeTab === 'vigilance' 
                  ? 'Advanced processing engine for raw genomic data and k-mer signature extraction.' 
                  : 'Actionable resistance predictions and susceptibility intelligence.'}
              </p>
            </div>
            
            <div className="flex gap-4">
               <button 
                onClick={() => setActiveTab('vigilance')}
                className={`px-8 py-4 rounded-full text-sm font-bold tracking-wider uppercase transition-all ${
                  activeTab === 'vigilance' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-orange'
                }`}
              >
                Vigilance
              </button>
              <button 
                onClick={() => setActiveTab('vengeance')}
                disabled={results.length === 0}
                className={`px-8 py-4 rounded-full text-sm font-bold tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  activeTab === 'vengeance' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-orange'
                }`}
              >
                Vengeance
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <AnimatePresence mode="wait">
          {activeTab === 'vigilance' ? (
            <motion.div 
              key="vigilance"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-3 gap-12"
            >
              {/* Upload Zone */}
              <div className="lg:col-span-2 space-y-8">
                {error && (
                  <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-center gap-4 text-red-600">
                    <ShieldAlert className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-wider text-xs">Analysis Error</p>
                      <p className="text-sm opacity-80">{error}</p>
                    </div>
                  </div>
                )}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative aspect-[16/9] lg:aspect-auto lg:h-[400px] rounded-[40px] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-12 overflow-hidden ${
                    isDragging 
                      ? 'border-brand-orange bg-brand-orange/5 scale-[1.01]' 
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-brand-orange/50'
                  }`}
                >
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    disabled={isAnalyzing}
                  />
                  
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8">
                    <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-brand-orange' : 'text-slate-400'}`} />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">Drop Sequence Data</h3>
                  <p className="text-slate-500 text-center max-w-sm mb-8">
                    Select <span className="text-brand-orange font-mono">.fasta</span>, <span className="text-brand-orange font-mono">.fna</span>, or <span className="text-brand-orange font-mono">.fa</span> genomic files for analysis.
                  </p>
                  
                  <div className="px-8 py-3 bg-slate-900 text-white rounded-full text-xs font-bold tracking-widest uppercase">
                    Browse Files
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-4">
                    {uploadedFiles.map(file => (
                      <div key={file.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-slate-900">{file.name}</span>
                            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{file.status}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-brand-orange"
                              initial={{ width: 0 }}
                              animate={{ width: `${file.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Specs & Info */}
              <div className="space-y-8">
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Database className="w-24 h-24" />
                   </div>
                   <h4 className="text-xl font-bold mb-8 flex items-center gap-3">
                      <Cpu className="text-brand-orange w-5 h-5" />
                      Platform Status
                   </h4>
                   <div className="space-y-6 font-mono text-xs">
                      {[
                        { label: "Cluster_Node", val: "ALPHA-9", color: "text-green-400" },
                        { label: "GPU_Compute", val: "Active", color: "text-brand-orange" },
                        { label: "Memory_Usage", val: "14.2 GB", color: "text-slate-300" },
                        { label: "Encryption", val: "AES-256", color: "text-slate-300" }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between border-b border-slate-800 pb-4 last:border-0">
                          <span className="text-slate-500 uppercase">{item.label}</span>
                          <span className={item.color}>{item.val}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100">
                  <h4 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <Info className="text-brand-orange w-5 h-5" />
                    Security Protocol
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    All genomic data is processed within an isolated sandbox. We do not store sequences after analysis unless explicitly requested for research collaboration.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="vengeance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              {/* Stats Overview */}
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { label: "Resistant", val: results.filter(r => r.prediction === 'Resistant').length, color: "text-red-600", bg: "bg-red-50", icon: ShieldAlert },
                  { label: "Susceptible", val: results.filter(r => r.prediction === 'Susceptible').length, color: "text-green-600", bg: "bg-green-50", icon: ShieldCheck },
                  { label: "Confidence", val: genomeInfo ? `${genomeInfo.gc_pct}% GC` : "94.2%", color: "text-brand-orange", bg: "bg-brand-orange/5", icon: Cpu }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
                      <stat.icon className="w-7 h-7" />
                    </div>
                    <div className="text-5xl font-bold text-slate-900 mb-2">{stat.val}</div>
                    <div className="text-sm font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Results Table */}
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-12 py-8 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="text-2xl font-bold text-slate-900">Resistance Profile</h3>
                   <div className="flex gap-4">
                      <button className="flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-full text-xs font-bold uppercase tracking-widest hover:border-brand-orange transition-all">
                        <Download className="w-4 h-4" /> Export
                      </button>
                      <button onClick={() => {setResults([]); setActiveTab('vigilance');}} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-orange transition-all">
                        <RotateCcw className="w-4 h-4" /> New Scan
                      </button>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50/50 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                          <th className="px-12 py-6 text-left">Antibiotic</th>
                          <th className="px-12 py-6 text-left">Result</th>
                          <th className="px-12 py-6 text-left">Confidence</th>
                          <th className="px-12 py-6 text-left">Mechanism</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results.map((r, i) => (
                          <motion.tr 
                            key={r.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-12 py-8 font-bold text-slate-900 text-lg">{r.antibiotic}</td>
                            <td className="px-12 py-8">
                               <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${
                                 r.prediction === 'Resistant' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                               }`}>
                                  <div className={`w-2 h-2 rounded-full ${r.prediction === 'Resistant' ? 'bg-red-600 animate-pulse' : 'bg-green-600'}`} />
                                  {r.prediction}
                               </div>
                            </td>
                            <td className="px-12 py-8">
                               <div className="flex items-center gap-4">
                                  <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                     <div className="h-full bg-brand-orange" style={{ width: `${r.confidence}%` }} />
                                  </div>
                                  <span className="font-mono text-sm text-slate-500">{r.confidence}%</span>
                               </div>
                            </td>
                            <td className="px-12 py-8 font-mono text-sm text-brand-orange">
                               {r.mechanism || <span className="text-slate-300 italic">-</span>}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Background Grain */}
      <div className="grain-overlay opacity-[0.03]" />
    </div>
  );
};

export default Dashboard;
