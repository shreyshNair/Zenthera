// src/components/LandingPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BacteriaBackground from './BacteriaBackground';

interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

const TRAIL_LENGTH = 20;

const LandingPage: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const trailHistory = useRef<TrailPoint[]>([]);
  const bacteriaContainerRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      // Add new point immediately
      trailHistory.current.unshift({ x: e.clientX, y: e.clientY, life: 1 });
      if (trailHistory.current.length > TRAIL_LENGTH) {
        trailHistory.current.pop();
      }
    };

    const animate = () => {
      // Fade trail points
      trailHistory.current = trailHistory.current
        .map((p) => ({ ...p, life: p.life - 0.04 }))
        .filter((p) => p.life > 0);

      // Update trail DOM elements directly (no React re-render)
      trailRefs.current.forEach((el, i) => {
        if (el && trailHistory.current[i]) {
          const point = trailHistory.current[i];
          const size = 250 * point.life; // Shrinking size as it fades
          el.style.left = `${point.x}px`;
          el.style.top = `${point.y}px`;
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.opacity = `${point.life * 0.6}`; // Max opacity 0.6
        } else if (el) {
          el.style.opacity = '0';
        }
      });

      // Update bacteria mask directly
      if (bacteriaContainerRef.current && trailHistory.current.length > 0) {
        const maskValue = trailHistory.current
          .map((p) => {
            const size = 180 * p.life;
            return `radial-gradient(circle ${size}px at ${p.x}px ${p.y}px, black ${80 * p.life}%, transparent 100%)`;
          })
          .join(', ');

        bacteriaContainerRef.current.style.maskImage = maskValue;
        bacteriaContainerRef.current.style.webkitMaskImage = maskValue;
      } else if (bacteriaContainerRef.current) {
        const hideMask = 'radial-gradient(circle 0px at 0px 0px, transparent 100%)';
        bacteriaContainerRef.current.style.maskImage = hideMask;
        bacteriaContainerRef.current.style.webkitMaskImage = hideMask;
      }

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden cursor-none bg-slate-50">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100 animate-gradient-shift"
        style={{ backgroundSize: '200% 200%' }} />

      {/* Grid Background - Subtle */}
      <div className="absolute inset-0 z-0 opacity-[0.08]"
        style={{
          backgroundSize: '30px 30px',
          backgroundImage: `linear-gradient(to right, #64748b 1px, transparent 1px),
                           linear-gradient(to bottom, #64748b 1px, transparent 1px)`,
        }}
      />

      {/* Floating Navigation Bar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-8 px-8 py-3 bg-opaque/70 backdrop-blur-md rounded-full shadow-lg border border-slate-200/50">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-slate-800 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
            Zenthera
          </span>
          <div className="h-4 w-px bg-slate-300" />
          <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-slate-600 hover:text-purple-700 transition-colors">
            Dashboard
          </button>
          <button className="text-sm font-medium text-slate-600 hover:text-purple-700 transition-colors">
            Analysis
          </button>
          <button className="text-sm font-medium text-slate-600 hover:text-purple-700 transition-colors">
            About
          </button>
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex items-center gap-2 text-xs text-purple-600 font-mono">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Active
          </div>
        </div>
      </nav>

      {/* Bacteria Layer - Only visible through mask (where purple trail is) */}
      <div
        ref={bacteriaContainerRef}
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          maskImage: 'radial-gradient(circle 0px at 0px 0px, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle 0px at 0px 0px, transparent 100%)',
          maskComposite: 'source-over',
          WebkitMaskComposite: 'source-over',
        }}
      >
        <BacteriaBackground />
      </div>

      {/* Purple Paint Trail - Visual effect only */}
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { trailRefs.current[i] = el; }}
          className="fixed pointer-events-none z-20 rounded-full"
          style={{
            left: -100,
            top: -100,
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, 
              rgba(139, 92, 246, 0.7) 0%, 
              rgba(167, 139, 250, 0.4) 40%, 
              transparent 70%)`,
            filter: 'blur(12px)',
            opacity: 0,
            willChange: 'transform, opacity, width, height',
          }}
        />
      ))}

      {/* Cursor Dot - Follows immediately */}
     
      {/* Content */}
      <div className="relative z-40 flex flex-col items-center justify-center h-full px-4">
        <div className={`text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

          {/* Title with Smooth Clip-path Reveal */}
          <h1 className="text-9xl md:text-[12rem] font-bold tracking-tighter mb-4 select-none relative overflow-hidden">
            <motion.span
              key="zenthera-reveal"
              initial={{ clipPath: 'inset(0 100% 0 0)', filter: 'blur(10px)', opacity: 0 }}
              animate={{ clipPath: 'inset(0 0% 0 0)', filter: 'blur(0px)', opacity: 1 }}
              transition={{ 
                duration: 2, 
                delay: 0.5,
                ease: [0.16, 1, 0.3, 1] // Custom quintic ease for ultra-smoothness
              }}
              className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-purple-600 to-slate-800 block leading-tight"
            >
              Zenthera
            </motion.span>
          </h1>

          <div className="relative inline-block mb-12">
            <p className="text-lg md:text-xl font-light tracking-[0.3em] uppercase select-none text-slate-500">
              AMR Prediction Model
            </p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
          </div>

          <div className="max-w-xl mx-auto backdrop-blur-sm bg-white/60 p-8 rounded-2xl border border-slate-200 shadow-lg mb-10">
            <p className="text-slate-600 text-base leading-relaxed">
              Advanced genomic analysis powered by machine learning.
              Upload bacterial sequences to predict antibiotic resistance patterns instantly.
            </p>
            <p className="mt-3 text-sm text-purple-600 font-medium">
              Move cursor to reveal specimens
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="group relative px-10 py-4 bg-white border border-slate-200 text-slate-800 rounded-full 
                     shadow-lg hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="relative z-10 flex items-center gap-3 font-medium">
              Enter Laboratory
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Discovery Mode</p>
          <div className="w-5 h-8 border border-slate-300 rounded-full flex justify-center pt-1.5">
            <div className="w-0.5 h-2 bg-purple-400 rounded-full animate-bounce" />
          </div>
        </div>
      </div>

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
