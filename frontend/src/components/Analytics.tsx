import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, AlertTriangle, TrendingUp, BarChart3, Calendar, ChevronDown, Shield, Info } from 'lucide-react';
import Navbar from './Navbar';

// ── Hook for Responsive Canvas ───────────────────────────────────────────────
const useCanvasResize = (ref: React.RefObject<HTMLCanvasElement>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const observeTarget = ref.current?.parentElement;
    if (!observeTarget) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    resizeObserver.observe(observeTarget);
    return () => resizeObserver.disconnect();
  }, [ref]);

  return size;
};

// ── Premium Donut Chart ──────────────────────────────────────────────────────
interface DonutProps {
  segments: { value: number; color: string }[];
  size?: number;
}

const DonutChart: React.FC<DonutProps> = ({ segments, size = 180 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width } = useCanvasResize(canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const s = Math.min(size, width || size);
    canvas.width = s * dpr;
    canvas.height = s * dpr;
    canvas.style.width = s + 'px';
    canvas.style.height = s + 'px';
    ctx.scale(dpr, dpr);

    const cx = s / 2, cy = s / 2;
    const outerR = s * 0.42;
    const innerR = s * 0.28;
    const total = segments.reduce((acc, seg) => acc + seg.value, 0);
    let startAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, s, s);

    // Draw background track
    ctx.beginPath();
    ctx.arc(cx, cy, (outerR + innerR) / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = outerR - innerR;
    ctx.stroke();

    segments.forEach(seg => {
      const slice = (seg.value / total) * (Math.PI * 2);
      
      // Shadow/Glow effect for the slice
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = seg.color + '44';
      
      ctx.beginPath();
      ctx.arc(cx, cy, (outerR + innerR) / 2, startAngle + 0.05, startAngle + slice - 0.05);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = outerR - innerR;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();

      startAngle += slice;
    });

  }, [segments, size, width]);

  return <canvas ref={canvasRef} className="mx-auto" />;
};

// ── Premium Responsive Bar Chart ─────────────────────────────────────────────
interface BarData { label: string; value: number }

const BarChart: React.FC<{ data: BarData[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width } = useCanvasResize(canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = width || 600;
    const H = 280;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    const padL = 40, padR = 20, padT = 30, padB = 50;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const maxVal = 100;

    // Grid lines
    [0, 25, 50, 75, 100].forEach(v => {
      const y = padT + chartH - (v / 100) * chartH;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '500 10px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(v + '%', padL - 10, y + 4);
    });

    const step = chartW / data.length;
    const barW = Math.min(48, step * 0.6);

    data.forEach((d, i) => {
      const barH = (d.value / maxVal) * chartH;
      const x = padL + step * i + step / 2 - barW / 2;
      const y = padT + chartH - barH;

      // Glow under the bar
      const glow = ctx.createRadialGradient(x + barW / 2, y, 0, x + barW / 2, y, barW * 2);
      glow.addColorStop(0, '#F15A2411');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(x - barW, y - 20, barW * 3, barH + 40);

      // Actual Bar
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, '#F15A24');
      grad.addColorStop(0.4, '#F15A24');
      grad.addColorStop(1, '#F15A2444');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      const r = 8;
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barW, barH, [r, r, 0, 0]);
      } else {
        ctx.rect(x, y, barW, barH);
      }
      ctx.fill();

      // Value label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(d.value + '%', x + barW / 2, y - 10);

      // Bottom label
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '500 10px Inter';
      ctx.save();
      ctx.translate(x + barW / 2, H - padB + 15);
      if (W < 500) ctx.rotate(-Math.PI / 6);
      ctx.fillText(d.label, 0, 0);
      ctx.restore();
    });
  }, [data, width]);

  return <canvas ref={canvasRef} className="w-full" />;
};

// ── Data Mocks ───────────────────────────────────────────────────────────────
type TimeRange = 'Today' | 'Week' | 'Month' | 'Year';

