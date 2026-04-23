import React from 'react';
import Navbar from './Navbar';
import { motion } from 'framer-motion';
import { FileText, Cpu, FlaskConical, Stethoscope, ChevronRight, Dna } from 'lucide-react';

const Reveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.6, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Data Ingestion',
      desc: 'Upload raw FASTA/FASTQ genomic sequences directly from sequencing machines. Our secure pipeline validates, normalizes, and prepares the data for high-throughput analysis.',
      icon: <FileText className="w-8 h-8 text-brand-orange" />
    },
    {
      num: '02',
      title: 'K-mer Tokenization',
      desc: 'The genomic sequence is fragmented into overlapping k-mers. We extract critical structural variants and translate them into a high-dimensional vector space using advanced NLP-inspired models.',
      icon: <Dna className="w-8 h-8 text-brand-orange" />
    },
    {
      num: '03',
      title: 'AI Prediction Engine',
      desc: 'Our proprietary ensemble models (Random Forest, XGBoost, and Deep Neural Networks) analyze the embeddings to detect known and novel Antimicrobial Resistance (AMR) signatures.',
      icon: <Cpu className="w-8 h-8 text-brand-orange" />
    },
    {
      num: '04',
      title: 'Clinical Actionability',
      desc: 'Results are compiled into a comprehensive, FDA-compliant clinical report. It highlights resistance profiles across 35+ antibiotics, empowering rapid and precise treatment decisions.',
      icon: <Stethoscope className="w-8 h-8 text-brand-orange" />
    }
  ];

  return (
    <div className="min-h-screen bg-bg-primary font-sans text-text-primary selection:bg-brand-orange/20 selection:text-brand-orange transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden bg-bg-primary border-b border-border-main">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-orange/[0.04] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-brand-orange/[0.03] rounded-full blur-[100px] pointer-events-none" />
        
        {/* Dotted grid */}
        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundSize: '40px 40px',
            backgroundImage: 'radial-gradient(circle, rgba(241,90,36,0.08) 1px, transparent 1px)',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange/10 rounded-full border border-brand-orange/20 mb-8">
              <FlaskConical className="w-4 h-4 text-brand-orange" />
              <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">The Pipeline</span>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tight text-text-primary">
              How <span className="text-brand-orange">Zenthera</span> works
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-xl text-text-secondary font-light leading-relaxed max-w-2xl mx-auto">
              We translate raw genomic sequences into life-saving clinical insights in minutes. Explore the technology powering the next generation of diagnostics.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Steps Section */}
      <section className="relative py-24 bg-bg-secondary overflow-hidden">
        {/* Orbs */}
        <div className="absolute top-[30%] left-[15%] w-[300px] h-[300px] bg-orange-200/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-brand-orange/[0.05] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
          <div className="space-y-24">
            {steps.map((step, index) => (
              <Reveal key={index} delay={0.1}>
                <div className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 md:gap-24 items-center`}>
                  
                  {/* Text Content */}
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl md:text-6xl font-display font-black text-text-muted/20">{step.num}</span>
                      <div className="h-px bg-border-main flex-1" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-text-primary">{step.title}</h2>
                    <p className="text-lg text-text-secondary font-light leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  {/* Graphic / Visual representation */}
                  <div className="flex-1 w-full">
                    <div className="relative aspect-square md:aspect-[4/3] rounded-3xl bg-bg-primary border border-border-main shadow-xl shadow-black/5 overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-brand-orange/5 rounded-2xl border border-brand-orange/10 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg shadow-brand-orange/5">
                        {step.icon}
                      </div>

                      {/* Decorative elements based on step */}
                      {index === 0 && (
                        <div className="absolute inset-0 pointer-events-none p-6">
                          <div className="w-full h-full border border-dashed border-border-main rounded-xl" />
                        </div>
                      )}
                      {index === 1 && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-12 opacity-20 text-text-muted">
                          <span className="font-mono text-xl">ATCG</span>
                          <span className="font-mono text-xl">GCTA</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative py-32 bg-bg-primary border-t border-border-main text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-orange/[0.08] rounded-full blur-[150px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <Reveal>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-text-primary">Ready to accelerate your analysis?</h2>
            <p className="text-text-secondary text-lg mb-10">Join leading clinical labs using Zenthera to decode resistance in minutes.</p>
            <a href="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-orange text-white rounded-full font-bold hover:bg-[#d64e1f] transition-all transform hover:-translate-y-1 shadow-lg shadow-brand-orange/25">
              Launch Dashboard <ChevronRight className="w-5 h-5" />
            </a>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
