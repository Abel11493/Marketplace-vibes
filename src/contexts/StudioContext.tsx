import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { StudioConfig } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface StudioContextType {
  config: StudioConfig;
  updateConfig: (newConfig: Partial<StudioConfig>) => Promise<void>;
  loading: boolean;
}

const DEFAULT_CONFIG: StudioConfig = {
  id: 'site',
  theme: {
    primaryColor: '#6366f1', // Indigo 600
    secondaryColor: '#4f46e5', // Indigo 700
    accentColor: '#8b5cf6', // Violet 500
    borderRadius: '1rem',
    fontFamily: 'Inter, sans-serif',
    darkMode: false,
  },
  content: {
    heroTitle: 'MarketplaceVibes',
    heroSubtitle: 'La marketplace nouvelle génération pour vendre et acheter en toute confiance.',
    footerText: '© 2026 MarketplaceVibes. Tous droits réservés.',
    siteName: 'MarketplaceVibes',
  },
  customStyles: '',
  updatedAt: new Date().toISOString(),
};

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<StudioConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configRef = doc(db, 'config', 'site');
    const path = 'config/site';
    
    // Initial check/creation
    const initConfig = async () => {
      try {
        const snap = await getDoc(configRef);
        if (!snap.exists()) {
          // Only attempt to set if authenticated (admin check happens in rules)
          if (auth.currentUser) {
            await setDoc(configRef, DEFAULT_CONFIG);
          }
        }
      } catch (error) {
        // If it's a permission error, we might just be a non-admin user
        // We can ignore it here as the admin will eventually initialize it
        console.warn("Studio configuration initialization skipped or unauthorized.");
      }
    };
    initConfig();

    const unsubscribe = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as StudioConfig);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, []);

  // Inject custom styles
  useEffect(() => {
    let styleTag = document.getElementById('studio-custom-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'studio-custom-styles';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `
      :root {
        --studio-primary: ${config.theme.primaryColor};
        --studio-secondary: ${config.theme.secondaryColor};
        --studio-accent: ${config.theme.accentColor};
        --studio-radius: ${config.theme.borderRadius};
        --studio-font: ${config.theme.fontFamily};
      }
      body {
        font-family: var(--studio-font);
      }
      ${config.customStyles || ''}
    `;
  }, [config.theme, config.customStyles]);

  const updateConfig = async (newConfig: Partial<StudioConfig>) => {
    const configRef = doc(db, 'config', 'site');
    const path = 'config/site';
    try {
      const updated = {
        ...config,
        ...newConfig,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(configRef, updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return (
    <StudioContext.Provider value={{ config, updateConfig, loading }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}
