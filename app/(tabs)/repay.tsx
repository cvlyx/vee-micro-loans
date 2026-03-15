import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, Alert, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useLoan, LoanApplication } from '@/contexts/LoanContext';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
} from 'react-native-reanimated';

const PAYMENT_INSTRUCTIONS = [
  {
    method: 'Airtel Money',
    icon: 'phone-portrait-outline',
    color: '#EF4444',
    instructions: [
      'Dial *400# on your phone',
      'Select "Send Money"',
      'Enter Phoenix Loan number: 0997 971 750',
      'Enter the total repayment amount',
      'Confirm with your PIN',
      'Take a screenshot of the confirmation',
      'Upload the screenshot below',
    ],
  },
  {
    method: 'TNM Mpamba',
    icon: 'phone-portrait-outline',
    color: '#F59E0B',
    instructions: [
      'Dial *929# on your phone',
      'Select "Send Money"',
      'Enter Phoenix Loan number: 0894 741 508',
      'Enter the total repayment amount',
      'Confirm with your PIN',
      'Take a screenshot of the confirmation',
      'Upload the screenshot below',
    ],
  },
  {
    method: 'Bank Transfer',
    icon: 'business-outline',
    color: '#3B82F6',
    instructions: [
      'Transfer to: Phoenix Loan Services',
      'Account Number: 1234567890',
      'Bank: National Bank of Malawi',
      'Branch: Lilongwe City Branch',
      'Use your loan ID as reference',
      'Upload the receipt/transfer slip below',
    ],
  },
];

function AnimCountdown({ daysLeft }: { daysLeft: number }) {
  const isOverdue = daysLeft < 0;
  const color = isOverdue ? Colors.error : daysLeft <= 3 ? Colors.warning : Colors.success;

  return (
    <View style={countdownStyles.container}>
      <LinearGradient
        colors={isOverdue ? ['#FEE2E2', '#FECACA'] : daysLeft <= 3 ? ['#FEF3C7', '#FDE68A'] : ['#D1FAE5', '#A7F3D0']}
        style={countdownStyles.inner}
      >
        <Text style={[countdownStyles.number, { color }]}>
          {Math.abs(daysLeft)}
        </Text>
        <Text style={[countdownStyles.label, { color }]}>
          {isOverdue ? 'Days Overdue' : daysLeft === 0 ? 'Due Today' : 'Days Left'}
        </Text>
      </LinearGradient>
    </View>
  );
}

const countdownStyles = StyleSheet.create({
  container: { alignItems: 'center' },
  inner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  number: { fontSize: 32, fontFamily: 'DMSans_700Bold' },
  label: { fontSize: 11, fontFamily: 'DMSans_500Medium', textAlign: 'center' },
});

function PaymentMethodCard({ method, selected, onSelect }: {
  method: typeof PAYMENT_INSTRUCTIONS[0];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      style={[pmStyles.card, selected && pmStyles.cardSelected]}
      onPress={() => { Haptics.selectionAsync(); onSelect(); }}
    >
      <View style={[pmStyles.icon, { backgroundColor: method.color + '20' }]}>
        <Ionicons name={method.icon as any} size={20} color={method.color} />
      </View>
      <Text style={[pmStyles.label, selected && pmStyles.labelSelected]}>{method.method}</Text>
      {selected && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
    </Pressable>
  );
}

const pmStyles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lavender,
  },
  icon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  labelSelected: { color: Colors.primary },
});

