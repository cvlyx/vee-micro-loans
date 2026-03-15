import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Platform, Alert, Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLoan, calcInterestRate, DisbursementMethod } from '@/contexts/LoanContext';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';

const DURATIONS = [
  { days: 7, label: '1 Week', rate: 0.20 },
  { days: 14, label: '2 Weeks', rate: 0.30 },
  { days: 21, label: '3 Weeks', rate: 0.40 },
  { days: 30, label: '4 Weeks', rate: 0.50 },
];

const DISBURSEMENT_OPTIONS: { key: DisbursementMethod; label: string; icon: string; category: string }[] = [
  { key: 'airtel_money', label: 'Airtel Money', icon: 'phone-portrait-outline', category: 'Mobile Money' },
  { key: 'tnm_mpamba', label: 'TNM Mpamba', icon: 'phone-portrait-outline', category: 'Mobile Money' },
  { key: 'national_bank', label: 'National Bank of Malawi', icon: 'business-outline', category: 'Bank' },
  { key: 'fdh_bank', label: 'FDH Bank', icon: 'business-outline', category: 'Bank' },
  { key: 'nbs_bank', label: 'NBS Bank', icon: 'business-outline', category: 'Bank' },
  { key: 'first_capital', label: 'First Capital Bank', icon: 'business-outline', category: 'Bank' },
  { key: 'other', label: 'Other (Manual)', icon: 'wallet-outline', category: 'Other' },
];

const EMPLOYMENT_STATUSES = [
  'Employed (Government)', 'Employed (Private)', 'Self-Employed / Business',
  'Freelancer', 'Student', 'Unemployed', 'Other',
];

type Step = 1 | 2 | 3;

function Field({ label, value, onChangeText, placeholder, keyboardType, icon, error }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; icon: string; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fStyles.wrapper}>
      <Text style={fStyles.label}>{label}</Text>
      <View style={[fStyles.row, focused && fStyles.focused, !!error && fStyles.errored]}>
        <Ionicons name={icon as any} size={16} color={focused ? Colors.primary : Colors.textMuted} />
        <TextInput
          style={fStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType || 'default'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {error ? <Text style={fStyles.error}>{error}</Text> : null}
    </View>
  );
}

