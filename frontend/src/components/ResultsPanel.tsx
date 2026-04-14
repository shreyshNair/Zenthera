import React from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  RotateCcw, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Target,
  FileText
} from 'lucide-react';

export interface Prediction {
  antibiotic: string;
  prediction: 'Resistant' | 'Susceptible';
  confidence: number;
}

interface ResultsPanelProps {
  results: {
    organism: string;
    predictions: Prediction[];
  };
  onReset: () => void;
  onExport: () => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ results, onReset, onExport }) => {
  const resistantCount = results.predictions.filter(p => p.prediction === 'Resistant').length;
  const susceptibleCount = results.predictions.filter(p => p.prediction === 'Susceptible').length;
  const avgConfidence = results.predictions.reduce((acc, curr) => acc + curr.confidence, 0) / results.predictions.length;

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Analysis Complete</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">{results.organism}</h2>
          <p className="text-slate-500">Resistance profile based on genomic k-mer analysis</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-medium">New Scan</span>
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export Report</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-slate-400">AMR_RES</span>
          </div>
          <h4 className="text-4xl font-bold text-slate-900">{resistantCount}</h4>
          <p className="text-slate-500 text-sm">Resistant Strains</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-slate-400">AMR_SUS</span>
          </div>
          <h4 className="text-4xl font-bold text-slate-900">{susceptibleCount}</h4>
          <p className="text-slate-500 text-sm">Susceptible Strains</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-slate-400">ML_CONF</span>
          </div>
          <h4 className="text-4xl font-bold text-slate-900">{avgConfidence.toFixed(1)}%</h4>
          <p className="text-slate-500 text-sm">Avg. Confidence</p>
        </motion.div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-slate-800">Detailed Resistance Profile</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">TABLE_ID: RES_1124_01</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-8 py-4 text-left font-semibold">Antibiotic Name</th>
                <th className="px-8 py-4 text-left font-semibold">Prediction</th>
                <th className="px-8 py-4 text-left font-semibold">Confidence Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {results.predictions.map((p, i) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  key={p.antibiotic} 
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-8 py-5 font-semibold text-slate-700">{p.antibiotic}</td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                      ${p.prediction === 'Resistant' 
                        ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' 
                        : 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'}
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.prediction === 'Resistant' ? 'bg-red-600' : 'bg-green-600'}`} />
                      {p.prediction}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${p.confidence}%` }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.05 }}
                          className={`h-full rounded-full ${p.confidence > 90 ? 'bg-purple-600' : p.confidence > 80 ? 'bg-purple-400' : 'bg-purple-300'}`}
                        />
                      </div>
                      <span className="text-sm font-mono text-slate-600">{p.confidence}%</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
