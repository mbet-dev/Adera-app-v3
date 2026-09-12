import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { useTheme } from './ThemeProvider';

const TextInput = ({
  label,
  error,
  helperText,
  required = false,
  style,
  left,
  right,
  webType,
  leftIcon,
  keyboardType: incomingKeyboardType,
  ...props
}) => {
  const theme = useTheme();
  const keyboardTypeMap = {
    tel: 'phone-pad',
    email: 'email-address',
    numeric: 'numeric',
  };

  const inputModeMap = {
    tel: 'tel',
    email: 'email',
    text: 'text',
    numeric: 'numeric',
  };

  const autoCompleteMap = {
    tel: 'tel',
    email: 'email',
    text: 'off',
    numeric: 'off',
  };

  const resolvedKeyboardType = incomingKeyboardType || keyboardTypeMap[webType] || 'default';

  // Handle web-specific input types and modes
  const webProps = Platform.OS === 'web'
    ? {
        inputMode: inputModeMap[webType] || undefined,
        autoComplete: autoCompleteMap[webType] || 'off',
      }
    : {};

  // Handle left icon
  const leftComponent = leftIcon ? (
    <PaperTextInput.Icon icon={leftIcon} />
  ) : left;

  return (
    <View style={[styles.container, style]}>
      <PaperTextInput
        label={required ? `${label} *` : label}
        mode="outlined"
        error={!!error}
        theme={{
          colors: {
            primary: theme.colors.primary,
            error: theme.colors.error,
          },
        }}
        outlineStyle={{
          borderColor: error ? theme.colors.error : theme.colors.outline,
        }}
        style={styles.input}
        left={leftComponent}
        right={right}
        keyboardType={resolvedKeyboardType}
        {...webProps}
        {...props}
      />
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error ? theme.colors.error : theme.colors.text.secondary,
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
});

export default TextInput;
