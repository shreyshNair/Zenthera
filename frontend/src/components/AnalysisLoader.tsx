import React, { useState, useEffect } from 'react';
import { Dna, Database, Cpu, FileCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface STEP {
  id: number;
  label: string;
  icon: React.ReactNode;
  duration: number;
}

const STEPS: STEP[] = [
  { id: 1, label: 'Uploading genomic data...', icon: <Database className="w-5 h-5" />, duration: 1500 },
  { id: 2, label: 'Extracting k-mer frequencies...', icon: <Dna className="w-5 h-5" />, duration: 2500 },
  { id: 3, label: 'Running ML classification model...', icon: <Cpu className="w-5 h-5" />, duration: 2000 },
  { id: 4, label: 'Generating resistance profile...', icon: <FileCheck className="w-5 h-5" />, duration: 1500 },
];

interface AnalysisLoaderProps {
  onComplete: () => void;
}

const AnalysisLoader: React.FC<AnalysisLoaderProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, STEPS[currentStep].duration);
      return () => clearTimeout(timer);
    } else {
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(finishTimer);
    }
  }, [currentStep, onComplete]);

  return (
    <div className="w-full max-w-md mx-auto py-12 px-6 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
      <div className="relative flex flex-col items-center">
        {/* DNA Animation */}
        <div className="relative w-24 h-24 mb-10 text-purple-600">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-dashed border-purple-200 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Dna className="w-10 h-10 animate-pulse" />
          </motion.div>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Sequence</h3>
        <p className="text-slate-400 text-sm mb-10">Micro-analysis in progress</p>

        {/* Steps */}
        <div className="w-full space-y-6">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="relative">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500
                    ${isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 scale-110' : 
                      isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-300'}
                  `}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-medium transition-colors duration-300
                        ${isActive ? 'text-slate-800' : isCompleted ? 'text-slate-500' : 'text-slate-300'}
                      `}>
                        {step.label}
                      </span>
                      {isActive && <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] text-purple-500 font-mono tracking-tighter"
                      >
                        PROCESSING
                      </motion.span>}
                    </div>
                    {/* Progress Bar Background */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      {isActive && (
                        <motion.div
                          initial={{ x: "-100%" }}
                          animate={{ x: "0%" }}
                          transition={{ duration: step.duration / 1000, ease: "easeInOut" }}
                          className="h-full w-full bg-purple-600 rounded-full"
                        />
                      )}
                      {isCompleted && <div className="h-full w-full bg-green-500 rounded-full" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-slate-50 flex justify-center">
        <p className="text-[10px] text-slate-300 uppercase tracking-widest font-mono">
          Model: Zenthera-RF-v2.0
        </p>
      </div>
    </div>
  );
};

export default AnalysisLoader;
