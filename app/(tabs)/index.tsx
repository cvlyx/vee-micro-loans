import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, RefreshControl, useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLoan, LoanApplication } from '@/contexts/LoanContext';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring,
} from 'react-native-reanimated';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  submitted: { label: 'Submitted', color: '#3B82F6', bg: '#DBEAFE', icon: 'time-outline' },
  under_review: { label: 'Under Review', color: '#F59E0B', bg: '#FEF3C7', icon: 'search-outline' },
  approved: { label: 'Approved', color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline' },
  disbursed: { label: 'Disbursed', color: '#8B5CF6', bg: '#EDE9FE', icon: 'arrow-up-circle-outline' },
  active: { label: 'Active', color: '#10B981', bg: '#D1FAE5', icon: 'flash-outline' },
  completed: { label: 'Completed', color: '#6B7280', bg: '#F3F4F6', icon: 'checkmark-done-outline' },
  defaulted: { label: 'Defaulted', color: '#EF4444', bg: '#FEE2E2', icon: 'warning-outline' },
};

function AnimatedCard({ children, delay, style }: { children: React.ReactNode; delay: number; style?: any }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

function CreditMeter({ score }: { score: number }) {
  const width = useSharedValue(0);
  const maxScore = 850;
  const pct = Math.min(score / maxScore, 1);

  useEffect(() => {
    width.value = withDelay(400, withTiming(pct, { duration: 1200 }));
  }, [score]);

  const barStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` as any }));

  const getLabel = () => {
    if (score >= 750) return { label: 'Excellent', color: Colors.success };
    if (score >= 650) return { label: 'Good', color: '#10B981' };
    if (score >= 550) return { label: 'Fair', color: Colors.warning };
    return { label: 'Poor', color: Colors.error };
  };

  const { label, color } = getLabel();

  return (
    <View style={meterStyles.container}>
      <View style={meterStyles.row}>
        <Text style={meterStyles.scoreText}>{score}</Text>
        <View style={[meterStyles.badge, { backgroundColor: color + '20' }]}>
          <Text style={[meterStyles.badgeText, { color }]}>{label}</Text>
        </View>
      </View>
      <View style={meterStyles.track}>
        <Animated.View style={[meterStyles.fill, barStyle, { backgroundColor: color }]} />
      </View>
      <View style={meterStyles.labels}>
        <Text style={meterStyles.labelText}>300</Text>
        <Text style={meterStyles.labelText}>Credit Score</Text>
        <Text style={meterStyles.labelText}>850</Text>
      </View>
    </View>
  );
}

const meterStyles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreText: { fontSize: 36, fontFamily: 'DMSans_700Bold', color: Colors.white },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  track: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  labelText: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.5)' },
});

function QuickAction({ icon, label, color, onPress }: {
  icon: string; label: string; color: string; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      onPressIn={() => { scale.value = withSpring(0.92); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <Animated.View style={[qaStyles.wrapper, style]}>
        <View style={[qaStyles.icon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <Text style={qaStyles.label}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const qaStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 6, width: 64 },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.textSecondary, textAlign: 'center' },
});

function LoanCard({ loan }: { loan: LoanApplication }) {
  const cfg = STATUS_CONFIG[loan.status] || STATUS_CONFIG.submitted;
  const dueDate = new Date(loan.dueDate);
  const now = new Date();
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.row}>
        <View>
          <Text style={cardStyles.amount}>MWK {loan.amount.toLocaleString()}</Text>
          <Text style={cardStyles.date}>Applied {new Date(loan.appliedAt).toLocaleDateString('en-MW', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
        <View style={[cardStyles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
          <Text style={[cardStyles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      {(loan.status === 'active' || loan.status === 'disbursed') && (
        <View style={cardStyles.dueBanner}>
          <Ionicons name="time-outline" size={14} color={daysLeft <= 3 ? Colors.error : Colors.warning} />
          <Text style={[cardStyles.dueText, { color: daysLeft <= 3 ? Colors.error : Colors.warning }]}>
            {daysLeft > 0 ? `Due in ${daysLeft} days` : daysLeft === 0 ? 'Due today!' : 'Overdue!'}
          </Text>
          <Text style={cardStyles.repayAmount}>MWK {loan.totalRepayment.toLocaleString()} to repay</Text>
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  amount: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.text },
  date: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontFamily: 'DMSans_700Bold' },
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warningLight,
    borderRadius: 10,
    padding: 10,
  },
  dueText: { fontSize: 12, fontFamily: 'DMSans_700Bold', flex: 1 },
  repayAmount: { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.textSecondary },
});

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { user } = useAuth();
  const { loans, activeLoan, refreshLoans } = useLoan();
  const [refreshing, setRefreshing] = React.useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refreshLoans();
    setRefreshing(false);
  }

  const firstName = user?.fullName?.split(' ')[0] || 'User';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header Card */}
        <AnimatedCard delay={0}>
          <LinearGradient
            colors={['#1A0533', '#3B0764', '#6B21A8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Good {getGreeting()},</Text>
                <Text style={styles.name}>{firstName}</Text>
              </View>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.limitSection}>
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Loan Limit</Text>
                <Text style={styles.limitValue}>MWK {(user?.loanLimit || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.limitDivider} />
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Active Loan</Text>
                <Text style={styles.limitValue}>
                  {activeLoan ? `MWK ${activeLoan.amount.toLocaleString()}` : 'None'}
                </Text>
              </View>
            </View>

            <CreditMeter score={user?.creditScore || 500} />

            <View style={styles.kycRow}>
              <Ionicons
                name={user?.isKycVerified ? 'shield-checkmark' : 'shield-outline'}
                size={14}
                color={user?.isKycVerified ? Colors.success : Colors.warning}
              />
              <Text style={styles.kycText}>
                {user?.isKycVerified ? 'KYC Verified' : 'KYC Pending Verification'}
              </Text>
            </View>
          </LinearGradient>
        </AnimatedCard>

        {/* Quick Actions */}
        <AnimatedCard delay={150} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickAction icon="add-circle-outline" label="Apply Loan" color={Colors.primary} onPress={() => router.push('/(tabs)/apply')} />
            <QuickAction icon="card-outline" label="Repay" color={Colors.success} onPress={() => router.push('/(tabs)/repay')} />
            <QuickAction icon="document-text-outline" label="My Loans" color={Colors.info} onPress={() => router.push('/(tabs)/loans')} />
            <QuickAction icon="calculator-outline" label="Calculator" color={Colors.warning} onPress={() => router.push('/(tabs)/apply')} />
          </View>
        </AnimatedCard>

        {/* Active Loan Banner */}
        {activeLoan && (
          <AnimatedCard delay={250} style={styles.section}>
            <Text style={styles.sectionTitle}>Active Loan</Text>
            <LoanCard loan={activeLoan} />
          </AnimatedCard>
        )}

        {/* Interest Rates */}
        <AnimatedCard delay={350} style={styles.section}>
          <Text style={styles.sectionTitle}>Interest Rates</Text>
          <View style={styles.rateGrid}>
            {[
              { duration: '1 Week', rate: '20%', days: 7 },
              { duration: '2 Weeks', rate: '30%', days: 14 },
              { duration: '3 Weeks', rate: '40%', days: 21 },
              { duration: '4 Weeks', rate: '50%', days: 30 },
            ].map((r) => (
              <View key={r.days} style={styles.rateCard}>
                <LinearGradient
                  colors={['#F3E8FF', '#EDE9FE']}
                  style={styles.rateCardInner}
                >
                  <Text style={styles.rateDuration}>{r.duration}</Text>
                  <Text style={styles.ratePercent}>{r.rate}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </AnimatedCard>

        {/* Recent Loans */}
        {loans.length > 0 && (
          <AnimatedCard delay={450} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Loans</Text>
              <Pressable onPress={() => router.push('/(tabs)/loans')}>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            </View>
            <View style={{ gap: 10 }}>
              {loans.slice(0, 3).map(loan => (
                <LoanCard key={loan.id} loan={loan} />
              ))}
            </View>
          </AnimatedCard>
        )}

        {loans.length === 0 && (
          <AnimatedCard delay={450} style={styles.section}>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="cash-off" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No Loans Yet</Text>
              <Text style={styles.emptyText}>Apply for your first loan to get started</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)/apply'); }}
              >
                <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnGradient}>
                  <Text style={styles.emptyBtnText}>Apply Now</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </AnimatedCard>
        )}

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  headerCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    marginTop: 8,
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  name: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168,85,247,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(168,85,247,0.6)',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  limitSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  limitItem: { flex: 1, gap: 4 },
  limitLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
  limitValue: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  limitDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  kycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kycText: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.6)',
  },
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.primary,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rateCard: { width: '48%' },
  rateCardInner: {
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  rateDuration: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.textSecondary,
  },
  ratePercent: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  emptyBtnGradient: {
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  emptyBtnText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
});
