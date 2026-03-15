import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Platform, Alert, Image, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBiometricStatus,
  authenticateWithBiometric,
  saveBiometricPreference,
  generateBiometricId,
  getBiometryTypeName,
} from '@/lib/biometric';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';

const DISTRICTS = [
  'Blantyre', 'Lilongwe', 'Mzuzu', 'Zomba', 'Kasungu',
  'Mangochi', 'Salima', 'Dedza', 'Ntcheu', 'Dowa',
  'Nkhotakota', 'Nkhata Bay', 'Rumphi', 'Mzimba', 'Chitipa',
  'Karonga', 'Thyolo', 'Mulanje', 'Phalombe', 'Chiradzulu',
  'Machinga', 'Balaka', 'Chikwawa', 'Nsanje', 'Mwanza',
  'Neno', 'Other',
];

const EMPLOYMENT = [
  'Employed (Government)',
  'Employed (Private)',
  'Self-Employed / Business',
  'Freelancer',
  'Student',
  'Unemployed',
  'Other',
];

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  dob: string;
  nationalId: string;
  district: string;
  area: string;
  employmentStatus: string;
  monthlyIncome: string;
  password: string;
  confirmPassword: string;
  // Document fields
  idDocumentType: 'national_id' | 'passport' | '';
  idDocumentImage: string;
  selfieWithIdImage: string;
}