function RatingModal({ loan, onClose }: { loan: LoanApplication; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const { rateLoan } = useLoan();

  async function submit() {
    if (rating === 0) { Alert.alert('Please select a rating'); return; }
    await rateLoan(loan.id, rating, review);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
    Alert.alert('Thank You!', 'Your feedback has been submitted.');
  }

  return (
    <Modal visible animationType="slide" transparent presentationStyle="overFullScreen">
      <Pressable style={ratingStyles.overlay} onPress={onClose}>
        <View style={ratingStyles.container}>
          <View style={ratingStyles.handle} />
          <Text style={ratingStyles.title}>Rate Your Experience</Text>
          <Text style={ratingStyles.subtitle}>How was your experience with Phoenix Loan?</Text>

          <View style={ratingStyles.stars}>
            {[1, 2, 3, 4, 5].map(s => (
              <Pressable key={s} onPress={() => { Haptics.selectionAsync(); setRating(s); }}>
                <Ionicons name={s <= rating ? 'star' : 'star-outline'} size={36} color={s <= rating ? '#F59E0B' : Colors.border} />
              </Pressable>
            ))}
          </View>

          <View style={ratingStyles.reviewBox}>
            <MaterialCommunityIcons name="comment-outline" size={18} color={Colors.textMuted} />
            <Text style={ratingStyles.reviewPlaceholder}>
              {review || 'Leave a review (optional)...'}
            </Text>
          </View>

          <Pressable style={ratingStyles.submitBtn} onPress={submit}>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ratingStyles.submitBtnInner}>
              <Text style={ratingStyles.submitBtnText}>Submit Feedback</Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={ratingStyles.skipBtn} onPress={onClose}>
            <Text style={ratingStyles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const ratingStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 16, alignItems: 'center',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, marginBottom: 8,
  },
  title: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.text },
  subtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, textAlign: 'center' },
  stars: { flexDirection: 'row', gap: 8 },
  reviewBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    width: '100%', backgroundColor: Colors.background,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border,
  },
  reviewPlaceholder: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.textMuted, flex: 1 },
  submitBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  submitBtnInner: {
    paddingVertical: 15, alignItems: 'center',
  },
  submitBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.white },
  skipBtn: { paddingVertical: 8 },
  skipText: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary },
});

