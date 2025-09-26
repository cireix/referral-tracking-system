import mixpanel from 'mixpanel-browser';

// Event types for type safety
export enum MixpanelEvents {
  // Authentication Events
  USER_SIGNUP = 'User Signup',
  USER_LOGIN = 'User Login',
  USER_LOGOUT = 'User Logout',
  
  // Calculator Events
  CALCULATOR_EQUALS_CLICKED = 'Calculator Equals Clicked',
  CALCULATOR_OPERATION = 'Calculator Operation',
  CALCULATOR_CLEAR = 'Calculator Clear',
  CALCULATOR_MEMORY_USED = 'Calculator Memory Used',
  
  // Referral Events
  REFERRAL_LINK_GENERATED = 'Referral Link Generated',
  REFERRAL_LINK_COPIED = 'Referral Link Copied',
  REFERRAL_COMPLETED = 'Referral Completed',
  REFERRAL_TRACKED = 'Referral Tracked',
  REFERRAL_CODE_CAPTURED = 'Referral Code Captured',
  
  // Onboarding Events
  ONBOARDING_STARTED = 'Onboarding Started',
  ONBOARDING_COMPLETED = 'Onboarding Completed',
  ONBOARDING_STEP_VIEWED = 'Onboarding Step Viewed',
  
  // Page View Events
  PAGE_VIEWED = 'Page Viewed',
  DASHBOARD_VIEWED = 'Dashboard Viewed',
  
  // Feature Usage
  FEATURE_USED = 'Feature Used',
}

// User properties interface
export interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  referralCode?: string;
  referredBy?: string;
  totalReferrals?: number;
  onboardingCompleted?: boolean;
  signupDate?: Date;
}

// Event properties interfaces
export interface CalculatorEventProperties {
  operation?: string;
  result?: string;
  inputMethod?: 'click' | 'keyboard';
  previousValue?: string;
  currentValue?: string;
  memoryAction?: string;
}

export interface ReferralEventProperties {
  referralCode?: string;
  referrerId?: string;
  referredId?: string;
  referralUrl?: string;
  source?: string;
  valid?: boolean;
  success?: boolean;
  totalReferrals?: number;
}

export interface OnboardingEventProperties {
  step?: number;
  stepName?: string;
  totalSteps?: number;
  timeSpent?: number;
}

class MixpanelService {
  private initialized = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private superProperties: Record<string, any> = {};
  
