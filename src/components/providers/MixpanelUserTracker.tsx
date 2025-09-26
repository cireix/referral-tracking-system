'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@stackframe/stack';
import { useMixpanel } from './MixpanelProvider';

export function MixpanelUserTracker() {
  const user = useUser();
  const mixpanel = useMixpanel();
  const lastUserIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (user) {
      // Only track login if this is a different user or first login
      if (lastUserIdRef.current !== user.id) {
        // User logged in or switched users
        mixpanel.trackLogin(user.id, {
          email: user.primaryEmail || undefined,
          name: user.displayName || undefined,
        });
        
        // Set user properties
        mixpanel.setUserProperties({
          userId: user.id,
          email: user.primaryEmail || undefined,
          name: user.displayName || undefined,
        });
        
        lastUserIdRef.current = user.id;
      }
    } else if (lastUserIdRef.current !== null) {
      // User logged out
      mixpanel.reset();
      lastUserIdRef.current = null;
    }
  }, [user, mixpanel]);
  
  return null; // This component doesn't render anything
} 