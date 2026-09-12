# Technical Context - Adera Hybrid App

**Last Updated**: 2025-01-09  
**Tech Stack Version**: 1.0  
**Target Deployment**: Q2 2025

## Technology Stack

### **Frontend Framework**
- **React Native**: 0.81.4 (stable for production)
- **Expo SDK**: 54.x (managed workflow for faster development)
- **Platform Support**: iOS 13+, Android 8+, Web (PWA)
- **Build Tool**: EAS Build for production deployments

### **Backend Services**
- **Supabase**: PostgreSQL + Auth + Storage + Real-time
- **Database**: PostgreSQL 15+ with Row Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **File Storage**: Supabase Storage for images/documents
- **Real-time**: WebSocket channels for live updates

### **Payment Integration**
- **Primary**: Telebirr (Ethiopian mobile money)
- **Secondary**: Chapa (Ethiopian payment gateway)
- **Optional**: ArifPay (alternative gateway)
- **Fallback**: Cash on Delivery (COD) system

### **Maps & Location**
- **Base Maps**: OpenStreetMap (free, offline-capable)
- **React Native**: react-native-maps
- **Web Support**: Leaflet.js
- **Geocoding**: Nominatim (open source)

### **Development Tools**
- **Monorepo**: Turborepo for build orchestration
- **Package Manager**: pnpm (faster, more efficient)
- **Code Quality**: ESLint, Prettier, TypeScript
- **Testing**: Jest, React Native Testing Library, Detox

## Development Setup

### **Prerequisites**
```bash
# Required tools
Node.js >= 18.0.0
pnpm >= 8.0.0
Expo CLI
Android Studio (for Android development)
Xcode (for iOS development, macOS only)
```

### **Installation Steps**
```bash
# Clone repository
git clone https://github.com/mbet-dev/adera-hybrid-app.git
cd adera-hybrid-app

# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Run specific app
cd apps/adera-ptp
pnpm start
```

### **Environment Configuration**
```bash
# Required environment variables
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
TELEBIRR_API_KEY=your_telebirr_key
CHAPA_PUBLIC_KEY=your_chapa_key
QR_SECRET=your_qr_hash_secret
```

## Architecture Constraints

### **Performance Budget**
- **RAM Usage**: Maximum 150MB (Ethiopian device constraints)
- **App Size**: Target <50MB, maximum 100MB
- **Load Time**: <3 seconds on 3G networks
- **Frame Rate**: 60fps minimum for animations

### **Network Optimization**
- **3G Friendly**: Optimized for slow connections (64kbps minimum)
- **Offline First**: Critical functions work without internet
- **Data Efficiency**: Minimize API calls and image sizes
- **Progressive Loading**: Lazy load non-critical features

### **Device Compatibility**
- **Android**: Minimum API 26 (Android 8.0)
- **iOS**: Minimum iOS 13.0
- **RAM**: Minimum 2GB, optimized for 3GB
- **Storage**: Minimum 4GB free space

## Specific Technical Decisions

### **State Management**
```javascript
// Choice: Zustand over Redux Toolkit
// Reasoning: Simpler API, better TypeScript support, smaller bundle
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  login: async (credentials) => {
    // Implementation
  }
}));
```

### **Navigation**
```javascript
// Choice: React Navigation 6.x
// Reasoning: Best React Native navigation, Expo compatibility
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
```

### **UI Components**
```javascript
// Choice: React Native Paper 5.x
// Reasoning: Material 3 support, comprehensive components
import { PaperProvider } from 'react-native-paper';
```

### **Form Handling**
```javascript
// Choice: React Hook Form + Zod
// Reasoning: Performance, validation, TypeScript support
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
```

### **Date Handling**
```javascript
// Choice: date-fns over moment.js
// Reasoning: Tree-shakeable, smaller bundle size
import { format, parseISO } from 'date-fns';
```

## Database Schema

