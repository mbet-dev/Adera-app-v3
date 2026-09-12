# @adera/auth

Authentication package for Adera Hybrid App with Supabase integration.

## Features

- ✅ Email/Password authentication
- ✅ OTP/SMS verification
- ✅ Password reset functionality
- ✅ Session management with auto-refresh
- ✅ Role-based access control (RBAC)
- ✅ Demo mode for development
- ✅ User-friendly error messages
- ✅ TypeScript support

## Installation

This package is part of the Adera monorepo and is automatically installed with the workspace.

```bash
# From workspace root
pnpm install
```

## Usage

### 1. Wrap your app with AuthProvider

```jsx
import { AuthProvider } from '@adera/auth';

export default function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

### 2. Use the useAuth hook

```jsx
import { useAuth } from '@adera/auth';

function LoginScreen() {
  const { signIn, isLoading, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      await signIn('user@example.com', 'password123');
      // Navigate to home screen
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    // Your UI
  );
}
```

## API Reference

### useAuth Hook

Returns an object with the following properties and methods:

#### State Properties

- `session` - Current Supabase session object
- `user` - Current authenticated user
- `userProfile` - User profile from database (includes role, name, etc.)
- `authState` - Current authentication state (`LOADING`, `AUTHENTICATED`, `UNAUTHENTICATED`)
- `isAuthenticated` - Boolean indicating if user is authenticated
- `isLoading` - Boolean indicating if auth state is loading
- `isDemoMode` - Boolean indicating if running in demo mode
- `role` - Current user's role (`customer`, `partner`, `driver`, `staff`, `admin`)

#### Authentication Methods

##### signIn(email, password)
Sign in with email and password.

```jsx
const { signIn } = useAuth();

try {
  const { user } = await signIn('user@example.com', 'password123');
  console.log('Signed in:', user);
} catch (error) {
  console.error('Sign in failed:', error);
}
```

##### signUp(email, password, userData)
Create a new account.

```jsx
const { signUp } = useAuth();

try {
  const { user } = await signUp('user@example.com', 'password123', {
    first_name: 'John',
    last_name: 'Doe',
    role: 'customer',
  });
  console.log('Account created:', user);
} catch (error) {
  console.error('Sign up failed:', error);
}
```

##### signOut()
Sign out the current user.

```jsx
const { signOut } = useAuth();

try {
  await signOut();
  console.log('Signed out successfully');
} catch (error) {
  console.error('Sign out failed:', error);
}
```

##### updateProfile(updates)
Update user profile information.

```jsx
const { updateProfile } = useAuth();

try {
  const updatedProfile = await updateProfile({
    first_name: 'Jane',
    phone: '+251911234567',
  });
  console.log('Profile updated:', updatedProfile);
} catch (error) {
  console.error('Update failed:', error);
}
```

##### resetPassword(email)
Send password reset email.

```jsx
const { resetPassword } = useAuth();

try {
  await resetPassword('user@example.com');
  console.log('Password reset email sent');
} catch (error) {
  console.error('Reset failed:', error);
}
```

##### updatePassword(newPassword)
Update user's password (requires active session).

```jsx
const { updatePassword } = useAuth();

try {
  await updatePassword('newSecurePassword123');
  console.log('Password updated');
} catch (error) {
  console.error('Update failed:', error);
}
```

##### refreshSession()
Manually refresh the authentication session.

```jsx
const { refreshSession } = useAuth();

await refreshSession();
```

#### OTP Methods

##### sendOTP(phone)
Send OTP code to phone number.

```jsx
const { sendOTP } = useAuth();

try {
  await sendOTP('+251911234567');
  console.log('OTP sent');
} catch (error) {
  console.error('Failed to send OTP:', error);
}
```

##### verifyOTP(phone, token)
Verify OTP code.

```jsx
const { verifyOTP } = useAuth();

try {
  const { user } = await verifyOTP('+251911234567', '123456');
  console.log('OTP verified:', user);
} catch (error) {
  console.error('Verification failed:', error);
}
```

### useRoleCheck Hook

Provides role-based access control utilities.

```jsx
import { useRoleCheck } from '@adera/auth';

