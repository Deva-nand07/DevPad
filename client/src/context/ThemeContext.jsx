import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('devpad_theme');
    if (stored === 'light') setIsDark(false);
  }, []);

  useEffect(() => {
    // Only apply light-mode class when NOT on landing page
    const isLanding = window.location.pathname === '/';
    if (!isLanding) {
      document.body.classList.toggle('light-mode', !isDark);
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('devpad_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
