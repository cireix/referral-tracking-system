# Mixpanel Analytics Integration

This application uses Mixpanel to track user behavior and key metrics for data-driven insights.

## 🚀 Setup

### 1. Get Mixpanel Token

1. Sign up for a [Mixpanel account](https://mixpanel.com)
2. Create a new project
3. Go to Project Settings → Project Token
4. Copy your project token

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Mixpanel Analytics
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_project_token

# Optional: Application version for tracking
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 📊 Events Tracked

### Authentication Events

| Event | Description | Properties |
|-------|-------------|------------|
| `User Signup` | Triggered when a new user signs up | `userId`, `email`, `name`, `referralCode` |
| `User Login` | Triggered when a user logs in | `userId`, `email`, `name`, `loginTime` |
| `User Logout` | Triggered when a user logs out | `userId` |

### Calculator Events

| Event | Description | Properties |
|-------|-------------|------------|
| `Calculator Equals Clicked` | Triggered when user performs a calculation (= button or Enter key) | `operation`, `result`, `inputMethod`, `previousValue`, `currentValue` |
| `Calculator Operation` | Triggered when user selects an operation | `operation`, `currentValue` |
| `Calculator Clear` | Triggered when user clears the calculator | `previousDisplay` |
| `Calculator Memory Used` | Triggered when user uses memory functions | `memoryAction`, `value` |

### Referral Events

| Event | Description | Properties |
|-------|-------------|------------|
| `Referral Link Generated` | When a user's referral link is created | `referralCode`, `userId` |
| `Referral Link Copied` | When user copies their referral link | `referralCode`, `referralUrl` |
| `Referral Code Captured` | When someone visits with a referral code | `referralCode`, `source` |
| `Referral Tracked` | When a referral is successfully tracked | `referralCode`, `referredId` |
| `Referral Completed` | When a referral signup is completed | `referrerId`, `referredId` |

### Onboarding Events

| Event | Description | Properties |
|-------|-------------|------------|
| `Onboarding Started` | When user starts the calculator tutorial | `userId`, `type` |
| `Onboarding Completed` | When user completes the tutorial | `userId`, `type`, `duration` |
| `Onboarding Step Viewed` | When user views a specific step | `step`, `stepName` |

### Page View Events

| Event | Description | Properties |
|-------|-------------|------------|
| `Page Viewed` | General page view tracking | `page_name`, `page_url`, `page_path` |
| `Dashboard Viewed` | When user views their dashboard | `userId` |

## 👤 User Properties

The following user properties are tracked and updated:

- `userId` - Unique user identifier
- `email` - User's email address
- `name` - User's display name
- `referralCode` - User's referral code
- `totalReferrals` - Count of successful referrals
- `onboardingCompleted` - Whether user completed onboarding
- `signupDate` - When the user signed up
- `total_calculations` - Running count of calculations performed

## 🔧 Implementation Details

### Mixpanel Service

The main service is located at `/src/lib/mixpanel.ts` and provides:

- Type-safe event tracking
- Automatic property enrichment
- User identification and property management
- Super properties for all events
- Time tracking for duration metrics

### Mixpanel Provider

The provider at `/src/components/providers/MixpanelProvider.tsx`:

- Initializes Mixpanel on app load
- Automatically tracks user login/logout
- Provides `useMixpanel` hook for components

### Usage Example

```tsx
import { useMixpanel } from '@/components/providers/MixpanelProvider';
import { MixpanelEvents } from '@/lib/mixpanel';

function MyComponent() {
  const mixpanel = useMixpanel();
  
  const handleAction = () => {
    // Track an event
    mixpanel.track(MixpanelEvents.FEATURE_USED, {
      feature: 'example_feature',
      value: 123
    });
    
    // Track with timing
    mixpanel.timeEvent('Long_Process');
    // ... do something
    mixpanel.track('Long_Process', { result: 'success' });
  };
  
  return <button onClick={handleAction}>Do Something</button>;
}
```

## 📈 Key Metrics to Monitor

### User Acquisition
- Daily/Weekly/Monthly Active Users
- Signup conversion rate
- Referral success rate

### Engagement
- Average calculations per user
- Calculator feature usage (memory, operations)
- Onboarding completion rate

### Retention
- User retention curves
- Feature adoption rates
- Session frequency and duration

### Referrals
- Viral coefficient (referrals per user)
- Referral conversion rate
- Top referrers

## 🔍 Debugging

### Development Mode
In development, all events are logged to the console with `[Mixpanel]` prefix.

### Testing Events
1. Open browser developer console
2. Look for `[Mixpanel]` logs
3. Check Network tab for `api.mixpanel.com` requests

### Common Issues

**Events not showing up in Mixpanel:**
- Check that `NEXT_PUBLIC_MIXPANEL_TOKEN` is set correctly
- Verify the token is from the correct project
- Events may take a few minutes to appear in Mixpanel

**User properties not updating:**
- Ensure user is identified with `mixpanel.identify()`
- Check that properties are being set after identification

## 🔐 Privacy Considerations

- No sensitive data (passwords, payment info) is tracked
- User IDs are used instead of personally identifiable information where possible
- Consider implementing user consent for analytics tracking
- Mixpanel respects Do Not Track browser settings

## 📚 Resources

- [Mixpanel Documentation](https://developer.mixpanel.com/docs)
- [Mixpanel JavaScript SDK](https://github.com/mixpanel/mixpanel-js)
- [Event Naming Best Practices](https://mixpanel.com/blog/event-naming-best-practices/)
- [Mixpanel Reports](https://help.mixpanel.com/hc/en-us/categories/115001224003-Reports) 