function AdminPanel() {
  const { isAdmin, canManageUsers } = useRoleCheck();

  if (!isAdmin()) {
    return <Text>Access Denied</Text>;
  }

  return (
    // Admin UI
  );
}
```

#### Methods

- `hasRole(role)` - Check if user has specific role
- `hasAnyRole(...roles)` - Check if user has any of the specified roles
- `hasAllRoles(...roles)` - Check if user has all specified roles
- `isCustomer()` - Check if user is a customer
- `isPartner()` - Check if user is a partner
- `isDriver()` - Check if user is a driver
- `isStaff()` - Check if user is staff
- `isAdmin()` - Check if user is admin
- `canAccessPTPFeatures()` - Check if user can access PTP features
- `canAccessShopFeatures()` - Check if user can access Shop features
- `canScanParcels()` - Check if user can scan parcels
- `canManageShop()` - Check if user can manage a shop
- `canViewAnalytics()` - Check if user can view analytics
- `canManageUsers()` - Check if user can manage users

### useAuthErrors Hook

Provides user-friendly error messages.

```jsx
import { useAuthErrors } from '@adera/auth';

function LoginScreen() {
  const { signIn } = useAuth();
  const { getErrorMessage } = useAuthErrors();
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      await signIn(email, password);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      {/* Login form */}
      {error && <Text style={styles.error}>{error}</Text>}
    </>
  );
}
```

#### Methods

- `getErrorMessage(error)` - Get user-friendly error message
- `isNetworkError(error)` - Check if error is network-related
- `isAuthError(error)` - Check if error is authentication-related

## User Roles

The package supports the following user roles:

- `customer` - Regular users who send/receive parcels and shop
- `partner` - Shop owners and dropoff/pickup point operators
- `driver` - Delivery drivers
- `staff` - Adera staff members
- `admin` - System administrators

## Demo Mode

The package includes a demo mode for development without a Supabase backend.

Demo mode is automatically enabled when `EXPO_PUBLIC_SUPABASE_URL` is not set in environment variables.

### Testing Different Roles in Demo Mode

Edit `packages/auth/src/AuthProvider.js`:

```javascript
// Line 66 - Change the role to test different user types
setUserProfile({
  id: 'demo-user',
  role: 'partner', // Change to: 'customer', 'partner', 'driver', 'staff', 'admin'
  first_name: 'Demo',
  last_name: 'User',
  email: 'demo@adera.et',
});
```

## Environment Variables

Required environment variables (set in `.env.local`):

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Error Handling

The package provides comprehensive error handling with user-friendly messages:

```jsx
import { useAuth, useAuthErrors } from '@adera/auth';

function LoginScreen() {
  const { signIn } = useAuth();
  const { getErrorMessage, isNetworkError } = useAuthErrors();

  const handleLogin = async () => {
    try {
      await signIn(email, password);
    } catch (error) {
      const message = getErrorMessage(error);
      
      if (isNetworkError(error)) {
        // Show network error UI
        Alert.alert('Network Error', message);
      } else {
        // Show general error
        Alert.alert('Login Failed', message);
      }
    }
  };
}
```

## Session Management

Sessions are automatically managed with:

- ✅ Persistent storage using AsyncStorage
- ✅ Auto-refresh tokens before expiry
- ✅ Session restoration on app restart
- ✅ Automatic cleanup on sign out

## Security Best Practices

1. **Never expose service role key** - Only use anon key in client
2. **Use HTTPS** - Always use secure connections
3. **Validate on server** - Don't trust client-side role checks alone
4. **Implement RLS** - Use Row Level Security in Supabase
5. **Rotate keys** - Regularly update API keys

## TypeScript Support

The package includes TypeScript definitions:

```typescript
import { UserRole, AuthState } from '@adera/auth';

const role: UserRole = 'customer';
const state: AuthState = AuthState.AUTHENTICATED;
```

## Testing

### Unit Tests

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Integration Tests

Test authentication flows in your app:

1. Enable demo mode
2. Test sign in/sign up flows
3. Test role-based navigation
4. Test session persistence

## Troubleshooting

### "Invalid login credentials" error

- Check that Supabase URL and anon key are correct
- Verify user exists in database
- Check password is correct

### Session not persisting

- Ensure AsyncStorage is properly installed
- Check storage permissions on device
- Verify Supabase client configuration

### Demo mode not working

- Check that `EXPO_PUBLIC_SUPABASE_URL` is not set
- Clear app data and restart
- Check console for demo mode message

## Contributing

This package is part of the Adera monorepo. Follow the project's contribution guidelines.

## License

Private - Adera Hybrid App

---

**Package Version**: 1.0.0  
**Last Updated**: 2025-01-11  
**Maintainer**: Adera Development Team
