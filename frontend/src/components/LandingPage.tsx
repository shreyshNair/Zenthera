// src/components/LandingPage.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from "lucide-react";

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
  // bacillus — chain of rods
  return (
    <svg width={size * 3.5} height={size} viewBox="0 0 70 20">
      <rect x="3" y="4" width="18" height="12" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="25" y="4" width="18" height="12" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="47" y="4" width="18" height="12" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
};


// Icons as SVG components (no emojis)
const DnaIcon = () => (
  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.575.563c-.381.136-.775.204-1.172.204H7.547c-.397 0-.79-.068-1.172-.204L4.8 15.3m15 0a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25m19.5 0v-2.625a2.25 2.25 0 00-2.25-2.25h-15a2.25 2.25 0 00-2.25 2.25v2.625" />
  </svg>
);

const BrainIcon = () => (
  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const LightningIcon = () => (
  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const features = [
  {
    title: "FASTA Analysis",
    desc: "Upload bacterial genome sequences in standard FASTA/FNA formats instantly.",
    icon: DnaIcon
  },
  {
    title: "ML Prediction",
    desc: "Advanced Random Forest & Logistic Regression models for resistance prediction.",
    icon: BrainIcon
  },
  {
    title: "Real-time Results",
    desc: "Near-instant predictions replacing traditional 48-hour culture methods.",
    icon: LightningIcon
  },
  {
    title: "PDF Reports",
    desc: "Export comprehensive analysis reports with confidence scores for clinical records.",
    icon: FileIcon
  }
];

const workflow = [
  { step: "01", title: "Upload", desc: "Drag & drop your .fasta or .fna genome files into the secure upload portal." },
  { step: "02", title: "Analysis", desc: "Our backend extracts k-mer frequencies and processes through trained ML models." },
  { step: "03", title: "Prediction", desc: "Receive instant resistance/susceptibility predictions with confidence intervals." },
  { step: "04", title: "Export", desc: "Download detailed PDF reports for research documentation or clinical decisions." }
];

const reviews = [
  {
    quote: "Zenthera reduced our diagnostic time from 2 days to 2 minutes. Revolutionary for ICU infections.",
    author: "Dr. Sarah Chen",
    role: "Clinical Microbiologist",
    org: "Johns Hopkins Hospital"
  },
  {
    quote: "The accuracy of k-mer analysis paired with their ML pipeline is remarkable for genomic surveillance.",
    author: "Prof. James Rodriguez",
    role: "Research Director",
    org: "Broad Institute"
  },
  {
    quote: "Finally, a tool that makes AMR prediction accessible without expensive lab infrastructure.",
    author: "Dr. Aisha Patel",
    role: "Infectious Disease Specialist",
    org: "WHO Global AMR Observatory"
  }
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  
  const [mousePos, setMousePos] = useState({ x: -300, y: -300 });
  const [bacteria] = useState(() => generateBacteria(80));
  const [positions, setPositions] = useState<{ x: number; y: number; rotation: number }[]>([]);

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

  // Scroll-based animations for transitions
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroBlur = useTransform(scrollYProgress, [0, 0.2], [0, 20]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const aboutBlur = useTransform(scrollYProgress, [0.1, 0.3], [10, 0]);
  const aboutOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };


  return (
    <div className="relative w-full min-h-screen bg-slate-50">
      
      {/* HERO SECTION - Torch Reveal */}
      <motion.div 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos({ x: -300, y: -300 })}
        style={{ opacity: heroOpacity, filter: `blur(${heroBlur}px)`, scale: heroScale }}
        className="relative w-full h-screen overflow-hidden z-30 bg-slate-50 text-slate-800 cursor-none"
      >
        {/* Subtle grid */}
        <div className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundSize: '30px 30px',
            backgroundImage: `linear-gradient(to right, #64748b 1px, transparent 1px),
                             linear-gradient(to bottom, #64748b 1px, transparent 1px)`,
          }}
        />

        {/* Torch glow */}
        <div
          className="pointer-events-none fixed z-10 rounded-full"
          style={{
            left: mousePos.x - torchRadius,
            top: mousePos.y - torchRadius,
            width: torchRadius * 2,
            height: torchRadius * 2,
            background: `radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 70%)`,
          }}
        />

        {/* Bacteria layer */}
        <div className="absolute inset-0 pointer-events-none z-[5]">
          {bacteria.map((b, i) => {
            if (!positions[i]) return null;
            const bx = (positions[i].x / 100) * (heroRef.current?.clientWidth || window.innerWidth);
            const by = (positions[i].y / 100) * (heroRef.current?.clientHeight || window.innerHeight);
            const dist = Math.sqrt((bx - mousePos.x) ** 2 + (by - mousePos.y) ** 2);
            const visible = dist < torchRadius;
            const intensity = visible ? Math.max(0, 1 - dist / torchRadius) : 0;

            return (
              <div
                key={b.id}
                className="absolute transition-opacity duration-300 text-purple-600 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                style={{
                  left: `${positions[i].x}%`,
                  top: `${positions[i].y}%`,
                  transform: `rotate(${positions[i].rotation}deg)`,
                  opacity: intensity * b.opacity,
                }}
              >
                <BacteriaShape type={b.type} size={b.size} />
              </div>
            );
          })}
        </div>

        {/* Floating Navigation Bar (Preserved) */}
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-8 px-8 py-3 bg-white/70 backdrop-blur-md rounded-full shadow-lg border border-slate-200/50">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-slate-800 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
              Zenthera
            </span>
            <div className="h-4 w-px bg-slate-300" />
            <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-slate-600 hover:text-purple-700 transition-colors">
              Dashboard
            </button>
            <button onClick={() => scrollToSection('workflow')} className="text-sm font-medium text-slate-600 hover:text-purple-700 transition-colors">
              Analysis
            </button>
            <button onClick={() => scrollToSection('about')} className="text-sm font-medium text-slate-600 hover:text-purple-700 transition-colors">
              About
            </button>
            <div className="h-4 w-px bg-slate-300" />
            <div className="flex items-center gap-2 text-xs text-purple-600 font-mono">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Active
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center"
          >
            <h1 className="font-serif italic text-7xl md:text-9xl text-slate-800 text-center leading-none mb-6">
              Zenthera<span className="text-purple-600">AI</span>
            </h1>

            <p className="text-slate-500 font-body text-lg md:text-xl text-center max-w-lg mb-3 font-light tracking-wide">
              Predict antibiotic resistance from genomic sequences — instantly.
            </p>

            <p className="text-slate-400 font-mono text-[11px] mb-12 tracking-widest uppercase">
              [ Hover to reveal specimens ]
            </p>

            <button
              onClick={() => navigate('/dashboard')}
              className="pointer-events-auto flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-display text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </motion.div> {/* END HERO SECTION */}

      {/* TRANSITION LENS - Blurs Hero as we scroll down */}
      <motion.div 
        className="fixed inset-0 pointer-events-none z-40 bg-white/5 backdrop-blur-[20px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_100%)]"
        style={{ 
          opacity: useTransform(scrollYProgress, [0.1, 0.3], [0, 1]) 
        }} 
      />

      {/* ABOUT SECTION */}
      <section id="about" className="py-32 px-4 md:px-8 bg-white relative z-40 overflow-hidden">
        {/* Soft edge blending */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 to-transparent z-10" />
        
        <motion.div 
          className="max-w-6xl mx-auto"
          style={{ opacity: aboutOpacity, filter: useTransform(scrollYProgress, [0.1, 0.3], ["blur(10px)", "blur(0px)"]) }}
        >
          <motion.div 
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
                Combating <span className="text-purple-600">Antibiotic Resistance</span> with AI
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                Zenthera leverages advanced machine learning algorithms and k-mer frequency analysis to predict antimicrobial resistance (AMR) patterns in bacterial pathogens. Our platform bridges the gap between genomic data and clinical decision-making.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed">
                By replacing traditional 48-hour culture-based susceptibility testing with near-instant computational predictions, we empower clinicians and researchers to make time-critical decisions in the fight against resistant infections.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-slate-100 rounded-3xl transform rotate-3" />
              <div className="relative bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-3xl font-bold text-slate-400 mb-1">48hrs</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-mono">Traditional</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl border-2 border-purple-100">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{'<2min'}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-mono">Zenthera</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-3xl font-bold text-slate-400 mb-1">85%</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-mono">Standard</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl border-2 border-purple-100">
                    <div className="text-3xl font-bold text-purple-600 mb-1">94%</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-mono">Precision</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-32 px-4 md:px-8 bg-slate-50 relative z-40">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Platform Features</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg italic">Comprehensive genomic analysis tools designed for modern clinical and research environments.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -12, scale: 1.02 }}
                className="bg-white/60 backdrop-blur-lg p-8 rounded-3xl shadow-lg border border-white/50 hover:shadow-2xl hover:border-purple-200 transition-all group"
              >
                <div className="mb-6 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 block w-fit">
                  <feature.icon />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-purple-600 transition-colors">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed antialiased">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section id="workflow" className="py-32 px-4 md:px-8 bg-white relative overflow-hidden z-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.05),transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">How It Works</h2>
            <p className="text-slate-600 text-lg">Streamlined workflow from genomic data to clinical insights.</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {workflow.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative"
              >
                {idx < workflow.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-purple-200 to-transparent z-0 opacity-40" />
                )}
                <div className="relative bg-white/60 backdrop-blur-lg rounded-3xl p-8 h-full border border-white/50 hover:border-purple-300 hover:bg-white/80 hover:shadow-xl transition-all group z-10">
                  <div className="text-6xl font-black text-slate-100 group-hover:text-purple-100 transition-colors mb-4 font-mono select-none">{item.step}</div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section className="py-32 px-4 md:px-8 bg-gradient-to-br from-slate-50 to-purple-50/30 relative z-40">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Trusted by Researchers</h2>
            <p className="text-slate-600 text-lg">Join leading institutions using Zenthera for AMR surveillance.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((review, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/60 backdrop-blur-lg p-10 rounded-3xl shadow-lg border border-white/50 relative group hover:shadow-2xl transition-all"
              >
                <div className="text-purple-300 text-8xl absolute -top-8 left-4 font-serif opacity-30 group-hover:opacity-50 transition-opacity select-none">"</div>
                <p className="text-slate-700 italic mb-8 relative z-10 text-lg leading-relaxed antialiased font-light tracking-wide">{review.quote}</p>
                <div className="border-t border-slate-100 pt-6">
                  <div className="font-bold text-slate-900 text-lg">{review.author}</div>
                  <div className="text-sm text-purple-600 font-semibold tracking-wider uppercase">{review.role}</div>
                  <div className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-2">{review.org}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-300 py-20 px-4 md:px-8 relative z-40">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <h3 className="text-3xl font-black text-white tracking-tighter">Zenthera</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                AI-powered antimicrobial resistance prediction platform for modern healthcare and genomic research.
              </p>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
                  <span className="text-xs text-white font-bold">X</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
                  <span className="text-xs text-white font-bold">in</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Platform</h4>
              <ul className="space-y-4 text-sm font-light">
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-purple-400 transition-colors">Lab Dashboard</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-purple-400 transition-colors">Key Features</button></li>
                <li><button onClick={() => scrollToSection('workflow')} className="hover:text-purple-400 transition-colors">ML Workflow</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Resources</h4>
              <ul className="space-y-4 text-sm font-light">
                <li><a href="#" className="hover:text-purple-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Publications</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Contact</h4>
              <ul className="space-y-4 text-sm text-slate-400 font-light">
                <li className="flex items-center gap-3">
                  <span className="w-1 h-1 bg-purple-500 rounded-full" />
                  research@zenthera.ai
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1 h-1 bg-purple-500 rounded-full" />
                  support@zenthera.ai
                </li>
                <li className="pt-2 text-xs font-mono opacity-50">SAN FRANCISCO, CA</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-900 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-slate-500 font-mono">© 2024 ZENTHERA AI. BUILT FOR PRECISION MEDICINE.</p>
            <div className="flex gap-8 text-xs font-mono uppercase tracking-widest">
              <a href="#" className="hover:text-purple-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-shift {
          animation: gradient-shift 20s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
