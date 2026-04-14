// src/components/LandingPage.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
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
  
  return (
    <svg width={size * 3.5} height={size} viewBox="0 0 70 20">
      <rect x="3" y="4" width="18" height="12" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="25" y="4" width="18" height="12" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="47" y="4" width="18" height="12" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
};

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

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  index: number;
  zIndex?: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

const ParallaxSection: React.FC<ParallaxSectionProps> = ({ 
  children, 
  className, 
  zIndex = 10, 
  containerRef 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    container: containerRef,
    offset: ["start end", "end start"]
  });
  
  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100 });
  
  const y = useTransform(smoothProgress, [0, 1], [100, -100]);
  const opacity = useTransform(smoothProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.95, 1, 0.95]);
  const bgY = useTransform(smoothProgress, [0, 1], [-50, 50]);

  return (
    <div 
      ref={ref} 
      className={`relative min-h-screen w-full flex items-center justify-center ${className}`} 
      style={{ zIndex }}
    >
      <motion.div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ y: bgY }}
      >
        <div className="absolute -right-20 top-1/4 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30" />
        <div className="absolute -left-20 bottom-1/4 w-72 h-72 bg-slate-100 rounded-full blur-3xl opacity-40" />
      </motion.div>
      
      <motion.div 
        className="relative w-full"
        style={{ y, opacity, scale }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [mousePos, setMousePos] = useState({ x: -300, y: -300 });
  const [bacteria] = useState(() => generateBacteria(80));
  const [positions, setPositions] = useState<{ x: number; y: number; rotation: number }[]>([]);

  const { scrollYProgress } = useScroll({ container: containerRef });
  const smoothScroll = useSpring(scrollYProgress, { damping: 20, stiffness: 100 });
  
  const heroOpacity = useTransform(smoothScroll, [0, 0.12, 0.25], [1, 1, 0]);
  const heroScale = useTransform(smoothScroll, [0, 0.25], [1, 1.05]);
  const heroBlur = useTransform(smoothScroll, [0.1, 0.25], [0, 25]);
  const heroY = useTransform(smoothScroll, [0, 0.25], [0, -50]);

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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden bg-slate-50 snap-y snap-proximity scroll-smooth"
    >
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-fit">
        <div className="flex items-center gap-6 px-6 py-2.5 bg-white/40 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/40 ring-1 ring-black/5">
          <span 
            className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-indigo-800 to-slate-900 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap" 
            onClick={() => navigate('/')}
          >
            Zenthera
          </span>
          
          <div className="h-4 w-px bg-slate-400/30 mx-1" />
          
          <div className="flex items-center gap-1.5">
            {[
              { label: 'Dashboard', path: '/dashboard', type: 'link' },
              { label: 'Features', id: 'section-features', type: 'scroll' },
              { label: 'Analysis', id: 'section-workflow', type: 'scroll' },
              { label: 'About', id: 'section-about', type: 'scroll' }
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => item.type === 'link' ? navigate(item.path!) : scrollToSection(item.id!)} 
                className="px-4 py-1.5 text-[13px] font-medium text-slate-700 hover:text-purple-700 hover:bg-white/50 rounded-full transition-all active:scale-95"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-400/30 mx-1" />

          <div className="flex items-center gap-2 pl-1 pr-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Active</span>
          </div>
        </div>
      </nav>

      <motion.div 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos({ x: -300, y: -300 })}
        style={{ 
          opacity: heroOpacity, 
          filter: `blur(${heroBlur}px)`, 
          scale: heroScale,
          y: heroY
        }}
        className="sticky top-0 h-screen w-full overflow-hidden z-[20] bg-slate-50 snap-start"
      >
        <div className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundSize: '30px 30px',
            backgroundImage: `linear-gradient(to right, #64748b 1px, transparent 1px),
                             linear-gradient(to bottom, #64748b 1px, transparent 1px)`,
          }}
        />

        <div
          className="pointer-events-none fixed z-10 rounded-full mix-blend-multiply"
          style={{
            left: mousePos.x - torchRadius,
            top: mousePos.y - torchRadius,
            width: torchRadius * 2,
            height: torchRadius * 2,
            background: `radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, rgba(147, 51, 234, 0.05) 50%, transparent 70%)`,
          }}
        />

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
                className="absolute transition-opacity duration-300 text-purple-600 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]"
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

        <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center"
          >
            <h1 className="font-serif italic text-7xl md:text-9xl text-slate-800 text-center leading-none mb-6 pointer-events-auto">
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

        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-purple-400 rounded-full" />
          </div>
        </motion.div>
      </motion.div>

      <div id="section-about" className="relative bg-white snap-start z-[30]">
        <ParallaxSection zIndex={30} className="py-32" containerRef={containerRef}>
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
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
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-slate-100 rounded-3xl transform rotate-3 transition-transform group-hover:rotate-6" />
                <div className="relative bg-white/60 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-white/50 transition-transform group-hover:-translate-y-2">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="text-3xl font-bold text-slate-400 mb-1">48hrs</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-mono">Traditional</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl border-2 border-purple-100 hover:bg-purple-100 transition-colors">
                      <div className="text-3xl font-bold text-purple-600 mb-1">{'<2min'}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-mono">Zenthera</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="text-3xl font-bold text-slate-400 mb-1">85%</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-mono">Standard</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl border-2 border-purple-100 hover:bg-purple-100 transition-colors">
                      <div className="text-3xl font-bold text-purple-600 mb-1">94%</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-mono">Precision</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ParallaxSection>
      </div>

      <div id="section-features" className="relative bg-slate-50 snap-start z-[35]">
        <ParallaxSection zIndex={35} className="py-32" containerRef={containerRef}>
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Platform Features</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">Comprehensive genomic analysis tools designed for modern clinical and research environments.</p>
            </div>

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
                  <div className="mb-6 group-hover:scale-125 transition-transform duration-500">
                    <feature.icon />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-purple-600 transition-colors">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </ParallaxSection>
      </div>

      <div id="section-workflow" className="relative bg-white snap-start z-[40]">
        <ParallaxSection zIndex={40} className="py-32" containerRef={containerRef}>
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">How It Works</h2>
              <p className="text-slate-600 text-lg">Streamlined workflow from genomic data to clinical insights.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              <motion.div 
                className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                style={{ transformOrigin: "left" }}
              />
              
              {workflow.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.6 }}
                  className="relative z-10 text-center group"
                >
                  <div className="w-24 h-24 mx-auto bg-white/60 backdrop-blur-lg rounded-full border-4 border-slate-50 flex items-center justify-center mb-6 shadow-xl text-3xl font-bold text-purple-600 group-hover:scale-110 group-hover:border-purple-200 transition-all">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </ParallaxSection>
      </div>

      <div className="relative bg-gradient-to-br from-slate-50 to-purple-50/30 snap-start z-[45]">
        <ParallaxSection zIndex={45} className="py-32" containerRef={containerRef}>
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Trusted by Researchers</h2>
              <p className="text-slate-600 text-lg">Join leading institutions using Zenthera for AMR surveillance.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((review, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 50, rotateX: 10 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: idx * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  className="bg-white/60 backdrop-blur-lg p-10 rounded-3xl shadow-lg border border-white/50 relative group hover:shadow-2xl transition-all"
                  style={{ transformPerspective: 1000 }}
                >
                  <div className="text-purple-300 text-8xl absolute -top-8 left-4 font-serif opacity-30 group-hover:opacity-50 transition-opacity select-none">"</div>
                  <p className="text-slate-700 italic mb-8 relative z-10 text-lg leading-relaxed font-light">{review.quote}</p>
                  <div className="border-t border-slate-100 pt-6">
                    <div className="font-bold text-slate-900 text-lg">{review.author}</div>
                    <div className="text-sm text-purple-600 font-semibold tracking-wider uppercase">{review.role}</div>
                    <div className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-2">{review.org}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </ParallaxSection>
      </div>

      <div className="relative bg-slate-950 snap-start z-[50]">
        <ParallaxSection zIndex={50} className="py-20 text-slate-400" containerRef={containerRef}>
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-3 gap-12 border-b border-slate-800/50 pb-12 mb-8">
              <div>
                <div className="text-2xl font-bold text-white mb-4 tracking-tight">Zenthera</div>
                <p className="text-sm leading-relaxed max-w-xs text-slate-400">
                  Pioneering machine learning solutions for antimicrobial resistance tracking and prediction.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="text-white font-medium mb-4">Platform</h4>
                <button onClick={() => navigate('/dashboard')} className="text-sm hover:text-white transition-colors block w-full text-left">Analysis Dashboard</button>
                <button onClick={() => scrollToSection('section-features')} className="text-sm hover:text-white transition-colors block w-full text-left">Features</button>
                <button onClick={() => scrollToSection('section-about')} className="text-sm hover:text-white transition-colors block w-full text-left">About Us</button>
              </div>
              <div className="space-y-3">
                <h4 className="text-white font-medium mb-4">Company</h4>
                <div className="text-sm hover:text-white cursor-pointer transition-colors block">Documentation</div>
                <div className="text-sm hover:text-white cursor-pointer transition-colors block">API Reference</div>
                <div className="text-sm hover:text-white cursor-pointer transition-colors block">Privacy Policy</div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
              <p>© 2024 Zenthera AI. All rights reserved.</p>
              <div className="flex gap-4 mt-4 md:mt-0">
                <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
                <span className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
                <span className="hover:text-white cursor-pointer transition-colors">GitHub</span>
              </div>
            </div>
          </div>
        </ParallaxSection>
      </div>

    </div>
  );
};

export default LandingPage;
