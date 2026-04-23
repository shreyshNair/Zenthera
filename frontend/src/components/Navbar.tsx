import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
            <span className="text-white font-bold text-xl">Z</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Zenthera<span className="text-brand-orange">AI</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="/how-it-works" className="text-sm font-medium text-slate-600 hover:text-brand-orange transition-colors">How it Works</a>
          <a href="/#section-about" className="text-sm font-medium text-slate-600 hover:text-brand-orange transition-colors">About Us</a>
          <a href="/#section-news" className="text-sm font-medium text-slate-600 hover:text-brand-orange transition-colors">Resources</a>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-brand-orange text-white rounded-full text-sm font-semibold hover:bg-[#d64e1f] transition-colors shadow-lg shadow-brand-orange/20"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-slate-900"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              <a href="/how-it-works" className="text-lg font-medium text-slate-900" onClick={() => setIsMobileMenuOpen(false)}>How it Works</a>
              <a href="/#section-about" className="text-lg font-medium text-slate-900" onClick={() => setIsMobileMenuOpen(false)}>About Us</a>
              <a href="/#section-news" className="text-lg font-medium text-slate-900" onClick={() => setIsMobileMenuOpen(false)}>Resources</a>
              <button 
                onClick={() => {
                  navigate('/dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-4 bg-brand-orange text-white rounded-xl font-bold"
              >
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
