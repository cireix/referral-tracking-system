# Authentication with Stack Auth

This project uses **Stack Auth** (integrated with Neon) for user authentication. The authentication is seamlessly integrated into the main application page, providing a smooth single-page experience. User data is automatically synced to your Neon Postgres database.

## 🚀 Features

- **Single-Page Authentication**: Sign up and sign in without page navigation
- **Protected Calculator**: Users must authenticate to access the calculator
- **OAuth Support**: Can be configured for Google, GitHub, and other providers
- **Database Sync**: User data automatically synced to `neon_auth.users_sync` table
- **Session Management**: Secure cookie-based sessions
- **User Dashboard**: View user information and manage account
- **Custom Styling**: Beautiful, modern UI with gradient effects and animations

## 📍 Authentication Flow

### Main Application (`/`)
The home page handles all authentication:
- **Unauthenticated users**: See the sign-in/sign-up form
- **Authenticated users**: Have full access to the calculator
- **Toggle between modes**: Switch between sign-in and sign-up without navigation

### Additional Routes
- `/dashboard` - User dashboard (protected, accessible for logged-in users)
- `/handler/[...stack]` - Stack Auth handler routes (automatic, handles OAuth callbacks)

## 🎨 UI Implementation

### Single-Page Experience
```tsx
// src/app/page.tsx
export default function Home() {
  const user = useUser();
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <div>
      {user ? (
        <Calculator />
      ) : (
        <div className="auth-container">
          {showSignUp ? <SignUp /> : <SignIn />}
          <button onClick={() => setShowSignUp(!showSignUp)}>
            {showSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### Custom Styling Features
- **Gradient backgrounds**: Blue → Purple → Pink gradient
- **Modern card design**: Rounded corners with shadow effects
- **Animated transitions**: Smooth hover and focus states
- **Custom form inputs**: Styled with Tailwind and custom CSS
- **Branded buttons**: Gradient submit buttons with hover animations

## 🔑 Environment Variables

Configure these in `.env.local`:

```env
# Stack Auth configuration
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key
STACK_SECRET_SERVER_KEY=your_secret_key

# Database connection (for Neon integration)
DATABASE_URL=your_neon_database_url
```

## 📊 Database Schema

Users are automatically synced to the `neon_auth.users_sync` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Unique user ID |
| `name` | TEXT | User's display name |
| `email` | TEXT | User's email address |
| `created_at` | TIMESTAMP | When the user was created |
| `updated_at` | TIMESTAMP | Last update time |
| `deleted_at` | TIMESTAMP | Soft delete timestamp |
| `raw_json` | JSONB | Full user data from Stack |

## 🔍 Querying Users

You can query users directly in your Neon database:

```sql
-- Get all users
SELECT * FROM neon_auth.users_sync;

-- Get a specific user
SELECT * FROM neon_auth.users_sync WHERE id = 'user_id';

-- Get users by email
SELECT * FROM neon_auth.users_sync 
WHERE raw_json->>'primary_email' = 'user@example.com';
```

## 💻 Using Authentication in Your App

### Client-Side Components

```tsx
import { useUser, UserButton } from '@stackframe/stack';

export default function MyComponent() {
  const user = useUser();
  
  if (user) {
    return (
      <div>
        Welcome, {user.displayName || user.primaryEmail}!
        <UserButton /> {/* Provides sign-out and account management */}
      </div>
    );
  }
  
  return <div>Please sign in to continue</div>;
}
```

### Server-Side Components

```tsx
import { stackServerApp } from '@/stack/server';

export default async function ServerComponent() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    // User is not authenticated
    return <div>Not authenticated</div>;
  }
  
  // User is authenticated
  return <div>User ID: {user.id}</div>;
}
```

### Protected Routes

```tsx
// Example: Protecting the dashboard
export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (!user) {
      router.push('/'); // Redirect to home for authentication
    }
  }, [user, router]);
  
  if (!user) return null;
  
  return <Dashboard user={user} />;
}
```

## 🎨 Styling Customization

The authentication components are styled using:

1. **Custom CSS Classes** (`src/app/globals.css`):
   - `.stack-auth-wrapper` - Container for Stack components
   - Form input styling with focus states
   - Button gradients and hover effects
   - Error/success message styling

2. **Tailwind CSS Classes**:
   - Responsive design utilities
   - Gradient backgrounds
   - Shadow and transition effects

3. **Component Structure**:
```tsx
<div className="stack-auth-wrapper">
  {showSignUp ? (
    <SignUp fullPage={false} automaticRedirect={false} />
  ) : (
    <SignIn fullPage={false} automaticRedirect={false} />
  )}
</div>
```

### Key Styling Features

- **Gradient Submit Buttons**: Purple to pink gradient with hover animations
- **Focus States**: Blue border with shadow on input focus
- **OAuth Button Styling**: Custom styles for Google, GitHub providers
- **Error Messages**: Red alerts with background highlighting
- **Success Messages**: Green confirmations with appropriate styling
- **Smooth Transitions**: All interactive elements have smooth animations

## 🔒 Security Features

- **Secure Sessions**: Cookie-based sessions with httpOnly flags
- **CSRF Protection**: Built-in CSRF token validation
- **Email Verification**: Optional email verification flow
- **Password Security**: Secure password hashing and validation
- **Protected Resources**: Calculator access requires authentication

## 🧪 Testing Authentication

1. **Access the Application**: Navigate to `/` (home page)
2. **Create Account**: Click "Sign up" toggle and create a new account
3. **Sign In**: Toggle to "Sign in" mode and authenticate
4. **Access Calculator**: After authentication, the calculator becomes available
5. **User Menu**: Use the UserButton component to sign out or manage account
6. **Dashboard**: Access `/dashboard` to view user information (when logged in)

## 🔄 Authentication State Management

The app uses Stack's hooks for authentication state:

```tsx
import { useUser } from '@stackframe/stack';

// Get current user
const user = useUser();

// Check authentication status
if (user) {
  // User is authenticated
  // Access to: user.displayName, user.primaryEmail, user.id
} else {
  // User needs to sign in
}
```

## 📚 Resources

- [Stack Auth Documentation](https://docs.stack-auth.com)
- [Stack Auth React Guide](https://docs.stack-auth.com/docs/sdk/react)
- [Neon Database Documentation](https://neon.tech/docs)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)

## 🤝 Support

For issues with:
- **Authentication Flow**: Check Stack Auth documentation
- **Database Sync**: Refer to Neon Auth integration docs
- **UI Customization**: See the custom CSS in `src/app/globals.css`
- **Application Logic**: Check the main implementation in `src/app/page.tsx` 