function SelectField({ label, value, onSelect, options, icon, error }: {
  label: string; value: string; onSelect: (v: string) => void;
  options: string[]; icon: string; error?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={fStyles.wrapper}>
      <Text style={fStyles.label}>{label}</Text>
      <Pressable style={[fStyles.row, !!error && fStyles.errored]} onPress={() => setOpen(!open)}>
        <Ionicons name={icon as any} size={16} color={Colors.textMuted} />
        <Text style={[fStyles.input, !value && { color: Colors.textMuted }]}>{value || `Select ${label}`}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
      </Pressable>
      {open && (
        <View style={fStyles.dropdown}>
          <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
            {options.map(opt => (
              <Pressable key={opt} style={[fStyles.dropItem, value === opt && fStyles.dropSelected]}
                onPress={() => { onSelect(opt); setOpen(false); }}>
                <Text style={[fStyles.dropText, value === opt && { color: Colors.primary, fontFamily: 'DMSans_700Bold' }]}>{opt}</Text>
                {value === opt && <Ionicons name="checkmark" size={14} color={Colors.primary} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      {error ? <Text style={fStyles.error}>{error}</Text> : null}
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrapper: { gap: 5 },
  label: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.text },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 13, gap: 8,
  },
  focused: { borderColor: Colors.primary },
  errored: { borderColor: Colors.error },
  input: { flex: 1, fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.text },
  error: { fontSize: 11, color: Colors.error, fontFamily: 'DMSans_400Regular' },
  dropdown: {
    backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  dropItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  dropSelected: { backgroundColor: Colors.lavender },
  dropText: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.text },
});

export default function ApplyScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { user } = useAuth();
  const { applyForLoan } = useLoan();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 - Loan Calculator
  const [amount, setAmount] = useState('50000');
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]);

  // Step 2 - Personal & Employment
  const [employer, setEmployer] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState(user?.employmentStatus || '');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome || '');
  const [nextOfKinName, setNextOfKinName] = useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');

  // Step 3 - Disbursement & Collateral
  const [disbursementMethod, setDisbursementMethod] = useState<DisbursementMethod | ''>('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  // Collateral (now mandatory)
  const [collateralItemName, setCollateralItemName] = useState('');
  const [collateralDescription, setCollateralDescription] = useState('');
  const [collateralValue, setCollateralValue] = useState('');
  const [collateralImage1, setCollateralImage1] = useState('');
  const [collateralImage2, setCollateralImage2] = useState('');
  const [collateralImage3, setCollateralImage3] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const parsedAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const rate = calcInterestRate(selectedDuration.days);
  const interest = parsedAmount * rate;
  const processingFee = parsedAmount * 0.05;
  const totalRepayment = parsedAmount + interest + processingFee;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + selectedDuration.days);

  function validate2(): boolean {
    const errs: Record<string, string> = {};
    if (!employmentStatus) errs.employmentStatus = 'Required';
    if (!monthlyIncome) errs.monthlyIncome = 'Required';
    if (nextOfKinName.trim().length < 3) errs.nextOfKinName = 'Enter next of kin name';
    if (!/^\+?[0-9]{9,15}$/.test(nextOfKinPhone.replace(/\s/g, ''))) errs.nextOfKinPhone = 'Enter valid phone';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validate3(): boolean {
    const errs: Record<string, string> = {};
    if (!disbursementMethod) errs.disbursementMethod = 'Select a disbursement method';
    if (!accountNumber.trim()) errs.accountNumber = 'Required';
    if (!accountName.trim()) errs.accountName = 'Required';
    // Collateral is now mandatory
    if (!collateralItemName.trim()) errs.collateralItemName = 'Enter item name';
    if (!collateralValue.trim()) errs.collateralValue = 'Enter estimated value';
    if (!collateralImage1 && !collateralImage2 && !collateralImage3) errs.collateralImages = 'At least one photo required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Image picker for collateral
  async function pickCollateralImage(setImage: (img: string) => void) {
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
      setImage(`data:image/jpeg;base64,${base64}`);
    }
  }

  async function handleNext() {
    if (step === 1) {
      if (parsedAmount < 5000) {
        Alert.alert('Minimum Amount', 'Minimum loan amount is MWK 5,000');
        return;
      }
      if (parsedAmount > (user?.loanLimit || 50000)) {
        Alert.alert('Limit Exceeded', `Your loan limit is MWK ${(user?.loanLimit || 50000).toLocaleString()}`);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(2);
    } else if (step === 2) {
      if (!validate2()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(3);
    } else {
      if (!validate3()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
      Alert.alert(
        'Confirm Application',
        `You are applying for MWK ${parsedAmount.toLocaleString()} for ${selectedDuration.label}.\n\nTotal repayment: MWK ${totalRepayment.toLocaleString()}\nDue: ${dueDate.toLocaleDateString('en-MW', { day: 'numeric', month: 'long', year: 'numeric' })}\n\nCollateral: ${collateralItemName}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit Application',
            onPress: async () => {
              setLoading(true);
              try {
                // Submit with collateral to new endpoint
                const response = await fetch(`${API_URL}/applications/with-collateral`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user?.id || '',
                  },
                  body: JSON.stringify({
                    amount: parsedAmount.toString(),
                    employmentStatus,
                    monthlyIncome,
                    employerName: employer,
                    reason: `Loan for ${selectedDuration.label}`,
                    collateralItemName,
                    collateralDescription,
                    collateralEstimatedValue: collateralValue,
                    collateralImage1,
                    collateralImage2,
                    collateralImage3,
                  }),
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || 'Failed to submit application');
                }

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Application Submitted!', 'Your loan application has been submitted. You will be notified of its status.', [
                  { text: 'View Status', onPress: () => router.push('/(tabs)/loans') },
                ]);
                // Reset form
                setStep(1); setAmount('50000');
                setSelectedDuration(DURATIONS[0]);
                setEmployer(''); setEmploymentStatus(user?.employmentStatus || '');
                setMonthlyIncome(user?.monthlyIncome || '');
                setNextOfKinName(''); setNextOfKinPhone('');
                setDisbursementMethod(''); setAccountNumber(''); setAccountName('');
                setCollateralItemName(''); setCollateralDescription(''); setCollateralValue('');
                setCollateralImage1(''); setCollateralImage2(''); setCollateralImage3('');
              } catch (e: any) {
                Alert.alert('Error', e.message || 'Failed to submit application. Please try again.');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Apply for Loan</Text>
            <Text style={styles.subtitle}>Step {step} of 3</Text>
          </View>
          <View style={[styles.stepIndicator]}>
            {[1, 2, 3].map(s => (
              <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
            ))}
          </View>
        </View>

        {/* Step 1: Loan Calculator */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Loan Calculator</Text>

            <View style={styles.amountSection}>
              <Text style={styles.fieldLabel}>Loan Amount (MWK)</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.currencyLabel}>MWK</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.quickAmounts}>
                {[20000, 50000, 100000, 200000].map(a => (
                  <Pressable
                    key={a}
                    style={[styles.quickAmount, parsedAmount === a && styles.quickAmountActive]}
                    onPress={() => { Haptics.selectionAsync(); setAmount(a.toString()); }}
                  >
                    <Text style={[styles.quickAmountText, parsedAmount === a && styles.quickAmountTextActive]}>
                      {(a / 1000).toFixed(0)}K
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.durationSection}>
              <Text style={styles.fieldLabel}>Loan Duration</Text>
              <View style={styles.durationGrid}>
                {DURATIONS.map(d => (
                  <Pressable
                    key={d.days}
                    style={[styles.durationBtn, selectedDuration.days === d.days && styles.durationBtnActive]}
                    onPress={() => { Haptics.selectionAsync(); setSelectedDuration(d); }}
                  >
                    <Text style={[styles.durationLabel, selectedDuration.days === d.days && styles.durationLabelActive]}>
                      {d.label}
                    </Text>
                    <Text style={[styles.durationRate, selectedDuration.days === d.days && styles.durationRateActive]}>
                      {(d.rate * 100).toFixed(0)}% interest
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {parsedAmount > 0 && (
              <LinearGradient
                colors={['#F3E8FF', '#EDE9FE']}
                style={styles.breakdown}
              >
                <Text style={styles.breakdownTitle}>Repayment Breakdown</Text>
                <View style={styles.breakdownRows}>
                  {[
                    { label: 'Principal Amount', value: parsedAmount },
                    { label: `Interest (${(rate * 100).toFixed(0)}%)`, value: interest },
                    { label: 'Processing Fee (5%)', value: processingFee },
                  ].map(r => (
                    <View key={r.label} style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>{r.label}</Text>
                      <Text style={styles.breakdownValue}>MWK {r.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
                    </View>
                  ))}
                  <View style={[styles.breakdownRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Repayment</Text>
                    <Text style={styles.totalValue}>MWK {totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Due Date</Text>
                    <Text style={[styles.breakdownValue, { color: Colors.primary }]}>
                      {dueDate.toLocaleDateString('en-MW', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <View style={styles.collateralNote}>
                  <Ionicons name="shield-outline" size={14} color={Colors.primary} />
                  <Text style={styles.collateralNoteText}>Collateral is required for all loans</Text>
                </View>
              </LinearGradient>
            )}
          </View>
        )}

        {/* Step 2: Employment & Next of Kin */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Employment & Contact</Text>
            <SelectField
              label="Employment Status" value={employmentStatus}
              onSelect={setEmploymentStatus} options={EMPLOYMENT_STATUSES}
              icon="briefcase-outline" error={errors.employmentStatus}
            />
            <Field label="Employer Name (if employed)" value={employer}
              onChangeText={setEmployer} placeholder="e.g. Government of Malawi"
              icon="business-outline" />
            <Field label="Monthly Income (MWK)" value={monthlyIncome}
              onChangeText={setMonthlyIncome} placeholder="e.g. 200000"
              keyboardType="numeric" icon="cash-outline" error={errors.monthlyIncome} />

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerText}>Next of Kin</Text>
            </View>

            <Field label="Next of Kin Full Name" value={nextOfKinName}
              onChangeText={setNextOfKinName} placeholder="e.g. Mary Banda"
              icon="person-outline" error={errors.nextOfKinName} />
            <Field label="Next of Kin Phone" value={nextOfKinPhone}
              onChangeText={setNextOfKinPhone} placeholder="+265 999 000 000"
              keyboardType="phone-pad" icon="call-outline" error={errors.nextOfKinPhone} />
          </View>
        )}

        {/* Step 3: Disbursement & Collateral */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Disbursement Method</Text>

            {errors.disbursementMethod ? (
              <Text style={{ fontSize: 12, color: Colors.error, fontFamily: 'DMSans_400Regular' }}>{errors.disbursementMethod}</Text>
            ) : null}

            <Text style={styles.categoryLabel}>Mobile Money</Text>
            <View style={styles.disbursementGrid}>
              {DISBURSEMENT_OPTIONS.filter(d => d.category === 'Mobile Money').map(opt => (
                <Pressable
                  key={opt.key}
                  style={[styles.disbursementOption, disbursementMethod === opt.key && styles.disbursementOptionActive]}
                  onPress={() => { Haptics.selectionAsync(); setDisbursementMethod(opt.key); }}
                >
                  <Ionicons name={opt.icon as any} size={20} color={disbursementMethod === opt.key ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.disbursementLabel, disbursementMethod === opt.key && styles.disbursementLabelActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.categoryLabel, { marginTop: 8 }]}>Bank Transfer</Text>
            <View style={styles.disbursementGrid}>
              {DISBURSEMENT_OPTIONS.filter(d => d.category === 'Bank').map(opt => (
                <Pressable
                  key={opt.key}
                  style={[styles.disbursementOption, disbursementMethod === opt.key && styles.disbursementOptionActive]}
                  onPress={() => { Haptics.selectionAsync(); setDisbursementMethod(opt.key); }}
                >
                  <Ionicons name={opt.icon as any} size={18} color={disbursementMethod === opt.key ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.disbursementLabel, disbursementMethod === opt.key && styles.disbursementLabelActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Field label="Account/Mobile Money Number" value={accountNumber}
              onChangeText={setAccountNumber} placeholder="e.g. 0999 123 456"
              keyboardType="phone-pad" icon="keypad-outline" error={errors.accountNumber} />
            <Field label="Account Name" value={accountName}
              onChangeText={setAccountName} placeholder="As registered on the account"
              icon="person-outline" error={errors.accountName} />

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerText}>Collateral (Required)</Text>
            </View>

            <View style={styles.collateralNote}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
              <Text style={styles.collateralNoteText}>All loans require collateral. Add photos of your item for verification.</Text>
            </View>

            <Field label="Collateral Item Name" value={collateralItemName}
              onChangeText={setCollateralItemName} placeholder="e.g. iPhone 14, Toyota Corolla"
              icon="cube-outline" error={errors.collateralItemName} />
            <Field label="Description (optional)" value={collateralDescription}
              onChangeText={setCollateralDescription} placeholder="Brief description of the item"
              icon="document-text-outline" />
            <Field label="Estimated Value (MWK)" value={collateralValue}
              onChangeText={setCollateralValue} placeholder="e.g. 500000"
              keyboardType="numeric" icon="pricetag-outline" error={errors.collateralValue} />

            <Text style={styles.photoLabel}>Photos (at least 1 required)</Text>
            <View style={styles.photoRow}>
              {[{ img: collateralImage1, set: setCollateralImage1 },
                { img: collateralImage2, set: setCollateralImage2 },
                { img: collateralImage3, set: setCollateralImage3 },
              ].map((item, idx) => (
                <Pressable
                  key={idx}
                  style={styles.photoBox}
                  onPress={() => pickCollateralImage(item.set)}
                >
                  {item.img ? (
                    <Image source={{ uri: item.img }} style={styles.photoPreview} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera" size={20} color={Colors.textMuted} />
                      <Text style={styles.photoPlaceholderText}>{idx === 0 ? 'Photo 1' : idx === 1 ? 'Photo 2' : 'Photo 3'}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
            {errors.collateralImages && <Text style={styles.photoError}>{errors.collateralImages}</Text>}

            <View style={styles.termsBox}>
              <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
              <Text style={styles.termsText}>
                Late payments incur additional penalty fees. GPS tracking is active during the loan period. All data is encrypted and securely stored.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          {step > 1 && (
            <Pressable
              style={styles.backBtn}
              onPress={() => { Haptics.selectionAsync(); setStep((step - 1) as Step); }}
            >
              <Ionicons name="arrow-back" size={18} color={Colors.primary} />
              <Text style={styles.backBtnText}>Back</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.nextBtn, { flex: step > 1 ? 1 : undefined }, loading && { opacity: 0.7 }]}
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
                {loading ? 'Submitting...' : step < 3 ? 'Continue' : 'Submit Application'}
              </Text>
              <Ionicons name={step < 3 ? 'arrow-forward' : 'checkmark-circle'} size={18} color={Colors.white} />
            </LinearGradient>
          </Pressable>
        </View>

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.text },
  subtitle: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary },
  stepIndicator: { flexDirection: 'row', gap: 6 },
  stepDot: {
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  stepDotActive: { backgroundColor: Colors.primary },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.text,
    marginBottom: 8,
  },
  amountSection: { gap: 10 },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lavender,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.light,
  },
  currencyLabel: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
  },
  quickAmounts: { flexDirection: 'row', gap: 8 },
  quickAmount: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  quickAmountActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickAmountText: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.textSecondary,
  },
  quickAmountTextActive: { color: Colors.white },
  durationSection: { gap: 10 },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationBtn: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 3,
  },
  durationBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lavender,
  },
  durationLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.textSecondary,
  },
  durationLabelActive: { color: Colors.primary },
  durationRate: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textMuted,
  },
  durationRateActive: { color: Colors.secondary },
  breakdown: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  breakdownRows: { gap: 8 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.text,
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
  },
  collateralNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(107,33,168,0.08)',
    borderRadius: 8,
    padding: 8,
  },
  collateralNoteText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.primary,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionDividerText: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  categoryLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  disbursementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  disbursementOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  disbursementOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lavender,
  },
  disbursementLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.textSecondary,
  },
  disbursementLabelActive: { color: Colors.primary },
  collateralToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.lavender,
    borderRadius: 14,
    padding: 14,
  },
  toggleTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
  },
  toggleSub: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: Colors.primary },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  toggleThumbActive: { alignSelf: 'flex-end' },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.lavender,
    borderRadius: 10,
    padding: 12,
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: Colors.lavender,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.primary,
  },
  nextBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    flex: 1,
  },
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
  // Photo upload styles
  photoLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 6,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photoBox: {
    flex: 1,
    aspectRatio: 1,
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
    gap: 4,
  },
  photoPlaceholderText: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textMuted,
  },
  photoError: {
    fontSize: 11,
    color: Colors.error,
    fontFamily: 'DMSans_400Regular',
    marginTop: 4,
  },
});
