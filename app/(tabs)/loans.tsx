import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, RefreshControl, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useLoan, LoanApplication, LoanStatus } from '@/contexts/LoanContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const STATUS_CONFIG: Record<LoanStatus, { label: string; color: string; bg: string; icon: string; step: number }> = {
  submitted: { label: 'Submitted', color: '#3B82F6', bg: '#DBEAFE', icon: 'time-outline', step: 1 },
  under_review: { label: 'Under Review', color: '#F59E0B', bg: '#FEF3C7', icon: 'search-outline', step: 2 },
  approved: { label: 'Approved', color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle-outline', step: 3 },
  rejected: { label: 'Rejected', color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline', step: -1 },
  disbursed: { label: 'Disbursed', color: '#8B5CF6', bg: '#EDE9FE', icon: 'arrow-up-circle-outline', step: 4 },
  active: { label: 'Active', color: '#10B981', bg: '#D1FAE5', icon: 'flash-outline', step: 5 },
  completed: { label: 'Completed', color: '#6B7280', bg: '#F3F4F6', icon: 'checkmark-done-outline', step: 6 },
  defaulted: { label: 'Defaulted', color: '#EF4444', bg: '#FEE2E2', icon: 'warning-outline', step: -2 },
};

const FILTER_OPTIONS: { key: LoanStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'In Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
];

function StatusTimeline({ status }: { status: LoanStatus }) {
  const stages = ['submitted', 'under_review', 'approved', 'disbursed', 'active', 'completed'];
  const cfg = STATUS_CONFIG[status];
  const currentStep = cfg.step;

  if (status === 'rejected' || status === 'defaulted') {
    return (
      <View style={timelineStyles.rejected}>
        <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
        <Text style={[timelineStyles.rejectedText, { color: cfg.color }]}>
          Application {cfg.label}
        </Text>
      </View>
    );
  }

  return (
    <View style={timelineStyles.container}>
      {stages.map((stage, i) => {
        const s = STATUS_CONFIG[stage as LoanStatus];
        const isActive = s.step <= currentStep;
        const isCurrent = stage === status;
        return (
          <View key={stage} style={timelineStyles.stageRow}>
            <View style={timelineStyles.leftCol}>
              <View style={[timelineStyles.dot, isActive && timelineStyles.dotActive, isCurrent && timelineStyles.dotCurrent]}>
                {isActive && !isCurrent ? (
                  <Ionicons name="checkmark" size={10} color={Colors.white} />
                ) : isCurrent ? (
                  <View style={timelineStyles.dotInner} />
                ) : null}
              </View>
              {i < stages.length - 1 && (
                <View style={[timelineStyles.line, isActive && timelineStyles.lineActive]} />
              )}
            </View>
            <View style={timelineStyles.stageInfo}>
              <Text style={[timelineStyles.stageName, isActive && timelineStyles.stageNameActive]}>
                {s.label}
              </Text>
              {isCurrent && (
                <Text style={timelineStyles.stageCurrent}>Current Status</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  container: { gap: 0 },
  stageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  leftCol: { alignItems: 'center', width: 20 },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotCurrent: {
    backgroundColor: Colors.white, borderColor: Colors.primary,
    width: 22, height: 22, borderRadius: 11,
  },
  dotInner: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  line: {
    width: 2, flex: 1, minHeight: 20,
    backgroundColor: Colors.border, marginVertical: 2,
  },
  lineActive: { backgroundColor: Colors.primary },
  stageInfo: { paddingBottom: 14 },
  stageName: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.textMuted,
  },
  stageNameActive: { color: Colors.text, fontFamily: 'DMSans_700Bold' },
  stageCurrent: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.primary,
    marginTop: 2,
  },
  rejected: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10,
    backgroundColor: Colors.errorLight,
  },
  rejectedText: {
    fontSize: 14, fontFamily: 'DMSans_700Bold',
  },
});

function LoanDetailModal({ loan, onClose }: { loan: LoanApplication | null; onClose: () => void }) {
  if (!loan) return null;
  const cfg = STATUS_CONFIG[loan.status];
  const dueDate = new Date(loan.dueDate);
  const now = new Date();
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Modal visible={!!loan} animationType="slide" transparent presentationStyle="overFullScreen">
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <View style={modalStyles.container}>
          <Pressable style={modalStyles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={modalStyles.header}>
              <View>
                <Text style={modalStyles.amount}>MWK {loan.amount.toLocaleString()}</Text>
                <Text style={modalStyles.date}>Applied {new Date(loan.appliedAt).toLocaleDateString('en-MW', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </View>
              <View style={[modalStyles.statusBadge, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                <Text style={[modalStyles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>

            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionTitle}>Loan Status</Text>
              <StatusTimeline status={loan.status} />
            </View>

            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionTitle}>Loan Details</Text>
              {[
                { label: 'Principal', value: `MWK ${loan.amount.toLocaleString()}` },
                { label: 'Interest Rate', value: `${(loan.interestRate * 100).toFixed(0)}%` },
                { label: 'Interest Amount', value: `MWK ${loan.interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                { label: 'Processing Fee', value: `MWK ${loan.processingFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                { label: 'Total Repayment', value: `MWK ${loan.totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, highlight: true },
                { label: 'Duration', value: `${loan.durationDays} days` },
                { label: 'Due Date', value: dueDate.toLocaleDateString('en-MW', { day: 'numeric', month: 'short', year: 'numeric' }) },
              ].map(r => (
                <View key={r.label} style={modalStyles.detailRow}>
                  <Text style={modalStyles.detailLabel}>{r.label}</Text>
                  <Text style={[modalStyles.detailValue, r.highlight && { color: Colors.primary, fontFamily: 'DMSans_700Bold' }]}>
                    {r.value}
                  </Text>
                </View>
              ))}
            </View>

            {(loan.status === 'active' || loan.status === 'disbursed') && (
              <View style={[modalStyles.dueAlert, { backgroundColor: daysLeft <= 3 ? Colors.errorLight : Colors.warningLight }]}>
                <Ionicons name="alarm-outline" size={20} color={daysLeft <= 3 ? Colors.error : Colors.warning} />
                <Text style={[modalStyles.dueAlertText, { color: daysLeft <= 3 ? Colors.error : Colors.warning }]}>
                  {daysLeft > 0 ? `${daysLeft} days remaining to repay` : daysLeft === 0 ? 'Due today!' : `${Math.abs(daysLeft)} days overdue`}
                </Text>
              </View>
            )}

            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionTitle}>Disbursement</Text>
              <View style={modalStyles.detailRow}>
                <Text style={modalStyles.detailLabel}>Method</Text>
                <Text style={modalStyles.detailValue}>{loan.disbursementMethod.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
              </View>
              <View style={modalStyles.detailRow}>
                <Text style={modalStyles.detailLabel}>Account</Text>
                <Text style={modalStyles.detailValue}>{loan.accountNumber}</Text>
              </View>
              <View style={modalStyles.detailRow}>
                <Text style={modalStyles.detailLabel}>Name</Text>
                <Text style={modalStyles.detailValue}>{loan.accountName}</Text>
              </View>
            </View>

            {(loan.status === 'active' || loan.status === 'disbursed') && (
              <Pressable
                style={modalStyles.repayBtn}
                onPress={() => { onClose(); router.push('/(tabs)/repay'); }}
              >
                <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={modalStyles.repayBtnInner}>
                  <Text style={modalStyles.repayBtnText}>Make Repayment</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </LinearGradient>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  amount: { fontSize: 26, fontFamily: 'DMSans_700Bold', color: Colors.text },
  date: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  section: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: Colors.background,
    borderRadius: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.text,
  },
  dueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  dueAlertText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  repayBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  repayBtnInner: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  repayBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.white },
});

export default function LoansScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { loans, refreshLoans } = useLoan();
  const [filter, setFilter] = useState<LoanStatus | 'all'>('all');
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = filter === 'all' ? loans : loans.filter(l => l.status === filter);

  async function onRefresh() {
    setRefreshing(true);
    await refreshLoans();
    setRefreshing(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Loans</Text>
          <Text style={styles.count}>{loans.length} total</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {FILTER_OPTIONS.map(opt => (
            <Pressable
              key={opt.key}
              style={[styles.filterChip, filter === opt.key && styles.filterChipActive]}
              onPress={() => { Haptics.selectionAsync(); setFilter(opt.key); }}
            >
              <Text style={[styles.filterText, filter === opt.key && styles.filterTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-search-outline" size={52} color={Colors.border} />
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No Loans Yet' : `No ${filter.replace('_', ' ')} loans`}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'Apply for your first loan to get started' : 'Change the filter to see other loans'}
            </Text>
            {filter === 'all' && (
              <Pressable
                style={styles.applyBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)/apply'); }}
              >
                <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.applyBtnInner}>
                  <Text style={styles.applyBtnText}>Apply Now</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.loanList}>
            {filtered.map(loan => {
              const cfg = STATUS_CONFIG[loan.status];
              const dueDate = new Date(loan.dueDate);
              const daysLeft = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isActive = loan.status === 'active' || loan.status === 'disbursed';

              return (
                <Pressable
                  key={loan.id}
                  style={({ pressed }) => [styles.loanCard, pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedLoan(loan); }}
                >
                  <View style={styles.loanCardTop}>
                    <View style={styles.loanCardLeft}>
                      <View style={[styles.loanIcon, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
                      </View>
                      <View>
                        <Text style={styles.loanAmount}>MWK {loan.amount.toLocaleString()}</Text>
                        <Text style={styles.loanDate}>
                          {new Date(loan.appliedAt).toLocaleDateString('en-MW', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                    <View>
                      <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.statusChipText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.loanMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Duration</Text>
                      <Text style={styles.metaValue}>{loan.durationDays} days</Text>
                    </View>
                    <View style={styles.metaSep} />
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Interest</Text>
                      <Text style={styles.metaValue}>{(loan.interestRate * 100).toFixed(0)}%</Text>
                    </View>
                    <View style={styles.metaSep} />
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Repay</Text>
                      <Text style={styles.metaValue}>MWK {loan.totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
                    </View>
                  </View>

                  {isActive && (
                    <View style={[styles.dueBanner, { backgroundColor: daysLeft <= 3 ? Colors.errorLight : Colors.warningLight }]}>
                      <Ionicons name="alarm" size={12} color={daysLeft <= 3 ? Colors.error : Colors.warning} />
                      <Text style={[styles.dueText, { color: daysLeft <= 3 ? Colors.error : Colors.warning }]}>
                        {daysLeft > 0 ? `Due in ${daysLeft} days` : daysLeft === 0 ? 'Due today!' : 'Overdue!'}
                      </Text>
                    </View>
                  )}

                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={styles.chevron} />
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>

      <LoanDetailModal loan={selectedLoan} onClose={() => setSelectedLoan(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.text },
  count: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary },
  filterScroll: { marginBottom: 16 },
  filterContent: { gap: 8, paddingRight: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.textSecondary,
  },
  filterTextActive: { color: Colors.white },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.text },
  emptyText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  applyBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  applyBtnInner: { paddingHorizontal: 28, paddingVertical: 12 },
  applyBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.white },
  loanList: { gap: 10 },
  loanCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  loanCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loanIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loanAmount: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.text },
  loanDate: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusChipText: { fontSize: 11, fontFamily: 'DMSans_700Bold' },
  loanMeta: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  metaItem: { flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.textMuted },
  metaValue: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.text, marginTop: 2 },
  metaSep: { width: 1, height: 28, backgroundColor: Colors.border },
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  dueText: { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  chevron: { position: 'absolute', right: 14, top: 18 },
});