  constructor() {
    // Initialize will be called from the provider
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialize(token: string, config?: any) {
    if (this.initialized) {
      console.warn('Mixpanel already initialized');
      return;
    }
    
    if (!token) {
      console.error('Mixpanel token is required');
      return;
    }
    
    try {
      mixpanel.init(token, {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: true,
        persistence: 'localStorage',
        ip: true,
        ...config,
      });
      
      this.initialized = true;
      console.log('Mixpanel initialized successfully');
      
      // Set default super properties
      this.setSuperProperties({
        app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
        platform: 'web',
      });
    } catch (error) {
      console.error('Failed to initialize Mixpanel:', error);
    }
  }
  
  // Track an event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  track(event: MixpanelEvents | string, properties?: Record<string, any>) {
    if (!this.initialized) {
      console.warn('Mixpanel not initialized. Event not tracked:', event);
      return;
    }
    
    try {
      // Add timestamp to all events
      const enrichedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        ...this.superProperties,
      };
      
      mixpanel.track(event, enrichedProperties);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Mixpanel] Event tracked: ${event}`, enrichedProperties);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }
  
  // Identify a user
  identify(userId: string) {
    if (!this.initialized) {
      console.warn('Mixpanel not initialized. User not identified:', userId);
      return;
    }
    
    try {
      mixpanel.identify(userId);
      console.log(`[Mixpanel] User identified: ${userId}`);
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }
  
  // Set user properties
  setUserProperties(properties: UserProperties) {
    if (!this.initialized) {
      console.warn('Mixpanel not initialized. User properties not set');
      return;
    }
    
    try {
      mixpanel.people.set(properties);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Mixpanel] User properties set:', properties);
      }
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }
  
  // Increment a user property
  incrementUserProperty(property: string, value = 1) {
    if (!this.initialized) {
      console.warn('Mixpanel not initialized. User property not incremented');
      return;
    }
    
    try {
      mixpanel.people.increment(property, value);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Mixpanel] User property incremented: ${property} by ${value}`);
      }
    } catch (error) {
      console.error('Failed to increment user property:', error);
    }
  }
  
  // Set super properties (properties included with all events)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSuperProperties(properties: Record<string, any>) {
    if (!this.initialized) {
      console.warn('Mixpanel not initialized. Super properties stored for later');
      this.superProperties = { ...this.superProperties, ...properties };
      return;
    }
    
    try {
      mixpanel.register(properties);
      this.superProperties = { ...this.superProperties, ...properties };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Mixpanel] Super properties set:', properties);
      }
    } catch (error) {
      console.error('Failed to set super properties:', error);
    }
  }
  
  // Track user signup
  trackSignup(userId: string, properties?: UserProperties) {
    this.identify(userId);
    this.setUserProperties({
      ...properties,
      userId,
      signupDate: new Date(),
    });
    this.track(MixpanelEvents.USER_SIGNUP, properties);
    
    // Set user ID as super property for all future events
    this.setSuperProperties({ userId });
  }
  
  // Track user login
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackLogin(userId: string, properties?: Record<string, any>) {
    this.identify(userId);
    this.track(MixpanelEvents.USER_LOGIN, {
      ...properties,
      loginTime: new Date().toISOString(),
    });
    
    // Set user ID as super property for all future events
    this.setSuperProperties({ userId });
  }
  
  // Track calculator equals operation
  trackCalculatorEquals(properties: CalculatorEventProperties) {
    this.track(MixpanelEvents.CALCULATOR_EQUALS_CLICKED, properties);
    this.incrementUserProperty('total_calculations');
  }
  
  // Track referral events
  trackReferralEvent(eventType: MixpanelEvents, properties: ReferralEventProperties) {
    this.track(eventType, properties);
    
    // Increment referral count if it's a completed referral
    if (eventType === MixpanelEvents.REFERRAL_COMPLETED) {
      this.incrementUserProperty('total_referrals');
    }
  }
  
  // Track page view
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackPageView(pageName: string, properties?: Record<string, any>) {
    this.track(MixpanelEvents.PAGE_VIEWED, {
      page_name: pageName,
      page_url: window.location.href,
      page_path: window.location.pathname,
      ...properties,
    });
  }
  
  // Track time spent
  timeEvent(eventName: MixpanelEvents | string) {
    if (!this.initialized) {
      console.warn('Mixpanel not initialized. Time event not started:', eventName);
      return;
    }
    
    try {
      mixpanel.time_event(eventName);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Mixpanel] Time event started: ${eventName}`);
      }
    } catch (error) {
      console.error('Failed to start time event:', error);
    }
  }
  
  // Reset (for logout)
  reset() {
    if (!this.initialized) {
      return;
    }
    
    try {
      mixpanel.reset();
      // Clear user-specific super properties but keep non-user properties
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId, ...nonUserProperties } = this.superProperties;
      this.superProperties = nonUserProperties;
      
      console.log('[Mixpanel] Reset complete');
    } catch (error) {
      console.error('Failed to reset Mixpanel:', error);
    }
  }
  
  // Get distinct ID
  getDistinctId(): string | null {
    if (!this.initialized) {
      return null;
    }
    
    try {
      return mixpanel.get_distinct_id();
    } catch (error) {
      console.error('Failed to get distinct ID:', error);
      return null;
    }
  }
}

// Create singleton instance
const mixpanelService = new MixpanelService();

export default mixpanelService; 