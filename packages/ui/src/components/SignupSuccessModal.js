import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeProvider';

const SignupSuccessModal = ({ visible, onClose, email, firstName }) => {
  const theme = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: opacityAnim,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          ]}
        />
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {/* Success Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="email-check"
              size={64}
              color={theme.colors.primary}
            />
          </View>

          {/* Title */}
          <Text
            style={[styles.title, { color: theme.colors.text.primary }]}
          >
            🎉 Welcome to Adera, {firstName}!
          </Text>

          {/* Message */}
          <Text
            style={[styles.message, { color: theme.colors.text.secondary }]}
          >
            We've sent a verification email to:
          </Text>
          <Text
            style={[
              styles.emailText,
              { color: theme.colors.primary, fontWeight: '600' },
            ]}
          >
            {email}
          </Text>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionRow}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={theme.colors.primary}
                style={styles.instructionIcon}
              />
              <Text
                style={[
                  styles.instructionText,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Check your inbox (and spam folder)
              </Text>
            </View>
            <View style={styles.instructionRow}>
              <MaterialCommunityIcons
                name="link-variant"
                size={20}
                color={theme.colors.primary}
                style={styles.instructionIcon}
              />
              <Text
                style={[
                  styles.instructionText,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Click the verification link
              </Text>
            </View>
            <View style={styles.instructionRow}>
              <MaterialCommunityIcons
                name="login"
                size={20}
                color={theme.colors.primary}
                style={styles.instructionIcon}
              />
              <Text
                style={[
                  styles.instructionText,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Return here to sign in
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
              },
            ]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
              Got it, thanks!
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  emailText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 32,
    gap: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  instructionIcon: {
    marginRight: 12,
  },
  instructionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignupSuccessModal;

