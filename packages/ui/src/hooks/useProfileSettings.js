import { useState } from 'react';
import { Alert, Modal, View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useAuth } from '@adera/auth';
import { usePreferences } from '@adera/preferences';
import { useTheme } from '../ThemeProvider';

export const useProfileSettings = (roleType = 'customer') => {
  const { user: authUser, signOut } = useAuth();
  const theme = useTheme();
  const { 
    themeMode, 
    setThemeMode, 
    language, 
    setLanguage, 
    biometricEnabled, 
    enableBiometrics, 
    disableBiometrics 
  } = usePreferences();

  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [locationTracking, setLocationTracking] = useState(roleType === 'driver');
  const [shopOpen, setShopOpen] = useState(roleType === 'partner');
  const [autoAcceptParcels, setAutoAcceptParcels] = useState(false);
  const [isThemeModalVisible, setThemeModalVisible] = useState(false);
  const [isLangModalVisible, setLangModalVisible] = useState(false);

  const handleThemeModeChange = () => {
    setThemeModalVisible(true);
  };

  const handleLanguageChange = () => {
    setLangModalVisible(true);
  };

  const handleBiometricToggle = async (enabled) => {
    if (enabled) {
      const result = await enableBiometrics();
      if (!result.success) {
        let message = 'Failed to enable biometrics';
        let title = 'Biometric Setup';
        
        if (Platform.OS === 'web') {
          title = 'Not Available on Web';
          message = 'Biometric authentication is only available on iOS and Android. Please use the native mobile app to enable this feature.';
        } else if (result.error === 'hardware_unavailable') {
          message = 'This device does not have biometric hardware (fingerprint or face recognition).';
        } else if (result.error === 'not_enrolled') {
          message = 'No biometrics are enrolled on this device. Please set up fingerprint or face unlock in your device settings first.';
        } else if (result.error === 'authentication_failed') {
          message = 'Biometric authentication was not successful. Please try again.';
        }
        
        Alert.alert(title, message);
      } else {
        Alert.alert('Success', 'Biometric login has been enabled successfully!');
      }
    } else {
      await disableBiometrics();
    }
  };

  const handleSignOut = () => {
    console.log('[ProfileScreen] handleSignOut: Starting sign out');
    
    if (Platform.OS === 'web') {
      // On web, skip confirmation for smoother experience
      signOutUser();
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: signOutUser,
          },
        ],
        { cancelable: true }
      );
    }
  };

  const signOutUser = async () => {
    try {
      // Clear any pending profile fetches before signing out
      if (typeof window !== 'undefined') {
        window._profileFetchAborted = true;
      }
      
      const result = await signOut();
      
      // signOut now returns { success: boolean, error?: string }
      if (result && !result.success) {
        const errorMessage = result.error || 'Failed to sign out. Please try again.';
        if (Platform.OS !== 'web') {
          Alert.alert('Sign Out Failed', errorMessage);
        }
        return; // Don't proceed if sign out failed
      }
      
      // Sign out was successful (or result is undefined for backward compatibility)
      // The auth state change will handle navigation
    } catch (error) {
      console.error('[ProfileScreen] handleSignOut: Error during sign out:', error);
      const errorMessage = error?.message || 'Failed to sign out. Please try again.';
      if (Platform.OS !== 'web') {
        Alert.alert('Sign Out Error', errorMessage);
      }
    }
  };

  const commonMenuItems = [
    {
      section: 'Preferences',
      items: [
        {
          id: 'theme',
          label: 'Theme Mode',
          icon: 'theme-light-dark',
          value: themeMode === 'system' ? 'System Default' : themeMode === 'light' ? 'Light Mode' : 'Dark Mode',
          onPress: handleThemeModeChange,
        },
        {
          id: 'language',
          label: 'Language',
          icon: 'translate',
          value: language === 'en' ? 'English' : 'አማርኛ',
          onPress: handleLanguageChange,
        },
        {
          id: 'biometric',
          label: 'Biometric Login',
          icon: 'fingerprint',
          type: 'switch',
          value: biometricEnabled,
          onToggle: handleBiometricToggle,
        },
        {
          id: 'notifications',
          label: 'Push Notifications',
          icon: 'bell',
          type: 'switch',
          value: notifications,
          onToggle: setNotifications,
        },
      ],
    },
    {
      section: 'Support',
      items: [
        {
          id: 'help',
          label: 'Help & Support',
          icon: 'help-circle',
          onPress: () => Alert.alert('Help', 'Help center coming soon'),
        },
        {
          id: 'terms',
          label: 'Terms & Conditions',
          icon: 'file-document',
          onPress: () => Alert.alert('Terms', 'Terms & conditions coming soon'),
        },
        {
          id: 'privacy',
          label: 'Privacy Policy',
          icon: 'shield-check',
          onPress: () => Alert.alert('Privacy', 'Privacy policy coming soon'),
        },
        {
          id: 'about',
          label: 'About Adera',
          icon: 'information',
          onPress: () => Alert.alert('About', `Version 1.0.0\n© 2025 Adera PTP`),
        },
      ],
    },
  ];

  const getRoleSpecificStats = () => {
    const baseStats = [
      {
        label: 'Member Since',
        value: new Date(authUser?.created_at).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        icon: 'calendar',
      },
    ];

    switch (roleType) {
      case 'customer':
        return [
          {
            label: 'Parcels',
            value: '12',
            icon: 'package-variant',
          },
          ...baseStats,
        ];
      case 'driver':
        return [
          {
            label: 'Rating',
            value: '4.9 ★',
            icon: 'star',
          },
          {
            label: 'Deliveries',
            value: '1,243',
            icon: 'package-variant-closed',
          },
          ...baseStats,
        ];
      case 'partner':
        return [
          {
            label: 'Rating',
            value: '4.7 ★',
            icon: 'star',
          },
          {
            label: 'Parcels Handled',
            value: '856',
            icon: 'package-variant',
          },
          {
            label: 'Shop Items',
            value: '23',
            icon: 'store',
          },
        ];
      default:
        return baseStats;
    }
  };

  const getRoleSpecificMenuItems = () => {
    const roleSpecificItems = {
      customer: [
        {
          section: 'Account',
          items: [
            {
              id: 'edit-profile',
              label: 'Edit Profile',
              icon: 'account-edit',
              onPress: () => Alert.alert('Coming Soon', 'Profile edit feature coming soon'),
            },
            {
              id: 'wallet',
              label: 'Wallet & Payments',
              icon: 'wallet',
              onPress: () => Alert.alert('Coming Soon', 'Wallet management coming soon'),
            },
            {
              id: 'addresses',
              label: 'Saved Addresses',
              icon: 'map-marker',
              onPress: () => Alert.alert('Coming Soon', 'Address management coming soon'),
            },
          ],
        },
      ],
      driver: [
        {
          section: 'Vehicle & Documents',
          items: [
            { id: 'vehicle-info', label: 'Vehicle Information', icon: 'car-info', onPress: () => Alert.alert('Coming Soon', 'Vehicle info management coming soon') },
            { id: 'driving-license', label: 'Driving License', icon: 'card-account-details', onPress: () => Alert.alert('Coming Soon', 'License management coming soon') },
            { id: 'insurance', label: 'Insurance Details', icon: 'shield-car', onPress: () => Alert.alert('Coming Soon', 'Insurance management coming soon') },
          ],
        },
      ],
      partner: [
        {
          section: 'Business Settings',
          items: [
            { id: 'shop-status', label: 'Shop Open Status', icon: 'store-check', type: 'switch', value: shopOpen, onToggle: setShopOpen },
            { id: 'auto-accept', label: 'Auto-Accept Parcels', icon: 'package-check', type: 'switch', value: autoAcceptParcels, onToggle: setAutoAcceptParcels },
            { id: 'payment-methods', label: 'Payment Methods', icon: 'bank', onPress: () => Alert.alert('Coming Soon', 'Payment methods coming soon') },
            { id: 'operating-hours', label: 'Operating Hours', icon: 'clock-outline', onPress: () => Alert.alert('Coming Soon', 'Operating hours coming soon') },
          ],
        },
      ],
    };

    return [...(roleSpecificItems[roleType] || []), ...commonMenuItems];
  };

  const ThemeSelectModal = () => (
    <Modal visible={isThemeModalVisible} transparent animationType="fade" onRequestClose={() => setThemeModalVisible(false)}>
      <TouchableOpacity 
        style={modalStyles.overlay} 
        activeOpacity={1} 
        onPress={() => setThemeModalVisible(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[modalStyles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text style={[modalStyles.modalTitle, { color: theme.colors.text.primary }]}>Choose a Theme</Text>
          {['system', 'light', 'dark'].map(mode => (
            <TouchableOpacity
              key={mode}
              onPress={() => { setThemeMode(mode); setThemeModalVisible(false); }}
              style={[
                modalStyles.option,
                { backgroundColor: themeMode === mode ? theme.colors.primaryContainer : 'transparent' }
              ]}
            >
              <Text style={[
                modalStyles.optionText,
                { 
                  color: themeMode === mode ? theme.colors.primary : theme.colors.text.primary,
                  fontWeight: themeMode === mode ? 'bold' : 'normal' 
                }
              ]}>
                {mode === 'system' ? 'System Default' : mode.charAt(0).toUpperCase() + mode.slice(1) + ' Mode'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            onPress={() => setThemeModalVisible(false)} 
            style={modalStyles.cancelButton}
          >
            <Text style={[modalStyles.cancelText, { color: theme.colors.text.secondary }]}>Cancel</Text>
          </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
  
  const LanguageSelectModal = () => (
    <Modal visible={isLangModalVisible} transparent animationType="fade" onRequestClose={() => setLangModalVisible(false)}>
      <TouchableOpacity 
        style={modalStyles.overlay} 
        activeOpacity={1} 
        onPress={() => setLangModalVisible(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[modalStyles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text style={[modalStyles.modalTitle, { color: theme.colors.text.primary }]}>Choose Language</Text>
          {[{ code: 'en', label: 'English' }, { code: 'am', label: 'አማርኛ (Amharic)' }].map(opt => (
            <TouchableOpacity
              key={opt.code}
              onPress={() => { setLanguage(opt.code); setLangModalVisible(false); }}
              style={[
                modalStyles.option,
                { backgroundColor: language === opt.code ? theme.colors.primaryContainer : 'transparent' }
              ]}
            >
              <Text style={[
                modalStyles.optionText,
                { 
                  color: language === opt.code ? theme.colors.primary : theme.colors.text.primary,
                  fontWeight: language === opt.code ? 'bold' : 'normal' 
                }
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            onPress={() => setLangModalVisible(false)} 
            style={modalStyles.cancelButton}
          >
            <Text style={[modalStyles.cancelText, { color: theme.colors.text.secondary }]}>Cancel</Text>
          </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
  
  return {
    user: {
      name: authUser?.user_metadata?.full_name || `Adera ${roleType.charAt(0).toUpperCase() + roleType.slice(1)}`,
      email: authUser?.email,
      stats: getRoleSpecificStats(),
    },
    menuItems: getRoleSpecificMenuItems(),
    appVersion: `Adera PTP ${roleType.charAt(0).toUpperCase() + roleType.slice(1)} v1.0.0`,
    notifications,
    setNotifications,
    emailNotifications,
    setEmailNotifications,
    smsNotifications,
    setSmsNotifications,
    locationTracking,
    setLocationTracking,
    shopOpen,
    setShopOpen,
    autoAcceptParcels,
    setAutoAcceptParcels,
    handleSignOut,
    ThemeSelectModal,
    LanguageSelectModal,
  };
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
  },
});