const RANGE_DATA: Record<TimeRange, any> = {
  Today: {
    stats: [3, 12, 2, 45],
    dist: [{ value: 70, color: '#F15A24' }, { value: 20, color: '#FF7A45' }, { value: 10, color: '#D94A18' }],
    bars: [88, 82, 70, 65, 60, 55]
  },
  Week: {
    stats: [28, 84, 15, 312],
    dist: [{ value: 65, color: '#F15A24' }, { value: 25, color: '#FF7A45' }, { value: 10, color: '#D94A18' }],
    bars: [89, 84, 76, 71, 69, 65]
  },
  Month: {
    stats: [142, 425, 93, 1046],
    dist: [{ value: 62, color: '#F15A24' }, { value: 28, color: '#FF7A45' }, { value: 10, color: '#D94A18' }],
    bars: [92, 88, 80, 75, 72, 68]
  },
  Year: {
    stats: [1240, 5210, 842, 14205],
    dist: [{ value: 58, color: '#F15A24' }, { value: 30, color: '#FF7A45' }, { value: 12, color: '#D94A18' }],
    bars: [95, 90, 85, 80, 78, 70]
  }
};

const BAR_LABELS = ['Meropenem', 'Vancomycin', 'Gentamicin', 'Ciprofloxacin', 'Levofloxacin', 'Amoxicillin'];

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('Month');
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const data = RANGE_DATA[timeRange];

  const STATS_CONFIG = [
    { icon: Users,         label: 'New Patients',  color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
    { icon: FileText,      label: 'AMR Reports',   color: 'text-blue-400',     bg: 'bg-blue-500/10'     },
    { icon: AlertTriangle, label: 'Critical Cases',color: 'text-red-400',      bg: 'bg-red-500/10'      },
    { icon: TrendingUp,    label: 'Resistant Found',color: 'text-emerald-400', bg: 'bg-emerald-500/10'  },
  ];

  return (
    <div className="min-h-screen bg-bg-primary selection:bg-brand-orange selection:text-white">
      <Navbar variant="dashboard" />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-6 sm:w-8 h-0.5 bg-brand-orange rounded-full" />
              <span className="text-[9px] sm:text-[10px] font-black tracking-[0.3em] text-brand-orange uppercase">Intelligence Hub</span>
            </div>
            <h1 className="font-display italic text-5xl sm:text-6xl lg:text-7xl font-bold text-text-primary tracking-tight">
              Analytics
            </h1>
          </motion.div>

          <div className="relative">
            <button 
              onClick={() => setIsRangeOpen(!isRangeOpen)}
              className="flex items-center gap-3 px-6 py-3.5 bg-bg-secondary/50 backdrop-blur-xl border border-white/5 rounded-2xl text-sm font-bold text-text-primary hover:border-brand-orange/40 transition-all shadow-xl group"
            >
              <Calendar className="w-4 h-4 text-brand-orange group-hover:scale-110 transition-transform" />
              <span>{timeRange} View</span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-300 ${isRangeOpen ? 'rotate-180 text-brand-orange' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isRangeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-52 bg-bg-secondary/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                >
                  {(['Today', 'Week', 'Month', 'Year'] as TimeRange[]).map(r => (
                    <button
                      key={r}
                      onClick={() => { setTimeRange(r); setIsRangeOpen(false); }}
                      className={`w-full text-left px-6 py-4 text-sm font-bold transition-all flex items-center justify-between group ${timeRange === r ? 'bg-brand-orange/10 text-brand-orange' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'}`}
                    >
                      {r}
                      {timeRange === r && <div className="w-1.5 h-1.5 rounded-full bg-brand-orange shadow-[0_0_10px_#F15A24]" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {STATS_CONFIG.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 100 }}
              className="bg-bg-secondary/40 backdrop-blur-sm border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 group relative overflow-hidden"
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 ${s.bg} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 ring-1 ring-white/5 group-hover:ring-brand-orange/20 transition-all`}>
                <s.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${s.color}`} />
              </div>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={data.stats[i]}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-1 sm:mb-2 tracking-tighter"
                >
                  {data.stats[i].toLocaleString()}
                </motion.p>
              </AnimatePresence>
              <p className="text-[9px] sm:text-[10px] font-black tracking-[0.15em] sm:tracking-[0.2em] text-text-muted uppercase opacity-60 leading-tight">{s.label}</p>
              
              {/* Subtle Decorative Elements */}
              <div className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <TrendingUp className={`w-4 h-4 ${s.color}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          
          {/* Donut Block (1/3) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1 bg-bg-secondary/40 backdrop-blur-md border border-white/5 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 relative overflow-hidden group"
          >
            {/* Background Mesh Gradient */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,#F15A24_0%,transparent_50%),radial-gradient(circle_at_80%_70%,#D94A18_0%,transparent_50%)]" />
            
            <div className="relative z-10">
              <div className="mb-8 sm:mb-10 text-center lg:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight">Resistance Profile</h3>
                <p className="text-[10px] sm:text-xs text-text-muted uppercase font-bold tracking-widest mt-1 sm:mt-2">Genomic Metadata Analysis</p>
              </div>

              <div className="relative mb-8 sm:mb-12 max-w-[200px] mx-auto">
                <DonutChart segments={data.dist} size={200} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-bg-primary/50 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center mb-1">
                    <Shield className="w-5 h-5 text-brand-orange" />
                  </div>
                  <span className="text-sm font-black text-text-primary tracking-widest uppercase">Secured</span>
                </div>
              </div>

              <div className="space-y-5">
                {['Resistant', 'Intermediate', 'Susceptible'].map((l, idx) => (
                  <div key={l} className="group/item cursor-default">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ background: data.dist[idx].color, boxShadow: `0 0 10px ${data.dist[idx].color}44` }} />
                        <span className="text-sm font-bold text-text-secondary group-hover/item:text-text-primary transition-colors">{l}</span>
                      </div>
                      <span className="text-sm font-black text-text-primary">{data.dist[idx].value}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${data.dist[idx].value}%` }}
                        transition={{ duration: 1, ease: 'circOut' }}
                        className="h-full rounded-full"
                        style={{ background: data.dist[idx].color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Bar Chart Block (2/3) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-bg-secondary/40 backdrop-blur-md border border-white/5 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 relative overflow-hidden group"
          >
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scale-150" />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/[0.03] to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-start sm:items-center justify-between mb-8 sm:mb-12">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-text-primary">Diagnostic Trends</h3>
                  <p className="text-[10px] sm:text-xs text-text-muted uppercase font-bold tracking-widest mt-1 sm:mt-2">Susceptibility % by Antibiotic</p>
                </div>
                <div className="p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl hover:bg-white/10 transition-colors cursor-help">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted" />
                </div>
              </div>

              <div className="w-full">
                <BarChart data={BAR_LABELS.map((label, i) => ({ label, value: data.bars[i] }))} />
              </div>
            </div>
          </motion.div>

        </div>

        {/* Organisms Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-bg-secondary/20 border border-white/5 rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-12 overflow-hidden relative"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="flex items-center gap-3 sm:gap-4">
               <div className="w-1.5 sm:w-2 h-8 sm:h-10 bg-brand-orange rounded-full shadow-[0_0_20px_#F15A2466]" />
               <h4 className="text-2xl sm:text-3xl font-bold text-text-primary italic font-display">Pathogen Detection</h4>
            </div>
            <div className="text-[10px] sm:text-xs text-text-muted font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/5 w-fit">
              Live updates every 60s
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-6">
            {[
              { name: 'S. Aureus', count: 68 },
              { name: 'P. Mirabilis', count: 58 },
              { name: 'P. Aeruginosa', count: 55 },
              { name: 'S. Pneumoniae', count: 52 },
              { name: 'E. Coli', count: 52 },
            ].map((org, i) => (
              <motion.div
                key={org.name}
                whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                className="bg-bg-primary/40 border border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center transition-all relative group flex flex-col justify-center"
              >
                <p className="text-3xl sm:text-4xl font-bold text-brand-orange mb-1 sm:mb-2 group-hover:scale-110 transition-transform">{org.count}</p>
                <p className="text-[9px] sm:text-[10px] font-black tracking-[0.1em] text-text-muted uppercase leading-tight">{org.name}</p>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-orange/0 group-hover:bg-brand-orange transition-all duration-500 rounded-t-full" />
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
};

export default Analytics;
