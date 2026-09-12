import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export async function clearAuthState() {
  try {
    // Clear all auth-related storage
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Web: Clear localStorage auth items
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('@supabase.auth.') || key?.includes('@adera/profile/')) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage
      if (window.sessionStorage) {
        sessionStorage.clear();
      }
    } else {
      // React Native: Clear AsyncStorage auth items
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => 
        key.includes('@supabase.auth.') || 
        key.includes('@adera/profile/')
      );
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('[clearAuthState] Error:', error);
    return { success: false, error };
  }
}