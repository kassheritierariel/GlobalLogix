import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AgencyBranding {
  logoUrl?: string;
  primaryColor?: string;
}

interface AgencyContextType {
  branding: AgencyBranding;
  setBranding: React.Dispatch<React.SetStateAction<AgencyBranding>>;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export const AgencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<AgencyBranding>(() => {
    const saved = localStorage.getItem('agencyBranding');
    if (saved) return JSON.parse(saved);
    return {
      primaryColor: '#2563eb', // text-blue-600 / bg-blue-600 by default (approx)
    };
  });

  useEffect(() => {
    localStorage.setItem('agencyBranding', JSON.stringify(branding));
    
    // Apply CSS variables to root
    if (branding.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
    } else {
      document.documentElement.style.removeProperty('--primary-color');
    }
  }, [branding]);

  return (
    <AgencyContext.Provider value={{ branding, setBranding }}>
      {children}
    </AgencyContext.Provider>
  );
};

export const useAgency = () => {
  const context = useContext(AgencyContext);
  if (context === undefined) throw new Error('useAgency must be used within AgencyProvider');
  return context;
};
