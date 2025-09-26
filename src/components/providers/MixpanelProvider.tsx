'use client';

import { createContext, useContext, useEffect } from 'react';
import mixpanelService from '@/lib/mixpanel';

interface MixpanelContextType {
  mixpanel: typeof mixpanelService;
}

const MixpanelContext = createContext<MixpanelContextType | undefined>(undefined);

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Mixpanel with your token
    const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    
    if (!mixpanelToken) {
      console.warn('Mixpanel token not found in environment variables. Add NEXT_PUBLIC_MIXPANEL_TOKEN to your .env.local file');
      return;
    }
    
    mixpanelService.initialize(mixpanelToken);
  }, []);

  return (
    <MixpanelContext.Provider value={{ mixpanel: mixpanelService }}>
      {children}
    </MixpanelContext.Provider>
  );
}

// Hook to use Mixpanel in components
export function useMixpanel() {
  const context = useContext(MixpanelContext);
  
  if (!context) {
    // Return a dummy service if provider is not set up
    // This prevents errors but won't track events
    console.warn('useMixpanel must be used within MixpanelProvider');
    return mixpanelService;
  }
  
  return context.mixpanel;
} 