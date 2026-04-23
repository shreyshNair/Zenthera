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
    <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 text-brand-orange mb-4">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Diagnostic Intelligence</span>
          </div>
          <h2 className="text-5xl font-serif italic text-text-primary">{results.organism}</h2>
          <p className="mt-4 text-text-secondary text-lg font-light">Comprehensive resistance profiling from k-mer signature extraction.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-6 py-3 text-text-secondary hover:bg-bg-secondary rounded-full border border-border-main transition-all font-bold text-xs uppercase tracking-widest"
          >
            <RotateCcw className="w-4 h-4" />
            New Scan
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-8 py-3 bg-text-primary text-bg-primary rounded-full shadow-2xl hover:bg-brand-orange hover:text-white transition-all hover:-translate-y-1 font-bold text-xs uppercase tracking-widest"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Resistant", val: resistantCount, icon: ShieldAlert, color: "text-status-resistant", bg: "bg-status-resistant/10", id: "AMR_RES" },
          { label: "Susceptible", val: susceptibleCount, icon: ShieldCheck, color: "text-status-susceptible", bg: "bg-status-susceptible/10", id: "AMR_SUS" },
          { label: "Avg. Confidence", val: `${avgConfidence.toFixed(1)}%`, icon: Target, color: "text-brand-orange", bg: "bg-brand-orange/10", id: "ML_CONF" }
        ].map((card, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-bg-primary p-10 rounded-[3rem] border border-border-main shadow-sm"
          >
            <div className="flex justify-between items-start mb-8">
              <div className={`p-4 ${card.bg} ${card.color} rounded-2xl`}>
                <card.icon className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-mono font-bold text-text-muted tracking-widest">{card.id}</span>
            </div>
            <h4 className="text-5xl font-bold text-text-primary mb-2">{card.val}</h4>
            <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Predictions Table */}
      <div className="bg-bg-primary rounded-[3rem] border border-border-main shadow-sm overflow-hidden">
        <div className="px-12 py-8 border-b border-border-main bg-bg-secondary/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-6 h-6 text-text-muted" />
            <h3 className="text-xl font-bold text-text-primary font-serif italic">Detailed Resistance Profile</h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-text-muted tracking-[0.2em] uppercase">TABLE_ID: RES_CORE_01</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-secondary/30 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                <th className="px-12 py-6 text-left">Antibiotic</th>
                <th className="px-12 py-6 text-left">Prediction</th>
                <th className="px-12 py-6 text-left">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {results.predictions.map((p, i) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  key={p.antibiotic} 
                  className="hover:bg-bg-secondary/30 transition-colors"
                >
                  <td className="px-12 py-8 font-bold text-text-primary text-lg">{p.antibiotic}</td>
                  <td className="px-12 py-8">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest
                      ${p.prediction === 'Resistant' 
                        ? 'bg-status-resistant/10 text-status-resistant' 
                        : 'bg-status-susceptible/10 text-status-susceptible'}
                    `}>
                      <div className={`w-1.5 h-1.5 rounded-full ${p.prediction === 'Resistant' ? 'bg-status-resistant' : 'bg-status-susceptible'}`} />
                      {p.prediction}
                    </span>
                  </td>
                  <td className="px-12 py-8">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-1.5 bg-bg-secondary rounded-full overflow-hidden max-w-[140px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${p.confidence}%` }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.05 }}
                          className="h-full bg-brand-orange"
                        />
                      </div>
                      <span className="text-sm font-mono font-bold text-text-secondary">{p.confidence}%</span>
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