### **Core Tables**
```sql
-- Users with role-based access
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'customer',
  profile JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parcels with tracking
CREATE TABLE parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id TEXT UNIQUE NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  pickup_partner_id UUID REFERENCES users(id),
  dropoff_partner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event logging for tracking
CREATE TABLE parcel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID NOT NULL REFERENCES parcels(id),
  status INTEGER NOT NULL,
  actor_id UUID NOT NULL REFERENCES users(id),
  location POINT,
  notes TEXT,
  photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner shops
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  location POINT NOT NULL,
  operating_hours JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products for e-commerce
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Row Level Security Policies**
```sql
-- Users can only see their own data
CREATE POLICY users_own_data ON users 
  FOR ALL USING (auth.uid() = id);

-- Parcels visible to sender, recipient, assigned partners/drivers
CREATE POLICY parcels_visibility ON parcels
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() = pickup_partner_id OR
    auth.uid() = dropoff_partner_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('driver', 'staff', 'admin')
    )
  );
```

## Security Implementation

### **Authentication Flow**
```javascript
// Supabase Auth with custom claims
const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  
  // Get user role from profile
  const { data: profile } = await supabase
    .from('users')
    .select('role, profile')
    .eq('id', data.user.id)
    .single();
    
  return { user: data.user, profile };
};
```

### **QR Code Security**
```javascript
// HMAC-SHA256 based QR generation
import crypto from 'crypto';

const generateQRHash = (trackingId, phase, partnerId, timestamp) => {
  const payload = `${trackingId}|${phase}|${partnerId}|${timestamp}`;
  const secret = process.env.QR_SECRET;
  
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64')
    .substring(0, 8);
};

const verifyQRCode = (qrCode, expectedData) => {
  const [trackingId, phase, timestamp, hash] = qrCode.split('-');
  const expectedHash = generateQRHash(trackingId, phase, expectedData.partnerId, timestamp);
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'base64'),
    Buffer.from(expectedHash, 'base64')
  );
};
```

## Performance Optimizations

### **Bundle Optimization**
```javascript
// Metro configuration for tree shaking
module.exports = {
  transformer: {
    minifierConfig: {
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },
  },
  resolver: {
    alias: {
      'react-native-vector-icons': '@expo/vector-icons',
    },
  },
};
```

### **Image Optimization**
```javascript
// Expo Image with optimization
import { Image } from 'expo-image';

const OptimizedImage = ({ source, ...props }) => (
  <Image
    source={source}
    contentFit="cover"
    transition={200}
    cachePolicy="memory-disk"
    {...props}
  />
);
```

### **Offline Strategy**
```javascript
// AsyncStorage for offline data
import AsyncStorage from '@react-native-async-storage/async-storage';

const OfflineQueue = {
  async addOperation(operation) {
    const queue = await this.getQueue();
    queue.push({ ...operation, timestamp: Date.now() });
    await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
  },
  
  async processQueue() {
    const queue = await this.getQueue();
    // Process operations when online
  }
};
```

## Deployment Configuration

### **Expo Configuration**
```json
{
  "expo": {
    "name": "Adera",
    "slug": "adera-hybrid-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android", "web"],
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.adera.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2E7D32"
      },
      "package": "com.adera.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### **Build Configuration**
```json
{
  "build": {
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id",
        "ascAppId": "your-asc-app-id"
      },
      "android": {
        "serviceAccountKeyPath": "./android-service-account.json",
        "track": "production"
      }
    }
  }
}
```

## Development Constraints

### **Ethiopian Context**
- **Network**: Optimize for 3G (64kbps minimum)
- **Devices**: Support older Android devices (API 26+)
- **Payment**: Integrate local payment methods first
- **Language**: Amharic text rendering and RTL support

### **Business Logic**
- **Parcel Creation**: Requires payment before activation
- **QR Security**: Must rotate hashes at pickup points
- **Role Access**: Strict RLS for data security
- **Offline Support**: Critical functions work offline

### **Cultural Adaptation**
- **Color Scheme**: Ethiopian flag colors (green/gold/red)
- **UI Patterns**: Market-like interface design
- **Payment Flow**: Support for cash and bargaining culture
- **Trust Building**: Photo verification at each step
