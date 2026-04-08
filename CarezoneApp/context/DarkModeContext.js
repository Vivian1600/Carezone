// context/DarkModeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const DarkModeContext = createContext();

export const DarkModeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load saved preference on startup
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = localStorage.getItem('carezone_theme');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // Use system preference if no saved preference
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('carezone_theme', newMode ? 'dark' : 'light');
  };

  const theme = {
    isDarkMode,
    toggleDarkMode,
    colors: {
      // Light Mode Colors
      light: {
        primary: '#667eea',
        secondary: '#764ba2',
        background: '#f5f5f5',
        cardBackground: '#ffffff',
        text: '#333333',
        textSecondary: '#666666',
        border: '#e0e0e0',
        accent: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
      },
      // Dark Mode Colors
      dark: {
        primary: '#8b9eff',
        secondary: '#9b6bcf',
        background: '#121212',
        cardBackground: '#1f1f1f',
        text: '#eeeeee',
        textSecondary: '#aaaaaa',
        border: '#333333',
        accent: '#66bb6a',
        error: '#f6685e',
        warning: '#ffb74d',
      },
    },
  };

  const currentColors = isDarkMode ? theme.colors.dark : theme.colors.light;

  return (
    <DarkModeContext.Provider value={{ ...theme, colors: currentColors }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};