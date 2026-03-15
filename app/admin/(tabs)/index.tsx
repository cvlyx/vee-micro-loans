import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAdmin } from '@/contexts/AdminContext';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring,
} from 'react-native-reanimated';

// Format number with K, M, B, T suffixes (for amounts)
function formatCompact(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num < 1000) {
    return Math.floor(num).toString();
  }
  
  const suffixes = ['K', 'M', 'B', 'T'];
  let tier = 0;
  let scaled = num;
  
  while (scaled >= 1000 && tier < suffixes.length) {
    scaled = scaled / 1000;
    tier++;
  }
  
  const suffix = tier > 0 ? suffixes[tier - 1] : '';
  
  // Format: whole number or 1 decimal place
  const formatted = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
  return `${formatted}${suffix}`;
}

// Format currency with K, M, B, T suffixes
function formatCompactCurrency(num: number): string {
  return `MWK ${formatCompact(num)}`;
}

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: string; icon: string; color: string; sub?: string;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[cardStyles.container, style]}>
      <View style={[cardStyles.iconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={cardStyles.value} numberOfLines={1}>{value}</Text>
      <Text style={cardStyles.label} numberOfLines={1}>{label}</Text>
      <Text style={cardStyles.sub} numberOfLines={1}>{sub || ' '}</Text>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    flex: 1,
    minWidth: '47%',
    minHeight: 130,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.text },
  label: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary },
  sub: { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.primary, marginTop: 2 },
});

