import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import SafeArea from './SafeArea';
import Card from './Card';
import { useTheme } from './ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@adera/auth';
import { usePreferences } from '@adera/preferences';

const ProfileScreen = ({ user, menuItems, appVersion = 'v1.0.0' }) => {
  const theme = useTheme();
  const { signOut } = useAuth();
  const { themeMode, setThemeMode, language, setLanguage, biometricEnabled, enableBiometrics, disableBiometrics } = usePreferences();

  const handleSignOut = () => {
    const confirmSignOut = async () => {
      try {
        console.log('[ProfileScreen] handleSignOut: Starting sign out');
        const result = await signOut();
        console.log('[ProfileScreen] handleSignOut: Sign out result:', result);
        
        // signOut now returns { success: boolean, error?: string }
        if (result && !result.success) {
          const errorMessage = result.error || 'Failed to sign out. Please try again.';
          if (Platform.OS === 'web') {
            window.alert(`Sign out failed: ${errorMessage}`);
          } else {
            Alert.alert('Sign Out Failed', errorMessage);
          }
          return; // Don't redirect if sign out failed
        }
        
        // Sign out was successful (or result is undefined for backward compatibility)
        // On web, redirect to the root to re-trigger the onboarding flow
        if (Platform.OS === 'web') {
          // Small delay to ensure state is cleared
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
        // On native, the auth state change will handle navigation
      } catch (error) {
        console.error('[ProfileScreen] handleSignOut: Error during sign out:', error);
        const errorMessage = error?.message || 'Failed to sign out. Please try again.';
        if (Platform.OS === 'web') {
          window.alert(`Sign out error: ${errorMessage}`);
        } else {
          Alert.alert('Sign Out Error', errorMessage);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        confirmSignOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: confirmSignOut,
          },
        ]
      );
    }
  };

  const renderProfileHeader = () => (
    <Card style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
            {user.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.surfaceVariant }]}
          onPress={() => Alert.alert('Coming Soon', 'Profile edit coming soon')}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={20}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      </View>
      <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
        {user.name}
      </Text>
      <Text style={[styles.userEmail, { color: theme.colors.text.secondary }]}>
        {user.email}
      </Text>
      {user.stats && (
        <View style={styles.userStats}>
          {user.stats.map((stat, index) => (
            <React.Fragment key={index}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name={stat.icon}
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  {stat.label}
                </Text>
              </View>
              {index < user.stats.length - 1 && (
                <View style={[styles.statDivider, { backgroundColor: theme.colors.outline }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      )}
    </Card>
  );

  const renderMenuItem = (item) => {
    if (item.type === 'switch') {
      return (
        <View key={item.id} style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={theme.colors.text.primary}
            />
            <Text style={[styles.menuItemLabel, { color: theme.colors.text.primary }]}>
              {item.label}
            </Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary }}
            thumbColor={theme.colors.white}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.menuItem}
        onPress={item.onPress}
      >
        <View style={styles.menuItemLeft}>
          <MaterialCommunityIcons
            name={item.icon}
            size={24}
            color={theme.colors.text.primary}
          />
          <Text style={[styles.menuItemLabel, { color: theme.colors.text.primary }]}>
            {item.label}
          </Text>
        </View>
        <View style={styles.menuItemRight}>
          {item.value && (
            <Text style={[styles.menuItemValue, { color: theme.colors.text.secondary }]}>
              {item.value}
            </Text>
          )}
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.text.secondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeArea edges={['top', 'bottom']} withBottomNav={true}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Profile
          </Text>
        </View>
        {renderProfileHeader()}
        {menuItems.map((section, index) => (
          <View key={index} style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
              {section.section}
            </Text>
            <Card style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderMenuItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View
                      style={[styles.menuDivider, { backgroundColor: theme.colors.outline }]}
                    />
                  )}
                </View>
              ))}
            </Card>
          </View>
        ))}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: theme.colors.errorContainer }]}
          onPress={handleSignOut}
        >
          <MaterialCommunityIcons
            name="logout"
            size={24}
            color={theme.colors.error}
          />
          <Text style={[styles.signOutText, { color: theme.colors.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
        <Text style={[styles.versionText, { color: theme.colors.text.secondary }]}>
          {appVersion}
        </Text>
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    alignItems: 'center',
  },
  profileHeader: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 20,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  menuSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemValue: {
    fontSize: 14,
  },
  menuDivider: {
    height: 1,
    marginLeft: 52,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ProfileScreen;
