import React, { createContext, useContext, useState, useEffect } from 'react';
import { Business } from '../types';
import { apiRequest } from '../services/api';
import { useAuth } from './AuthContext';

interface BusinessContextType {
  businesses: Business[];
  activeBusiness: Business | null;
  setActiveBusiness: (business: Business) => void;
  loadBusinesses: () => Promise<void>;
  isLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusinessState] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBusinesses = async () => {
    if (!token) {
      setBusinesses([]);
      setActiveBusinessState(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiRequest<{ businesses: Business[] }>('/businesses');
      setBusinesses(res.businesses);

      const savedId = localStorage.getItem('multisolve_business_id');
      const found = res.businesses.find((b) => b.id === savedId) || res.businesses[0] || null;
      
      if (found) {
        setActiveBusinessState(found);
        localStorage.setItem('multisolve_business_id', found.id);
      }
    } catch (err) {
      console.error('Failed to load businesses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, [token]);

  const setActiveBusiness = (business: Business) => {
    setActiveBusinessState(business);
    localStorage.setItem('multisolve_business_id', business.id);
  };

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        setActiveBusiness,
        loadBusinesses,
        isLoading,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within a BusinessProvider');
  return context;
};