function RecentLoanRow({ loan, onAction }: {
  loan: { id: string; amount: number; status: string; appliedAt: string; accountName: string; disbursementMethod?: string };
  onAction: () => void;
}) {
  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    submitted: { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    under_review: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    approved: { color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    rejected: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    disbursed: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
    active: { color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    completed: { color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
    defaulted: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  };
  const cfg = STATUS_COLORS[loan.status] || STATUS_COLORS.submitted;

  return (
    <Pressable
      style={({ pressed }) => [rowStyles.container, pressed && { opacity: 0.8 }]}
      onPress={onAction}
    >
      <View style={[rowStyles.statusDot, { backgroundColor: cfg.color }]} />
      <View style={rowStyles.info}>
        <Text style={rowStyles.name}>{loan.accountName || 'Applicant'}</Text>
        <Text style={rowStyles.amount}>MWK {loan.amount.toLocaleString()}</Text>
      </View>
      <View style={[rowStyles.badge, { backgroundColor: cfg.bg }]}>
        <Text style={[rowStyles.badgeText, { color: cfg.color }]}>
          {loan.status.replace('_', ' ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={Colors.adminIconMuted} />
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.adminMutedBorder,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  info: { flex: 1 },
  name: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.text },
  amount: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, marginTop: 1 },
  badge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontFamily: 'DMSans_700Bold' },
});

export default function AdminOverviewScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { stats, loans, users, totalRevenue, pendingCount, adminLogout, refreshData } = useAdmin();
  const [refreshing, setRefreshing] = React.useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }

  const recentLoans = loans.slice(0, 6);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors.white, borderColor: Colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.adminIcon, { backgroundColor: Colors.primary }]}>
              <MaterialCommunityIcons name="shield-crown" size={18} color={Colors.white} />
            </View>
            <View>
              <Text style={[styles.adminLabel, { color: Colors.primary }]}>ADMIN PANEL</Text>
              <Text style={[styles.adminTitle, { color: Colors.text }]}>Overview</Text>
            </View>
          </View>
          <Pressable
            style={styles.logoutBtn}
            onPress={() => {
              Haptics.selectionAsync();
              adminLogout();
              router.replace('/auth/welcome');
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Revenue Banner */}
        <View style={[styles.revenueBanner, { backgroundColor: Colors.primary, borderColor: Colors.border }]}>
          <View>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={[styles.revenueValue, { color: Colors.white }]}>
              MWK {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={styles.revenueMeta}>
            <View style={styles.revenueMetaItem}>
              <Text style={[styles.revenueMetaVal, { color: Colors.white }]}>{users.length}</Text>
              <Text style={[styles.revenueMetaLabel, { color: 'rgba(255,255,255,0.7)' }]}>Users</Text>
            </View>
            <View style={styles.revenueMetaDivider} />
            <View style={styles.revenueMetaItem}>
              <Text style={[styles.revenueMetaVal, { color: '#FCD34D' }]}>{pendingCount}</Text>
              <Text style={[styles.revenueMetaLabel, { color: 'rgba(255,255,255,0.7)' }]}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Loans"
            value={formatCompact(stats.totalLoans)}
            icon="document-text-outline"
            color="#A855F7"
            sub={formatCompactCurrency(stats.totalDisbursed) + ' disbursed'}
          />
          <StatCard
            label="Active Loans"
            value={formatCompact(stats.activeLoans)}
            icon="flash-outline"
            color="#10B981"
          />
          <StatCard
            label="Completed"
            value={formatCompact(stats.completedLoans)}
            icon="checkmark-done-outline"
            color="#3B82F6"
            sub={formatCompactCurrency(stats.totalRepaid) + ' repaid'}
          />
          <StatCard
            label="Rejected"
            value={formatCompact(stats.rejectedLoans)}
            icon="close-circle-outline"
            color="#EF4444"
          />
        </View>

        {/* Pending Approvals Alert */}
        {pendingCount > 0 && (
          <Pressable
            style={styles.pendingAlert}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/admin/(tabs)/applications'); }}
          >
            <LinearGradient
              colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pendingAlertInner}
            >
              <View style={styles.pendingAlertLeft}>
                <View style={styles.pendingDot}>
                  <Text style={styles.pendingDotText}>{pendingCount}</Text>
                </View>
                <View>
                  <Text style={styles.pendingAlertTitle}>Pending Approvals</Text>
                  <Text style={styles.pendingAlertSub}>Tap to review loan applications</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#F59E0B" />
            </LinearGradient>
          </Pressable>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {[
              { label: 'Review Apps', icon: 'clipboard-outline', route: '/admin/(tabs)/applications', color: '#A855F7' },
              { label: 'Manage Users', icon: 'people-outline', route: '/admin/(tabs)/users', color: '#3B82F6' },
              { label: 'Rate Settings', icon: 'settings-outline', route: '/admin/(tabs)/settings', color: '#10B981' },
            ].map(action => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
                onPress={() => { Haptics.selectionAsync(); router.push(action.route as any); }}
              >
                <View style={[styles.qaIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon as any} size={20} color={action.color} />
                </View>
                <Text style={styles.qaLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Applications */}
        {recentLoans.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Applications</Text>
              <Pressable onPress={() => router.push('/admin/(tabs)/applications')}>
                <Text style={styles.seeAll}>View all</Text>
              </Pressable>
            </View>
            <View style={styles.card}>
              {recentLoans.map(loan => (
                <RecentLoanRow
                  key={loan.id}
                  loan={loan}
                  onAction={() => { Haptics.selectionAsync(); router.push('/admin/(tabs)/applications'); }}
                />
              ))}
            </View>
          </View>
        )}

        {loans.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="file-search-outline" size={48} color="rgba(168,85,247,0.3)" />
            <Text style={styles.emptyTitle}>No Loan Applications</Text>
            <Text style={styles.emptyText}>Applications from users will appear here</Text>
          </View>
        )}

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(168,85,247,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  adminLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.accent,
    letterSpacing: 2,
  },
  adminTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.adminMutedBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.adminMutedBorder,
  },
  revenueBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  revenueLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  revenueMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  revenueMetaItem: { alignItems: 'center' },
  revenueMetaVal: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  revenueMetaLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
  revenueMetaDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  pendingAlert: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  pendingAlertInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  pendingAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDotText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  pendingAlertTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: '#F59E0B',
  },
  pendingAlertSub: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    marginBottom: 10,
  },
  seeAll: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.accent,
    marginBottom: 10,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.adminCardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.adminCardBorder,
  },
  qaIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.adminCardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.adminCardBorder,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 48,
    backgroundColor: Colors.adminCardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.adminCardBorder,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
