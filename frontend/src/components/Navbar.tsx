import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../utils/ThemeContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
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
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? 'bg-nav-bg backdrop-blur-md shadow-sm py-4 border-b border-border-main' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
            <span className="text-white font-bold text-xl">Z</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-text-primary">
            Zenthera<span className="text-brand-orange">AI</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="/how-it-works" className="text-sm font-medium text-text-secondary hover:text-brand-orange transition-colors">How it Works</a>
          <a href="/#section-about" className="text-sm font-medium text-text-secondary hover:text-brand-orange transition-colors">About Us</a>
          
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-bg-secondary text-text-secondary hover:text-brand-orange transition-all border border-border-main"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-brand-orange text-white rounded-full text-sm font-semibold hover:bg-brand-orange-dark transition-colors shadow-lg shadow-brand-orange/20"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <button 
            onClick={toggleTheme}
            className="p-2 text-text-secondary"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            className="text-text-primary"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-bg-primary border-t border-border-main overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              <a href="/how-it-works" className="text-lg font-medium text-text-primary" onClick={() => setIsMobileMenuOpen(false)}>How it Works</a>
              <a href="/#section-about" className="text-lg font-medium text-text-primary" onClick={() => setIsMobileMenuOpen(false)}>About Us</a>
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