export default function RepayScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { loans, activeLoan, uploadRepaymentProof } = useLoan();
  const [selectedMethod, setSelectedMethod] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [ratingLoan, setRatingLoan] = useState<LoanApplication | null>(null);
  const [uploading, setUploading] = useState(false);

  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'disbursed');
  const completedLoans = loans.filter(l => l.status === 'completed');
  const hasActiveLoans = activeLoans.length > 0;

  async function handleUploadProof() {
    if (!activeLoan) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload payment proof.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      await uploadRepaymentProof(activeLoan.id);
      setUploading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRatingLoan(activeLoan);
      setShowRating(true);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Repayment</Text>

        {!hasActiveLoans ? (
          <View style={styles.noLoanCard}>
            <MaterialCommunityIcons name="check-circle-outline" size={52} color={Colors.success} />
            <Text style={styles.noLoanTitle}>No Active Loans</Text>
            <Text style={styles.noLoanText}>
              You don't have any active loans to repay. Apply for a new loan when you need fast cash.
            </Text>
            <View style={styles.historyStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{loans.length}</Text>
                <Text style={styles.statLabel}>Total Loans</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completedLoans.length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.success }]}>
                  {loans.length > 0 ? Math.round((completedLoans.length / loans.length) * 100) : 0}%
                </Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* Active loan summary */}
            {activeLoan && (() => {
              const daysLeft = Math.ceil((new Date(activeLoan.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <LinearGradient
                  colors={['#1A0533', '#3B0764', '#6B21A8']}
                  style={styles.activeLoanCard}
                >
                  <View style={styles.activeLoanHeader}>
                    <View>
                      <Text style={styles.activeLoanLabel}>Amount to Repay</Text>
                      <Text style={styles.activeLoanAmount}>
                        MWK {activeLoan.totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Text>
                    </View>
                    <AnimCountdown daysLeft={daysLeft} />
                  </View>

                  <View style={styles.activeLoanMeta}>
                    {[
                      { label: 'Principal', value: `MWK ${activeLoan.amount.toLocaleString()}` },
                      { label: 'Interest', value: `MWK ${activeLoan.interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                      { label: 'Due', value: new Date(activeLoan.dueDate).toLocaleDateString('en-MW', { day: 'numeric', month: 'short' }) },
                    ].map(m => (
                      <View key={m.label} style={styles.metaItem}>
                        <Text style={styles.metaLabel}>{m.label}</Text>
                        <Text style={styles.metaValue}>{m.value}</Text>
                      </View>
                    ))}
                  </View>

                  {daysLeft < 0 && (
                    <View style={styles.penaltyBanner}>
                      <Ionicons name="warning" size={14} color={Colors.warning} />
                      <Text style={styles.penaltyText}>
                        Late penalty applies. Contact support immediately.
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              );
            })()}

            {/* Payment methods */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pay Via</Text>
              <View style={styles.methodRow}>
                {PAYMENT_INSTRUCTIONS.map((m, i) => (
                  <PaymentMethodCard
                    key={m.method}
                    method={m}
                    selected={selectedMethod === i}
                    onSelect={() => setSelectedMethod(i)}
                  />
                ))}
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsCard}>
              <View style={styles.instructionsHeader}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.instructionsTitle}>
                  How to pay via {PAYMENT_INSTRUCTIONS[selectedMethod].method}
                </Text>
              </View>
              <View style={styles.instructionsList}>
                {PAYMENT_INSTRUCTIONS[selectedMethod].instructions.map((inst, i) => (
                  <View key={i} style={styles.instructionItem}>
                    <View style={styles.instructionNum}>
                      <Text style={styles.instructionNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{inst}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Upload Proof */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadTitle}>Upload Payment Proof</Text>
              <Text style={styles.uploadSubtitle}>
                After making payment, upload a screenshot or receipt to confirm your repayment.
              </Text>

              <Pressable
                style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }, uploading && { opacity: 0.7 }]}
                onPress={handleUploadProof}
                disabled={uploading}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.uploadBtnInner}
                >
                  <Ionicons name={uploading ? 'cloud-upload-outline' : 'image-outline'} size={20} color={Colors.white} />
                  <Text style={styles.uploadBtnText}>
                    {uploading ? 'Uploading...' : 'Upload Proof of Payment'}
                  </Text>
                </LinearGradient>
              </Pressable>

              <View style={styles.acceptedFormats}>
                <Ionicons name="document-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.acceptedText}>Accepted: JPG, PNG, PDF screenshots</Text>
              </View>
            </View>
          </>
        )}

        {/* Completed loans */}
        {completedLoans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {completedLoans.map(loan => (
              <View key={loan.id} style={styles.historyCard}>
                <View style={[styles.historyIcon, { backgroundColor: Colors.successLight }]}>
                  <Ionicons name="checkmark-done" size={18} color={Colors.success} />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyAmount}>MWK {loan.amount.toLocaleString()}</Text>
                  <Text style={styles.historyDate}>
                    Completed {new Date(loan.appliedAt).toLocaleDateString('en-MW', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                {loan.rating ? (
                  <View style={styles.ratingChip}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{loan.rating}</Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.rateBtn}
                    onPress={() => { Haptics.selectionAsync(); setRatingLoan(loan); setShowRating(true); }}
                  >
                    <Text style={styles.rateBtnText}>Rate</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>

      {showRating && ratingLoan && (
        <RatingModal loan={ratingLoan} onClose={() => { setShowRating(false); setRatingLoan(null); }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  title: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    marginBottom: 16,
  },
  noLoanCard: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  noLoanTitle: { fontSize: 20, fontFamily: 'DMSans_700Bold', color: Colors.text },
  noLoanText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  historyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lavender,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.text },
  statLabel: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary },
  statSep: { width: 1, height: 36, backgroundColor: Colors.border },
  activeLoanCard: {
    borderRadius: 20,
    padding: 20,
    gap: 14,
    marginBottom: 16,
  },
  activeLoanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeLoanLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  activeLoanAmount: {
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  activeLoanMeta: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
  },
  metaItem: { flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.5)' },
  metaValue: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.white, marginTop: 2 },
  penaltyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 8,
    padding: 10,
  },
  penaltyText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warning,
    flex: 1,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    marginBottom: 12,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  instructionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    gap: 12,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    flex: 1,
  },
  instructionsList: { gap: 10 },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  instructionNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  instructionNumText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
  },
  instructionText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  uploadSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    marginBottom: 16,
  },
  uploadTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.text },
  uploadSubtitle: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  uploadBtn: { borderRadius: 14, overflow: 'hidden' },
  uploadBtnInner: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.white },
  acceptedFormats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptedText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textMuted,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: { flex: 1 },
  historyAmount: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.text },
  historyDate: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  ratingText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#D97706' },
  rateBtn: {
    backgroundColor: Colors.lavender,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rateBtnText: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.primary },
});
