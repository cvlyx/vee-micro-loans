import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  Platform, Alert, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAdmin } from '@/contexts/AdminContext';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming,
} from 'react-native-reanimated';

export default function AdminLoginScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { adminLogin } = useAdmin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  function shake() {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  }

  async function handleLogin() {
    if (!email || !password) {
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    const ok = await adminLogin(email.trim(), password);
    setLoading(false);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/admin/(tabs)');
    } else {
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Access Denied', 'Invalid admin credentials. Please try again.');
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={['#0A0118', '#1A0533', '#2D1065']}
        style={[styles.container, { paddingTop: topPad }]}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable
            style={styles.backBtn}
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
          >
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
          </Pressable>

          <View style={styles.logoSection}>
            <View style={styles.adminBadge}>
              <MaterialCommunityIcons name="shield-crown" size={36} color={Colors.white} />
            </View>
            <Text style={styles.adminLabel}>ADMIN PORTAL</Text>
            <Text style={styles.appName}>Vee Micro Loans</Text>
            <Text style={styles.tagline}>Lender Dashboard — Secure Access</Text>
          </View>

          <View style={styles.securityBadge}>
            <Ionicons name="lock-closed" size={14} color={Colors.accent} />
            <Text style={styles.securityText}>256-bit encrypted · Authorized personnel only</Text>
          </View>

          <Animated.View style={[styles.form, shakeStyle]}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Admin Email</Text>
              <View style={[styles.inputRow, emailFocused && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={18} color={emailFocused ? Colors.accent : 'rgba(255,255,255,0.4)'} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@phoenixloan.mw"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputRow, passFocused && styles.inputFocused]}>
                <Ionicons name="key-outline" size={18} color={passFocused ? Colors.accent : 'rgba(255,255,255,0.4)'} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter admin password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showPassword}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color="rgba(255,255,255,0.4)" />
                </Pressable>
              </View>
            </View>

            <View style={styles.hintBox}>
              <Ionicons name="information-circle-outline" size={14} color="rgba(168,85,247,0.8)" />
              <Text style={styles.hintText}>
                Demo credentials:{'\n'}
                Email: admin@phoenixloan.mw{'\n'}
                Password: Phoenix@2026
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={['#7C3AED', '#A855F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnInner}
              >
                <MaterialCommunityIcons name="shield-crown" size={18} color={Colors.white} />
                <Text style={styles.loginBtnText}>
                  {loading ? 'Authenticating...' : 'Access Admin Panel'}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Vee Micro Loans Admin v1.0</Text>
            <Text style={styles.footerText}>Malawi · Secure Portal</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  adminBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(124,58,237,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(168,85,247,0.5)',
    marginBottom: 8,
  },
  adminLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.accent,
    letterSpacing: 3,
  },
  appName: {
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(168,85,247,0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.2)',
  },
  securityText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.6)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputFocused: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(168,85,247,0.08)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.white,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(168,85,247,0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.2)',
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 19,
  },
  loginBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  loginBtnInner: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    marginTop: 40,
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.2)',
  },
});