function Field({
  label, value, onChangeText, placeholder, secureTextEntry, keyboardType, icon, error, multiline,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean; keyboardType?: any;
  icon: string; error?: string; multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.row, focused && fieldStyles.focused, !!error && fieldStyles.errored]}>
        <Ionicons name={icon as any} size={16} color={focused ? Colors.primary : Colors.textMuted} />
        <TextInput
          style={[fieldStyles.input, multiline && { height: 70, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secureTextEntry && !showPwd}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPwd(!showPwd)}>
            <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

function SelectField({
  label, value, onSelect, options, icon, error,
}: {
  label: string; value: string; onSelect: (v: string) => void;
  options: string[]; icon: string; error?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <Pressable
        style={[fieldStyles.row, !!error && fieldStyles.errored]}
        onPress={() => setOpen(!open)}
      >
        <Ionicons name={icon as any} size={16} color={Colors.textMuted} />
        <Text style={[fieldStyles.input, !value && { color: Colors.textMuted }]}>
          {value || `Select ${label}`}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
      </Pressable>
      {open && (
        <View style={fieldStyles.dropdown}>
          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
            {options.map((opt) => (
              <Pressable
                key={opt}
                style={[fieldStyles.dropdownItem, value === opt && fieldStyles.dropdownSelected]}
                onPress={() => { onSelect(opt); setOpen(false); }}
              >
                <Text style={[fieldStyles.dropdownText, value === opt && { color: Colors.primary, fontFamily: 'DMSans_700Bold' }]}>
                  {opt}
                </Text>
                {value === opt && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { gap: 5 },
  label: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 8,
  },
  focused: { borderColor: Colors.primary },
  errored: { borderColor: Colors.error },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.text,
  },
  error: { fontSize: 11, color: Colors.error, fontFamily: 'DMSans_400Regular' },
  dropdown: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownSelected: { backgroundColor: Colors.lavender },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.text,
  },
});

type Step = 1 | 2 | 3 | 4;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { register } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    fullName: '', phone: '', email: '', dob: '',
    nationalId: '', district: '', area: '',
    employmentStatus: '', monthlyIncome: '',
    password: '', confirmPassword: '',
    idDocumentType: '', idDocumentImage: '', selfieWithIdImage: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  function update(key: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  // Image picker for ID document
  async function pickIdDocument() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: 'base64',
      });
      update('idDocumentImage', `data:image/jpeg;base64,${base64}`);
    }
  }

  // Image picker for selfie with ID
  async function pickSelfieWithId() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: 'base64',
      });
      update('selfieWithIdImage', `data:image/jpeg;base64,${base64}`);
    }
  }

  function validateStep1(): boolean {
    const errs: Partial<FormData> = {};
    if (form.fullName.trim().length < 3) errs.fullName = 'Enter your full name';
    if (!/^\+?[0-9]{9,15}$/.test(form.phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid phone number';
    if (!form.email.includes('@')) errs.email = 'Enter a valid email';
    if (!form.dob) errs.dob = 'Enter your date of birth (DD/MM/YYYY)';
    if (form.nationalId.trim().length < 5) errs.nationalId = 'Enter your National ID or Passport number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.district) errs.district = 'Select your district';
    if (form.area.trim().length < 2) errs.area = 'Enter your area / village';
    if (!form.employmentStatus) errs.employmentStatus = 'Select employment status';
    if (form.monthlyIncome.trim().length < 1) errs.monthlyIncome = 'Enter your monthly income';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep3(): boolean {
    const errs: Partial<FormData> = {};
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep4(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.idDocumentType) errs.idDocumentType = '' as any; // Error shown in UI
    if (!form.idDocumentImage) errs.idDocumentImage = 'ID document photo is required';
    if (!form.selfieWithIdImage) errs.selfieWithIdImage = 'Selfie with ID is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleNext() {
    if (step === 1) {
      if (!validateStep1()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(3);
    } else if (step === 3) {
      if (!validateStep3()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(4);
    } else {
      if (!validateStep4()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
      setLoading(true);
      try {
        // Register with documents
        const response = await fetch(`${API_URL}/register-with-documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            fullName: form.fullName,
            phone: form.phone,
            dob: form.dob,
            nationalId: form.nationalId,
            district: form.district,
            area: form.area,
            employmentStatus: form.employmentStatus,
            monthlyIncome: form.monthlyIncome,
            idDocumentType: form.idDocumentType,
            idDocumentImage: form.idDocumentImage,
            selfieWithIdImage: form.selfieWithIdImage,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Save user data
        await AsyncStorage.setItem('@phoenix_loan:user', JSON.stringify(data.user));
        await AsyncStorage.setItem('@phoenix_loan:token', data.token);
        
        // Check if biometric is available and offer to enable it
        const biometricStatus = await getBiometricStatus();
        if (biometricStatus.isAvailable) {
          Alert.alert(
            'Enable Biometric Login',
            `Would you like to enable ${getBiometryTypeName(biometricStatus.biometryType)} login for faster access next time?`,
            [
              {
                text: 'Not Now',
                style: 'cancel',
                onPress: () => router.replace('/(tabs)' as any)
              },
              {
                text: 'Enable',
                onPress: async () => {
                  try {
                    // Authenticate with biometric
                    const authResult = await authenticateWithBiometric();
                    if (authResult.success) {
                      const biometricId = generateBiometricId(data.user.id);
                      await saveBiometricPreference(data.user.id, biometricId);
                      
                      // Save to backend
                      await fetch(`${API_URL}/enable-biometric`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: data.user.id, biometricId }),
                      });
                      
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert('Success', `${getBiometryTypeName(biometricStatus.biometryType)} login enabled!`);
                    }
                  } catch (e) {
                    console.log('Biometric setup error:', e);
                  }
                  router.replace('/(tabs)' as any);
                }
              }
            ]
          );
        } else {
          router.replace('/(tabs)' as any);
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  }

  const steps = [
    { label: 'Personal', num: 1 },
    { label: 'Residence', num: 2 },
    { label: 'Security', num: 3 },
    { label: 'Documents', num: 4 },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        style={styles.backBtn}
        onPress={() => {
          Haptics.selectionAsync();
          if (step > 1) setStep((step - 1) as Step);
          else router.back();
        }}
      >
        <Ionicons name="arrow-back" size={20} color={Colors.primary} />
      </Pressable>

      <View style={styles.brandRow}>
        <View style={styles.logoIcon}>
          <MaterialCommunityIcons name="bird" size={20} color={Colors.white} />
        </View>
        <Text style={styles.brand}>Phoenix Loan</Text>
      </View>

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join thousands of Malawians accessing fast loans</Text>

      <View style={styles.stepRow}>
        {steps.map((s, i) => (
          <View key={s.num} style={styles.stepItem}>
            <View style={[styles.stepCircle, step >= s.num && styles.stepCircleActive]}>
              {step > s.num ? (
                <Ionicons name="checkmark" size={14} color={Colors.white} />
              ) : (
                <Text style={[styles.stepNum, step >= s.num && styles.stepNumActive]}>{s.num}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, step >= s.num && styles.stepLabelActive]}>{s.label}</Text>
            {i < steps.length - 1 && (
              <View style={[styles.stepLine, step > s.num && styles.stepLineActive]} />
            )}
          </View>
        ))}
      </View>

      <View style={styles.form}>
        {step === 1 && (
          <>
            <Field label="Full Name (as per ID)" value={form.fullName} onChangeText={v => update('fullName', v)}
              placeholder="e.g. John Banda" icon="person-outline" error={errors.fullName} />
            <Field label="Phone Number" value={form.phone} onChangeText={v => update('phone', v)}
              placeholder="+265 999 000 000" keyboardType="phone-pad" icon="call-outline" error={errors.phone} />
            <Field label="Email Address" value={form.email} onChangeText={v => update('email', v)}
              placeholder="you@example.com" keyboardType="email-address" icon="mail-outline" error={errors.email} />
            <Field label="Date of Birth" value={form.dob} onChangeText={v => update('dob', v)}
              placeholder="DD/MM/YYYY" icon="calendar-outline" error={errors.dob} />
            <Field label="National ID / Passport Number" value={form.nationalId} onChangeText={v => update('nationalId', v)}
              placeholder="e.g. MWI-123456-7" icon="card-outline" error={errors.nationalId} />
          </>
        )}

        {step === 2 && (
          <>
            <SelectField label="District" value={form.district} onSelect={v => update('district', v)}
              options={DISTRICTS} icon="location-outline" error={errors.district} />
            <Field label="Area / Village / Township" value={form.area} onChangeText={v => update('area', v)}
              placeholder="e.g. Area 47, Lilongwe" icon="map-outline" error={errors.area} />
            <SelectField label="Employment Status" value={form.employmentStatus} onSelect={v => update('employmentStatus', v)}
              options={EMPLOYMENT} icon="briefcase-outline" error={errors.employmentStatus} />
            <Field label="Monthly Income (MWK)" value={form.monthlyIncome} onChangeText={v => update('monthlyIncome', v)}
              placeholder="e.g. 150000" keyboardType="numeric" icon="cash-outline" error={errors.monthlyIncome} />
          </>
        )}

        {step === 3 && (
          <>
            <View style={styles.kycNote}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
              <Text style={styles.kycNoteText}>
                Your information is encrypted and secure. We use KYC verification to protect all users.
              </Text>
            </View>
            <Field label="Password" value={form.password} onChangeText={v => update('password', v)}
              placeholder="At least 6 characters" secureTextEntry icon="lock-closed-outline" error={errors.password} />
            <Field label="Confirm Password" value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)}
              placeholder="Re-enter your password" secureTextEntry icon="lock-closed-outline" error={errors.confirmPassword} />
            <View style={styles.termsNote}>
              <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.termsText}>
                By registering, you agree to our{' '}
                <Text style={styles.termsLink}>Terms & Conditions</Text>
                {' '}and consent to GPS location tracking and data usage per our privacy policy.
              </Text>
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <View style={styles.docNote}>
              <Ionicons name="camera-outline" size={20} color={Colors.primary} />
              <Text style={styles.docNoteText}>
                Take clear photos of your ID and a selfie holding your ID for verification.
              </Text>
            </View>

            {/* Document Type Selector */}
            <Text style={styles.docLabel}>Document Type</Text>
            <View style={styles.docTypeRow}>
              <Pressable
                style={[styles.docTypeBtn, form.idDocumentType === 'national_id' && styles.docTypeActive]}
                onPress={() => update('idDocumentType', 'national_id')}
              >
                <Ionicons name="card-outline" size={20} color={form.idDocumentType === 'national_id' ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.docTypeText, form.idDocumentType === 'national_id' && styles.docTypeTextActive]}>National ID</Text>
              </Pressable>
              <Pressable
                style={[styles.docTypeBtn, form.idDocumentType === 'passport' && styles.docTypeActive]}
                onPress={() => update('idDocumentType', 'passport')}
              >
                <Ionicons name="airplane-outline" size={20} color={form.idDocumentType === 'passport' ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.docTypeText, form.idDocumentType === 'passport' && styles.docTypeTextActive]}>Passport</Text>
              </Pressable>
            </View>
            {!form.idDocumentType && <Text style={styles.errorText}>Select document type</Text>}

            {/* ID Document Photo */}
            <Text style={styles.docLabel}>ID Document Photo</Text>
            <Pressable style={styles.photoBox} onPress={pickIdDocument}>
              {form.idDocumentImage ? (
                <Image source={{ uri: form.idDocumentImage }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={32} color={Colors.textMuted} />
                  <Text style={styles.photoPlaceholderText}>Tap to capture ID</Text>
                </View>
              )}
            </Pressable>
            {form.idDocumentImage && (
              <Pressable onPress={() => update('idDocumentImage', '')}>
                <Text style={styles.retakeText}>Retake Photo</Text>
              </Pressable>
            )}
            {errors.idDocumentImage && <Text style={styles.errorText}>{errors.idDocumentImage}</Text>}

            {/* Selfie with ID */}
            <Text style={styles.docLabel}>Selfie Holding Your ID</Text>
            <Pressable style={styles.photoBox} onPress={pickSelfieWithId}>
              {form.selfieWithIdImage ? (
                <Image source={{ uri: form.selfieWithIdImage }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={32} color={Colors.textMuted} />
                  <Text style={styles.photoPlaceholderText}>Tap to capture selfie</Text>
                </View>
              )}
            </Pressable>
            {form.selfieWithIdImage && (
              <Pressable onPress={() => update('selfieWithIdImage', '')}>
                <Text style={styles.retakeText}>Retake Photo</Text>
              </Pressable>
            )}
            {errors.selfieWithIdImage && <Text style={styles.errorText}>{errors.selfieWithIdImage}</Text>}
          </>
        )}

        <Pressable
          style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }, loading && { opacity: 0.7 }]}
          onPress={handleNext}
          disabled={loading}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtnGradient}
          >
            <Text style={styles.nextBtnText}>
              {loading ? 'Creating Account...' : step < 3 ? 'Continue' : 'Create Account'}
            </Text>
            <Ionicons name={step < 3 ? 'arrow-forward' : 'checkmark'} size={18} color={Colors.white} />
          </LinearGradient>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.loginRow, pressed && { opacity: 0.8 }]}
          onPress={() => { Haptics.selectionAsync(); router.push('/auth/login' as any); }}
        >
          <Text style={styles.loginText}>Already registered? </Text>
          <Text style={styles.loginLink}>Sign In</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 24 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
  },
  title: {
    fontSize: 26,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 28,
    gap: 0,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepNum: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.textMuted,
  },
  stepNumActive: { color: Colors.white },
  stepLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontFamily: 'DMSans_500Medium',
  },
  stepLine: {
    position: 'absolute',
    top: 14,
    right: -50,
    width: 100,
    height: 1,
    backgroundColor: Colors.border,
  },
  stepLineActive: { backgroundColor: Colors.primary },
  form: { gap: 14 },
  kycNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.lavender,
    borderRadius: 12,
    padding: 12,
  },
  kycNoteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.text,
    lineHeight: 19,
  },
  termsNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.lavender,
    borderRadius: 10,
    padding: 12,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontFamily: 'DMSans_700Bold',
  },
  nextBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  nextBtnGradient: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loginText: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary },
  loginLink: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.primary },
  // Document upload styles
  docNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.lavender,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  docNoteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.text,
    lineHeight: 19,
  },
  docLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  docTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  docTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  docTypeActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lavender,
  },
  docTypeText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.textMuted,
  },
  docTypeTextActive: {
    color: Colors.primary,
    fontFamily: 'DMSans_600SemiBold',
  },
  photoBox: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textMuted,
  },
  retakeText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 11,
    color: Colors.error,
    fontFamily: 'DMSans_400Regular',
    marginTop: 4,
  },
});
