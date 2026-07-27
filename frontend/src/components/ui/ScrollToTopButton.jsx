import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Floating button that appears when scrolling down and smoothly scrolls to top on click.
 */
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 dark:from-amber-600 dark:to-yellow-500 text-white shadow-lg shadow-indigo-500/30 dark:shadow-amber-500/20 hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20 flex items-center justify-center cursor-pointer animate-in fade-in"
      title="Scroll to Top"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5 stroke-[2.5]" />
    </button>
  );
};

export default ScrollToTopButton;
