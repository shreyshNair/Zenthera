import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../utils/ThemeContext';

interface NavbarProps {
  /** 'landing' = public links (How it Works, About Us)
   *  'dashboard' = app links (Patients, Analytics, Reports) */
  variant?: 'landing' | 'dashboard';
}

const Navbar: React.FC<NavbarProps> = ({ variant = 'landing' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const linkCls = (path: string) =>
    `text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-brand-orange'
        : 'text-text-secondary hover:text-brand-orange'
    }`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled || variant === 'dashboard'
          ? 'bg-nav-bg backdrop-blur-md shadow-sm py-4 border-b border-border-main'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
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
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {variant === 'landing' ? (
            <>
              <a href="/how-it-works" className={linkCls('/how-it-works')}>How it Works</a>
              <a href="/patients"     className={linkCls('/patients')}>Patients</a>
              <a href="/analytics"    className={linkCls('/analytics')}>Analytics</a>
              <a href="/#section-about" className="text-sm font-medium text-text-secondary hover:text-brand-orange transition-colors">About Us</a>
            </>
          ) : (
            <>
              <a href="/how-it-works" className={linkCls('/how-it-works')}>How it Works</a>
              <a href="/patients"     className={linkCls('/patients')}>Patients</a>
              <a href="/analytics"    className={linkCls('/analytics')}>Analytics</a>
              <a href="/reports"      className={linkCls('/reports')}>Reports</a>
            </>
          )}

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-bg-secondary text-text-secondary hover:text-brand-orange transition-all border border-border-main"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {variant === 'dashboard' ? (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-text-secondary hover:text-brand-orange border border-border-main hover:border-brand-orange/40 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-brand-orange text-white rounded-full text-sm font-semibold hover:bg-brand-orange-dark transition-colors shadow-lg shadow-brand-orange/20"
            >
              Go to Dashboard
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <button onClick={toggleTheme} className="p-2 text-text-secondary">
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
            <div className="px-6 py-8 flex flex-col gap-5">
              <a href="/how-it-works" className="text-lg font-medium text-text-primary" onClick={() => setIsMobileMenuOpen(false)}>How it Works</a>
              <a href="/patients"     className="text-lg font-medium text-text-primary" onClick={() => setIsMobileMenuOpen(false)}>Patients</a>
              <a href="/analytics"    className="text-lg font-medium text-text-primary" onClick={() => setIsMobileMenuOpen(false)}>Analytics</a>

              {variant === 'dashboard' ? (
                <>
                  <a href="/patients"  className="text-lg font-medium text-text-primary" onClick={() => setIsMobileMenuOpen(false)}>Patients</a>
                  <a href="/analytics" className="text-lg font-medium text-text-primary" onClick={() => setIsMobileMenuOpen(false)}>Analytics</a>
                  <a href="/reports"   className="text-lg font-medium text-text-primary" onClick={() => setIsMobileMenuOpen(false)}>Reports</a>
                  <button
                    onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
                    className="flex items-center gap-2 text-lg font-medium text-text-secondary"
                  >
                    <LogOut className="w-5 h-5" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <a href="/#section-about" className="text-lg font-medium text-text-primary" onClick={() => setIsMobileMenuOpen(false)}>About Us</a>
                  <button
                    onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
                    className="w-full py-4 bg-brand-orange text-white rounded-xl font-bold"
                  >
                    Go to Dashboard
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
