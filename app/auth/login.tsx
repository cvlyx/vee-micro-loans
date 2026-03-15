import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBiometricStatus,
  authenticateWithBiometric,
  getBiometricId,
  getBiometryTypeName,
  BiometricStatus,
} from '@/lib/biometric';
import * as LocalAuthentication from 'expo-local-authentication';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';

function InputField({
  label, value, onChangeText, placeholder, secureTextEntry, keyboardType, icon, error,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean; keyboardType?: any;
  icon: string; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={[inputStyles.inputRow, focused && inputStyles.inputFocused, !!error && inputStyles.inputError]}>
        <Ionicons name={icon as any} size={18} color={focused ? Colors.primary : Colors.textMuted} style={inputStyles.icon} />
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secureTextEntry && !showPwd}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPwd(!showPwd)}>
            <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={inputStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.text },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  inputFocused: { borderColor: Colors.primary },
  inputError: { borderColor: Colors.error },
  icon: {},
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.text,
  },
  errorText: { fontSize: 12, color: Colors.error, fontFamily: 'DMSans_400Regular' },
});

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>({
    isAvailable: false,
    biometryType: null,
    hasSavedCredentials: false,
  });

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  // Check biometric availability on mount
  useEffect(() => {
    async function checkBiometric() {
      const status = await getBiometricStatus();
      setBiometricStatus(status);
    }
    checkBiometric();
  }, []);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!email.includes('@')) errs.email = 'Enter a valid email address';
    if (password.length < 4) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin() {
    if (!validate()) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Get user data
      const storedUser = await AsyncStorage.getItem('@phoenix_loan:user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        
        // Offer to enable biometric if available and not already enabled
        if (biometricStatus.isAvailable && !biometricStatus.hasSavedCredentials) {
          Alert.alert(
            'Enable Biometric Login',
            `Would you like to enable ${getBiometryTypeName(biometricStatus.biometryType)} login for faster access?`,
            [
              {
                text: 'Not Now',
                style: 'cancel',
                onPress: () => {
                  redirectToDashboard(user.role);
                }
              },
              {
                text: 'Enable',
                onPress: async () => {
                  await enableBiometricAfterLogin(user.id);
                  redirectToDashboard(user.role);
                }
              }
            ]
          );
        } else {
          redirectToDashboard(user.role);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Login Failed', 'No account found with these credentials. Please register first.');
    } finally {
      setLoading(false);
    }
  }

  function redirectToDashboard(role: string) {
    if (role === 'admin') {
      router.replace('/admin/(tabs)' as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  }

  async function enableBiometricAfterLogin(userId: string) {
    try {
      // First authenticate with biometric to verify user
      const authResult = await authenticateWithBiometric();
      if (!authResult.success) {
        Alert.alert('Error', 'Biometric authentication failed. You can enable it later in settings.');
        return;
      }

      // Generate and save biometric ID
      const { generateBiometricId, saveBiometricPreference } = require('@/lib/biometric');
      const biometricId = generateBiometricId(userId);
      
      // Save locally
      await saveBiometricPreference(userId, biometricId);
      
      // Save to backend
      await fetch(`${API_URL}/enable-biometric`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, biometricId }),
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `${getBiometryTypeName(biometricStatus.biometryType)} login enabled!`);
    } catch (error) {
      console.error('Enable biometric error:', error);
      Alert.alert('Error', 'Failed to enable biometric. You can try again later.');
    }
  }

  async function handleBiometricLogin() {
    if (!biometricStatus.hasSavedCredentials) {
      Alert.alert('No Saved Credentials', 'Please login with email and password first to enable biometric login.');
      return;
    }

    try {
      setBiometricLoading(true);
      Haptics.selectionAsync();

      // Authenticate with biometric
      const authResult = await authenticateWithBiometric();
      if (!authResult.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Authentication Failed', authResult.error || 'Please try again.');
        return;
      }

      // Get saved biometric ID
      const biometricId = await getBiometricId();
      if (!biometricId) {
        Alert.alert('Error', 'Biometric credentials not found. Please login with password.');
        return;
      }

      // Call biometric login API
      const response = await fetch(`${API_URL}/biometric-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biometricId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Biometric login failed');
      }

      // Save user data
      await AsyncStorage.setItem('@phoenix_loan:user', JSON.stringify(data.user));
      await AsyncStorage.setItem('@phoenix_loan:token', data.token);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Redirect based on user role
      if (data.user.role === 'admin') {
        router.replace('/admin/(tabs)' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (error: any) {
      console.error('Biometric login error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Login Failed', error.message || 'Please try again or use password login.');
    } finally {
      setBiometricLoading(false);
    }
  }

  async function handleSetupBiometric() {
    Alert.alert(
      'Setup Biometric Login',
      'Please login with your email and password first, then you can enable biometric login for future access.',
      [{ text: 'OK' }]
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </Pressable>

        <View style={styles.brandRow}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="bird" size={22} color={Colors.white} />
          </View>
          <Text style={styles.brand}>Vee Micro Loans</Text>
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account to continue</Text>

        <Animated.View style={[styles.form, shakeStyle]}>
          <InputField
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            icon="mail-outline"
            error={errors.email}
          />
          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            icon="lock-closed-outline"
            error={errors.password}
          />

          <Pressable style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtnGradient}
            >
              <Text style={styles.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </LinearGradient>
          </Pressable>

          {/* Biometric Login Button - Show if biometric is available */}
          {biometricStatus.isAvailable && (
            <Pressable
              style={({ pressed }) => [
                styles.biometricBtn,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                biometricLoading && { opacity: 0.7 },
              ]}
              onPress={biometricStatus.hasSavedCredentials ? handleBiometricLogin : handleSetupBiometric}
              disabled={biometricLoading}
            >
              <Ionicons
                name={biometricStatus.biometryType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? 'scan' : 'finger-print'}
                size={22}
                color={Colors.primary}
              />
              <Text style={styles.biometricBtnText}>
                {biometricLoading 
                  ? 'Authenticating...' 
                  : biometricStatus.hasSavedCredentials 
                    ? `Login with ${getBiometryTypeName(biometricStatus.biometryType)}`
                    : `Setup ${getBiometryTypeName(biometricStatus.biometryType)} Login`
                }
              </Text>
            </Pressable>
          )}
        </Animated.View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.registerBtn, pressed && { opacity: 0.8 }]}
          onPress={() => { Haptics.selectionAsync(); router.push('/auth/register' as any); }}
        >
          <Text style={styles.registerText}>Don't have an account? </Text>
          <Text style={styles.registerLink}>Register Now</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 24 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 30,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  form: { gap: 16 },
  forgotRow: { alignSelf: 'flex-end' },
  forgotText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.primary,
  },
  loginBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  loginBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textMuted,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  registerText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    marginTop: 12,
  },
  biometricBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.primary,
  },
});
