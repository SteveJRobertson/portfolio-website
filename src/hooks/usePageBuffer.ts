import { useState, useEffect, useCallback } from 'react';
import { NOT_FOUND_PAGE, isValidPage } from '../content/registry';

interface UsePageBufferReturn {
  bufferText: string;
  currentPage: number;
  navigateToPage: (page: number) => void;
}

const getPageFromPath = (path: string): number => {
  const cleanPath = path.replace(/^\//, '').trim();
  if (!cleanPath || cleanPath === '100') return 100;
  const parsed = parseInt(cleanPath, 10);
  if (!isNaN(parsed) && isValidPage(parsed)) {
    return parsed;
  }
  return NOT_FOUND_PAGE;
};

export const usePageBuffer = (initialDefault = 100): UsePageBufferReturn => {
  // Parse initial page directly from window.location.pathname to prevent flash
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return getPageFromPath(window.location.pathname);
    }
    return initialDefault;
  });

  const [digits, setDigits] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const navigateToPage = useCallback((page: number) => {
    const targetPage = isValidPage(page) ? page : NOT_FOUND_PAGE;
    setCurrentPage(targetPage);
    setDigits([]);
    setIsTyping(false);
    
    // Sync browser URL history
    const pagePath = targetPage === 100 ? '/' : `/${targetPage}`;
    if (window.location.pathname !== pagePath) {
      window.history.pushState({ page: targetPage }, '', pagePath);
    }
  }, []);

  // Listen for browser Back/Forward popstate events
  useEffect(() => {
    const handlePopState = () => {
      const pageFromUrl = getPageFromPath(window.location.pathname);
      setCurrentPage(pageFromUrl);
      setDigits([]);
      setIsTyping(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global Keyboard listener for 0-9 digits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ignore system shortcuts like Cmd+1, Cmd+R, Ctrl+R
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      // Handle 0-9 digits
      if (/^[0-9]$/.test(e.key)) {
        setIsTyping(true);
        setDigits((prev) => {
          const nextDigits = [...prev, e.key];
          if (nextDigits.length === 3) {
            const pageNum = parseInt(nextDigits.join(''), 10);
            setTimeout(() => {
              navigateToPage(pageNum);
            }, 250);
          }
          return nextDigits.slice(0, 3);
        });
      }

      // Handle Escape to clear buffer
      if (e.key === 'Escape') {
        setDigits([]);
        setIsTyping(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToPage]);

  // Compute visual display text for header (e.g. "P100" or "P1--" or "P12-")
  let bufferText = `P${currentPage}`;
  if (isTyping && digits.length > 0) {
    const d1 = digits[0] || '-';
    const d2 = digits[1] || '-';
    const d3 = digits[2] || '-';
    bufferText = `P${d1}${d2}${d3}`;
  }

  return {
    bufferText,
    currentPage,
    navigateToPage,
  };
};
