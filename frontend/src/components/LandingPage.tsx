import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { ArrowRight, Dna, ShieldCheck, Zap, FileText, ChevronRight, Play } from 'lucide-react';
import Navbar from './Navbar';

// --- Original Hero Components ---
interface Bacterium {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  type: "rod" | "coccus" | "spiral" | "vibrio" | "bacillus";
  opacity: number;
  drift: { x: number; y: number };
  rotationSpeed: number;
}

const generateBacteria = (count: number): Bacterium[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 10 + Math.random() * 24,
    rotation: Math.random() * 360,
    type: (["rod", "coccus", "spiral", "vibrio", "bacillus"] as const)[
      Math.floor(Math.random() * 5)
    ],
    opacity: 0.4 + Math.random() * 0.5,
    drift: { x: (Math.random() - 0.5) * 0.25, y: (Math.random() - 0.5) * 0.25 },
    rotationSpeed: (Math.random() - 0.5) * 2,
  }));

const BacteriaShape = ({ type, size }: { type: string; size: number }) => {
  if (type === "rod") {
    return (
      <svg width={size * 2.5} height={size} viewBox="0 0 50 20">
        <rect x="5" y="3" width="40" height="14" rx="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="25" y1="3" x2="25" y2="17" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      </svg>
    );
  }
  if (type === "coccus") {
    return (
      <svg width={size * 1.5} height={size * 1.5} viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="15" cy="15" r="5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      </svg>
    );
  }
  if (type === "spiral") {
    return (
      <svg width={size * 3} height={size} viewBox="0 0 60 20">
        <path d="M5 10 Q15 2 25 10 Q35 18 45 10 Q55 2 58 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (type === "vibrio") {
    return (
      <svg width={size * 2} height={size * 1.5} viewBox="0 0 40 30">
        <path d="M5 25 Q20 -5 35 15" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="35" cy="15" r="3" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      </svg>
    );
  }
  return (
    <svg width={size * 3.5} height={size} viewBox="0 0 70 20">
      <rect x="3" y="4" width="18" height="12" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="25" y="4" width="18" height="12" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="47" y="4" width="18" height="12" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
};

// --- Animation Reveal Wrapper ---
const FadeInWhenVisible = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);


const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  
  const [mousePos, setMousePos] = useState({ x: -300, y: -300 });
  const [bacteria] = useState(() => generateBacteria(80));
  const [positions, setPositions] = useState<{ x: number; y: number; rotation: number }[]>([]);

  const { scrollY } = useScroll();

  useEffect(() => {
    setPositions(bacteria.map((b) => ({ x: b.x, y: b.y, rotation: b.rotation })));
    const interval = setInterval(() => {
      setPositions((prev) =>
        prev.map((p, i) => ({
          x: (p.x + bacteria[i].drift.x + 100) % 100,
          y: (p.y + bacteria[i].drift.y + 100) % 100,
          rotation: p.rotation + bacteria[i].rotationSpeed,
        }))
      );
    }, 60);
    return () => clearInterval(interval);
  }, [bacteria]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const torchRadius = 250;

  return (
    <div className="relative w-full bg-white">
      <Navbar />

      {/* ============================================
          HERO SECTION (Standard Layout)
          ============================================ */}
      <div 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos({ x: -300, y: -300 })}
        className="relative min-h-[90vh] w-full overflow-hidden bg-white flex items-center pt-24"
      >
        {/* Subtle Grid */}
        <div className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundSize: '40px 40px',
            backgroundImage: `linear-gradient(to right, #64748b 1px, transparent 1px),
                             linear-gradient(to bottom, #64748b 1px, transparent 1px)`,
            maskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 80%)',
          }}
        />

        {/* Torch Glow Effect */}
        <div
          className="pointer-events-none absolute z-10 rounded-full"
          style={{
            left: mousePos.x - torchRadius,
            top: mousePos.y - torchRadius,
            width: torchRadius * 2,
            height: torchRadius * 2,
            background: `radial-gradient(circle, rgba(241, 90, 36, 0.15) 0%, rgba(241, 90, 36, 0.05) 40%, transparent 70%)`,
            mixBlendMode: 'multiply'
          }}
        />

        {/* Bacteria Layer */}
        <div className="absolute inset-0 pointer-events-none z-[5]">
          {bacteria.map((b, i) => {
            if (!positions[i]) return null;
            return (
              <div
                key={b.id}
                className="absolute transition-opacity duration-500 text-brand-orange"
                style={{
                  left: `${positions[i].x}%`,
                  top: `${positions[i].y}%`,
                  transform: `rotate(${positions[i].rotation}deg)`,
                  opacity: b.opacity * 0.4,
                }}
              >
                <BacteriaShape type={b.type} size={b.size} />
              </div>
            );
          })}
        </div>

        {/* Hero Content - SPLIT LAYOUT */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-16 py-20">
          {/* Left Side: Text & Brand */}
          <motion.div 
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 text-left relative"
          >
            {/* Subtle floating glass background for text */}
            <div className="absolute -inset-10 bg-white/20 backdrop-blur-[2px] rounded-[4rem] -z-10 border border-white/30 shadow-[0_8px_32px_0_rgba(241,90,36,0.05)]" />

            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-brand-orange/10 rounded-full border border-brand-orange/20">
              <div className="w-2 h-2 bg-brand-orange rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange">Clinical Intelligence v3.0</span>
            </div>

            <h1 className="font-serif italic text-7xl md:text-[8rem] text-slate-900 leading-[0.85] mb-10 tracking-tighter">
              Zenthera
              <br />
              <span className="text-brand-orange italic relative inline-block">
                AI
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, delay: 1, ease: "circOut" }}
                  className="absolute -bottom-2 left-0 h-1.5 bg-brand-orange/30 rounded-full"
                />
              </span>
            </h1>

            <p className="text-slate-500 text-xl md:text-2xl max-w-lg mb-12 font-light tracking-wide leading-relaxed">
              Accelerating antibiotic discovery and resistance prediction through <span className="text-slate-900 font-medium italic">high-fidelity genomic intelligence.</span>
            </p>

            <motion.button
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(241,90,36,0.25)' }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex items-center gap-4 px-12 py-6 bg-slate-900 text-white rounded-full text-sm font-bold tracking-wider uppercase transition-all overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-orange to-[#ff8c5a] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10">Initialize Pipeline</span>
              <ArrowRight className="relative z-10 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <p className="text-slate-400 font-mono text-[9px] mt-16 tracking-[0.4em] uppercase opacity-50">
              [ Interactive Specimen Environment Active ]
            </p>
          </motion.div>

          {/* Right Side: Blooddrop Video Animation */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.85, x: 60 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="flex-1 flex justify-center items-center relative"
          >
            {/* Secondary atmospheric glow behind drop */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square bg-brand-orange/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative w-full max-w-md aspect-square rounded-[50%_50%_50%_0] rotate-[135deg] overflow-hidden shadow-[0_40px_100px_-20px_rgba(241,90,36,0.35)] border-8 border-white bg-black group transition-all duration-1000 hover:shadow-[0_60px_120px_-30px_rgba(241,90,36,0.5)]">
              
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full -rotate-[135deg] scale-[1.6]"
              >
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover grayscale-[0.2] contrast-125"
                >
                  <source src="/dnaanimation.mp4" type="video/mp4" />
                </video>
              </motion.div>

              {/* Glass Glare Layer */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none -rotate-[135deg] opacity-60" />
              
              {/* Internal Brand Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/30 via-transparent to-brand-orange/10 pointer-events-none -rotate-[135deg] mix-blend-overlay" />
              
              {/* Hover Bloom */}
              <div className="absolute -inset-10 bg-brand-orange/30 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ============================================
          SECTIONS (Restructured for Single Page)
          ============================================ */}
      
      {/* Specificity Section */}
      <section id="section-about" className="relative py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeInWhenVisible>
            <div className="text-center mb-24">
              <div className="text-brand-orange font-bold uppercase tracking-widest text-xs mb-4">Precision</div>
              <h2 className="text-5xl md:text-6xl font-bold mb-8">Designed Specifically For</h2>
              <div className="w-20 h-1.5 bg-brand-orange mx-auto rounded-full"></div>
            </div>
          </FadeInWhenVisible>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Clinical Researchers", desc: "Accelerate genomic surveillance and identify emerging resistance patterns across bacterial populations.", icon: ShieldCheck, color: "bg-brand-orange" },
              { title: "Hospital Diagnostics", desc: "Reduce turn-around time for critical infections from days to minutes, enabling faster evidence-based selection.", icon: Zap, color: "bg-slate-900" },
              { title: "Public Health Agencies", desc: "Monitor AMR prevalence and spread with automated data processing and standardized reports.", icon: FileText, color: "bg-brand-orange" }
            ].map((card, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ y: -10 }} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 group transition-all"
              >
                <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-8 transform group-hover:rotate-6 transition-transform`}>
                  <card.icon className="text-white w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
                <p className="text-slate-600 leading-relaxed mb-8">{card.desc}</p>
                <div className="flex items-center gap-2 text-brand-orange font-bold cursor-pointer group/link">
                  Learn More <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="relative py-48 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="space-y-48">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <FadeInWhenVisible>
                <div className="relative">
                  <div className="absolute -inset-12 bg-brand-orange/5 rounded-[4rem] blur-3xl"></div>
                  <div className="relative bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl aspect-video flex items-center justify-center overflow-hidden">
                    <Dna className="w-48 h-48 text-brand-orange opacity-10 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-6">
                        <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: '80%' }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-brand-orange"></motion.div>
                        </div>
                        <div className="text-xs font-mono text-slate-400 tracking-widest">ANALYZING GENOME...</div>
                    </div>
                  </div>
                </div>
              </FadeInWhenVisible>
              <FadeInWhenVisible delay={0.2}>
                <div>
                  <div className="text-brand-orange font-bold uppercase tracking-widest text-sm mb-6">Vigilance</div>
                  <h2 className="text-6xl font-bold mb-8 leading-tight">FASTA Sequence Analysis</h2>
                  <p className="text-2xl text-slate-600 leading-relaxed mb-10 font-light">Our advanced processing engine extracts structural variants and k-mer signatures from raw genomic data with near-zero latency.</p>
                  <button className="px-12 py-6 bg-slate-900 text-white rounded-full font-bold hover:bg-brand-orange transition-all shadow-xl shadow-brand-orange/10 uppercase text-xs tracking-widest">Explore Platform</button>
                </div>
              </FadeInWhenVisible>
            </div>

            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <FadeInWhenVisible className="order-2 lg:order-1">
                <div>
                  <div className="text-brand-orange font-bold uppercase tracking-widest text-sm mb-6">Vengeance</div>
                  <h2 className="text-6xl font-bold mb-8 leading-tight">Predictive AI Intelligence</h2>
                  <p className="text-2xl text-slate-600 leading-relaxed mb-10 font-light">Up to 94% precision across 35 major antibiotic classes, providing actionable clinical insights for immediate intervention.</p>
                  <ul className="space-y-6">
                    {['Random Forest Classifiers', 'Susceptibility Scoring', 'Mechanism Detection'].map((item, idx) => (
                      <motion.li 
                        key={idx} 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-4 text-slate-700 text-lg"
                      >
                        <div className="w-6 h-6 rounded-full bg-brand-orange/10 flex items-center justify-center">
                          <div className="w-2 h-2 bg-brand-orange rounded-full"></div>
                        </div>
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </FadeInWhenVisible>
              <FadeInWhenVisible delay={0.2} className="order-1 lg:order-2">
                <div className="relative bg-slate-900 rounded-[3rem] p-12 aspect-video flex items-center justify-center overflow-hidden shadow-2xl">
                  <div className="grid grid-cols-4 gap-6 w-full">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div key={i} initial={{ opacity: 0.1 }} whileInView={{ opacity: [0.1, 0.8, 0.1] }} transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }} className="h-16 bg-brand-orange/20 rounded-xl" />
                    ))}
                  </div>
                </div>
              </FadeInWhenVisible>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="bg-slate-900 text-white py-48 relative overflow-hidden">
        {/* Subtle grid for dark mode */}
        <div className="absolute inset-0 z-0 opacity-[0.05]"
          style={{
            backgroundSize: '60px 60px',
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px),
                             linear-gradient(to bottom, white 1px, transparent 1px)`,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <FadeInWhenVisible>
              <div className="text-brand-orange font-bold uppercase tracking-widest text-sm mb-6">Workflow</div>
              <h2 className="text-6xl font-bold">How To Work With Us</h2>
            </FadeInWhenVisible>
            <FadeInWhenVisible delay={0.2}>
              <p className="text-slate-400 text-xl max-w-sm font-light">A streamlined process from genomic sequence to clinical insight.</p>
            </FadeInWhenVisible>
          </div>

          <div className="grid md:grid-cols-4 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-0 right-0 h-px bg-slate-800"></div>
            {[
              { step: "01", title: "Sequence Upload", desc: "Securely upload your FASTA or FNA genome files to our HIPAA-compliant nodes." },
              { step: "02", title: "AI Extraction", desc: "Our engine signatures k-mers and structural variants automatically." },
              { step: "03", title: "AMR Prediction", desc: "Real-time susceptibility calculation for 35+ drug classes." },
              { step: "04", title: "Export Report", desc: "Download detailed clinical PDF reports for your local diagnostics." }
            ].map((item, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="relative z-10 group"
              >
                <div className="w-24 h-24 bg-slate-900 border border-slate-700 rounded-3xl flex items-center justify-center mb-8 group-hover:border-brand-orange group-hover:shadow-[0_0_30px_rgba(241,90,36,0.2)] transition-all">
                  <span className="text-4xl font-bold text-brand-orange">{item.step}</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-32 pb-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-2">
               <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg shadow-brand-orange/20">
                  <span className="text-white font-bold text-2xl">Z</span>
                </div>
                <span className="text-3xl font-bold tracking-tight text-slate-900 font-serif italic text-[2.5rem]">Zenthera<span className="text-brand-orange">AI</span></span>
              </div>
              <p className="text-slate-500 text-xl font-light max-w-sm mb-10 leading-relaxed">Empowering clinical diagnostics with predictive AI and high-performance computational biology.</p>
            </div>
            <div>
              <h4 className="font-bold mb-8 uppercase tracking-widest text-[10px] text-slate-400">Platform</h4>
              <ul className="space-y-6 text-slate-600 font-medium">
                <li className="hover:text-brand-orange cursor-pointer transition-colors">AMR Prediction</li>
                <li className="hover:text-brand-orange cursor-pointer transition-colors">FASTA Analysis</li>
                <li className="hover:text-brand-orange cursor-pointer transition-colors">Clinical Reports</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-8 uppercase tracking-widest text-[10px] text-slate-400">Company</h4>
              <ul className="space-y-6 text-slate-600 font-medium">
                <li className="hover:text-brand-orange cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-brand-orange cursor-pointer transition-colors">Documentation</li>
                <li className="hover:text-brand-orange cursor-pointer transition-colors">Contact</li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400 gap-6">
            <p>© 2024 Zenthera AI. All rights reserved.</p>
            <div className="flex gap-8">
              <span className="hover:text-brand-orange cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-brand-orange cursor-pointer transition-colors">Terms</span>
            </div>
          </div>
        </div>
      </footer>

      <div className="grain-overlay" />
    </div>
  );
};

export default LandingPage;
