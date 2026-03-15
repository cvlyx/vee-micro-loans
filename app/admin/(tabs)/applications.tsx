import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  Alert, RefreshControl, FlatList, Modal, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAdmin, AdminLoan } from '@/contexts/AdminContext';
import * as Haptics from 'expo-haptics';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';

// Collateral Viewer Modal
function CollateralModal({ visible, applicationId, onClose }: {
  visible: boolean; applicationId: string; onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [collateral, setCollateral] = useState<any>(null);

  React.useEffect(() => {
    if (visible && applicationId) {
      setLoading(true);
      fetch(`${API_URL}/admin/applications/${applicationId}/collateral`)
        .then(res => res.json())
        .then(data => {
          setCollateral(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [visible, applicationId]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={collateralModalStyles.overlay}>
        <View style={collateralModalStyles.container}>
          <View style={collateralModalStyles.header}>
            <Text style={collateralModalStyles.title}>Collateral Details</Text>
            <Pressable onPress={onClose} style={collateralModalStyles.closeBtn}>
              <Ionicons name="close" size={24} color="#F3E8FF" />
            </Pressable>
          </View>

          {loading ? (
            <View style={collateralModalStyles.loading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={collateralModalStyles.loadingText}>Loading collateral...</Text>
            </View>
          ) : collateral?.hasCollateral ? (
            <ScrollView style={collateralModalStyles.scroll}>
              <View style={collateralModalStyles.section}>
                <Text style={collateralModalStyles.label}>Item Name</Text>
                <Text style={collateralModalStyles.value}>{collateral.collateral?.itemName}</Text>
              </View>

              {collateral.collateral?.description && (
                <View style={collateralModalStyles.section}>
                  <Text style={collateralModalStyles.label}>Description</Text>
                  <Text style={collateralModalStyles.value}>{collateral.collateral?.description}</Text>
                </View>
              )}

              {collateral.collateral?.estimatedValue && (
                <View style={collateralModalStyles.section}>
                  <Text style={collateralModalStyles.label}>Estimated Value</Text>
                  <Text style={collateralModalStyles.value}>MWK {Number(collateral.collateral.estimatedValue).toLocaleString()}</Text>
                </View>
              )}

              {collateral.collateral?.images?.length > 0 && (
                <View style={collateralModalStyles.section}>
                  <Text style={collateralModalStyles.label}>Photos ({collateral.collateral.images.length})</Text>
                  <View style={collateralModalStyles.imageGrid}>
                    {collateral.collateral.images.map((img: string, idx: number) => (
                      <Image
                        key={idx}
                        source={{ uri: img }}
                        style={collateralModalStyles.image}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                </View>
              )}

              {collateral.user && (
                <View style={collateralModalStyles.section}>
                  <Text style={collateralModalStyles.label}>Applicant</Text>
                  <Text style={collateralModalStyles.value}>{collateral.user.fullName}</Text>
                  <Text style={collateralModalStyles.subValue}>{collateral.user.email}</Text>
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={collateralModalStyles.noDocs}>
              <Ionicons name="cube-outline" size={48} color={Colors.adminIconMuted} />
              <Text style={collateralModalStyles.noDocsText}>No collateral uploaded</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const collateralModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#1A0533',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168,85,247,0.2)',
  },
  title: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#F3E8FF', flex: 1 },
  closeBtn: { padding: 4 },
  scroll: { padding: 16 },
  loading: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { color: 'rgba(255,255,255,0.6)', fontFamily: 'DMSans_400Regular' },
  section: { marginBottom: 16 },
  label: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  value: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: '#F3E8FF' },
  subValue: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  image: { width: '48%', height: 120, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  noDocs: { padding: 40, alignItems: 'center', gap: 12 },
  noDocsText: { color: 'rgba(255,255,255,0.5)', fontFamily: 'DMSans_400Regular' },
});

const STATUS_FILTERS = ['all', 'submitted', 'under_review', 'approved', 'active', 'completed', 'rejected'];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  submitted: { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', label: 'Submitted' },
  under_review: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', label: 'Under Review' },
  approved: { color: '#10B981', bg: 'rgba(16,185,129,0.15)', label: 'Approved' },
  rejected: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', label: 'Rejected' },
  disbursed: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', label: 'Disbursed' },
  active: { color: '#10B981', bg: 'rgba(16,185,129,0.15)', label: 'Active' },
  completed: { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', label: 'Completed' },
  defaulted: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', label: 'Defaulted' },
};

function LoanCard({ loan, onApprove, onReject, onDisburse, onComplete, onViewCollateral }: {
  loan: AdminLoan;
  onApprove: () => void;
  onReject: () => void;
  onDisburse: () => void;
  onComplete: () => void;
  onViewCollateral: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[loan.status] || STATUS_CONFIG.submitted;

  const dueDate = new Date(loan.dueDate);
  const isOverdue = dueDate < new Date() && !['completed', 'rejected'].includes(loan.status);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
      onPress={() => { setExpanded(!expanded); Haptics.selectionAsync(); }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
          <View>
            <Text style={styles.cardName}>{loan.accountName || 'Unknown Applicant'}</Text>
            <Text style={styles.cardId}>#{loan.id.slice(-6).toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.adminIconMuted} style={{ marginTop: 4 }} />
        </View>
      </View>

      <View style={styles.cardAmounts}>
        <View>
          <Text style={styles.amountLabel}>Requested</Text>
          <Text style={styles.amountValue}>MWK {loan.amount.toLocaleString()}</Text>
        </View>
        <View>
          <Text style={styles.amountLabel}>Repayment</Text>
          <Text style={styles.amountValue}>MWK {loan.totalRepayment.toLocaleString()}</Text>
        </View>
        <View>
          <Text style={styles.amountLabel}>Duration</Text>
          <Text style={styles.amountValue}>{loan.durationDays}d</Text>
        </View>
        <View>
          <Text style={styles.amountLabel}>Rate</Text>
          <Text style={styles.amountValue}>{(loan.interestRate * 100).toFixed(0)}%</Text>
        </View>
      </View>

      {isOverdue && (
        <View style={styles.overdueTag}>
          <Ionicons name="warning-outline" size={12} color="#EF4444" />
          <Text style={styles.overdueText}>OVERDUE — Due {dueDate.toLocaleDateString()}</Text>
        </View>
      )}

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          <View style={styles.detailGrid}>
            {[
              { label: 'Applied', value: new Date(loan.appliedAt).toLocaleDateString() },
              { label: 'Due Date', value: dueDate.toLocaleDateString() },
              { label: 'Employment', value: loan.employmentStatus || '—' },
              { label: 'Employer', value: loan.employer || '—' },
              { label: 'Monthly Income', value: loan.monthlyIncome ? `MWK ${Number(loan.monthlyIncome).toLocaleString()}` : '—' },
              { label: 'Disbursement', value: loan.disbursementMethod || '—' },
              { label: 'Account', value: loan.accountNumber || '—' },
              { label: 'Next of Kin', value: loan.nextOfKinName || '—' },
              { label: 'NoK Phone', value: loan.nextOfKinPhone || '—' },
              { label: 'Processing Fee', value: `MWK ${loan.processingFee.toLocaleString()}` },
              { label: 'Interest', value: `MWK ${loan.interest.toLocaleString()}` },
              { label: 'Collateral', value: loan.hasCollateral ? (loan.collateralDescription || 'Yes') : 'None' },
            ].map(item => (
              <View key={item.label} style={styles.detailItem}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {(loan.status === 'submitted' || loan.status === 'under_review') && (
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.actionApprove, pressed && { opacity: 0.8 }]}
                onPress={onApprove}
              >
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.actionText}>Approve</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.actionReject, pressed && { opacity: 0.8 }]}
                onPress={onReject}
              >
                <Ionicons name="close-circle" size={16} color="#fff" />
                <Text style={styles.actionText}>Reject</Text>
              </Pressable>
            </View>
          )}

          {loan.status === 'approved' && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionDisburse, { marginTop: 10 }, pressed && { opacity: 0.8 }]}
              onPress={onDisburse}
            >
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.actionText}>Mark as Disbursed</Text>
            </Pressable>
          )}

          {(loan.status === 'active' || loan.status === 'disbursed') && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionComplete, { marginTop: 10 }, pressed && { opacity: 0.8 }]}
              onPress={onComplete}
            >
              <Ionicons name="checkmark-done" size={16} color="#fff" />
              <Text style={styles.actionText}>Mark as Repaid</Text>
            </Pressable>
          )}

          {/* View Collateral Button */}
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { marginTop: 10, backgroundColor: '#8B5CF6' }, pressed && { opacity: 0.8 }]}
            onPress={onViewCollateral}
          >
            <Ionicons name="cube-outline" size={16} color="#fff" />
            <Text style={styles.actionText}>View Collateral</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

export default function AdminApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { loans, approveLoan, rejectLoan, disburseLoan, completeLoan, refreshData } = useAdmin();
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [collateralModal, setCollateralModal] = useState<{ visible: boolean; applicationId: string }>({
    visible: false, applicationId: ''
  });

  const filtered = filter === 'all' ? loans : loans.filter(l => l.status === filter);

  async function onRefresh() {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }

  function handleApprove(id: string) {
    Alert.alert(
      'Approve Loan',
      'Approve this loan application? This will notify the applicant for disbursement.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            approveLoan(id);
          },
        },
      ]
    );
  }

  function handleReject(id: string) {
    Alert.alert(
      'Reject Loan',
      'Reject this application? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            rejectLoan(id);
          },
        },
      ]
    );
  }

  function handleDisburse(id: string) {
    Alert.alert(
      'Confirm Disbursement',
      'Mark this loan as disbursed? This means funds have been sent to the applicant.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              const success = await disburseLoan(id);
              if (success) {
                Alert.alert('Success', 'Loan has been marked as disbursed successfully!');
              } else {
                Alert.alert('Error', 'Failed to disburse loan. Please try again.');
              }
            } catch (error) {
              console.error('Disbursement error:', error);
              Alert.alert('Error', 'Failed to disburse loan. Please try again.');
            }
          },
        },
      ]
    );
  }

  function handleComplete(id: string) {
    Alert.alert(
      'Mark as Repaid',
      'Confirm that this loan has been fully repaid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              const success = await completeLoan(id);
              if (success) {
                Alert.alert('Success', 'Loan has been marked as repaid successfully!');
              } else {
                Alert.alert('Error', 'Failed to mark loan as repaid. Please try again.');
              }
            } catch (error) {
              console.error('Completion error:', error);
              Alert.alert('Error', 'Failed to mark loan as repaid. Please try again.');
            }
          },
        },
      ]
    );
  }

  const pendingCount = loans.filter(l => l.status === 'submitted' || l.status === 'under_review').length;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors.white, borderColor: Colors.border }]}>
          <View>
            <Text style={styles.pageTitle}>Applications</Text>
            <Text style={styles.pageSub}>
              {filtered.length} application{filtered.length !== 1 ? 's' : ''}
              {pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
            </Text>
          </View>
          <Pressable
            style={styles.refreshBtn}
            onPress={() => { Haptics.selectionAsync(); onRefresh(); }}
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          style={styles.filtersScroll}
        >
          {STATUS_FILTERS.map(s => (
            <Pressable
              key={s}
              style={[styles.filterChip, filter === s && styles.filterChipActive]}
              onPress={() => { setFilter(s); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>
                {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
                {s !== 'all' && (
                  <Text style={{ color: Colors.textSecondary }}>
                    {' '}({loans.filter(l => l.status === s).length})
                  </Text>
                )}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Loan Cards */}
        <View style={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="file-search-outline" size={48} color="rgba(168,85,247,0.3)" />
              <Text style={styles.emptyTitle}>No Applications</Text>
              <Text style={styles.emptyText}>No loans match this filter</Text>
            </View>
          ) : (
            filtered.map(loan => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onApprove={() => handleApprove(loan.id)}
                onReject={() => handleReject(loan.id)}
                onDisburse={() => handleDisburse(loan.id)}
                onComplete={() => handleComplete(loan.id)}
                onViewCollateral={() => setCollateralModal({ visible: true, applicationId: loan.id })}
              />
            ))
          )}
        </View>
        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>

      <CollateralModal
        visible={collateralModal.visible}
        applicationId={collateralModal.applicationId}
        onClose={() => setCollateralModal({ visible: false, applicationId: '' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  pageTitle: { fontSize: 24, fontFamily: 'DMSans_700Bold', color: Colors.text },
  pageSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, marginTop: 2 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.adminMutedBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersScroll: { marginBottom: 14 },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.adminMutedBg,
    borderWidth: 1,
    borderColor: Colors.adminMutedBorder,
  },
  filterChipActive: {
    backgroundColor: 'rgba(168,85,247,0.2)',
    borderColor: Colors.accent,
  },
  filterText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.textSecondary,
  },
  filterTextActive: { color: Colors.accent },
  list: { gap: 10 },
  card: {
    backgroundColor: Colors.adminCardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.adminCardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0, marginTop: 2 },
  cardName: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.text },
  cardId: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontFamily: 'DMSans_700Bold' },
  cardAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.adminMutedBg,
    borderRadius: 10,
    padding: 10,
  },
  amountLabel: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, marginBottom: 3 },
  amountValue: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.text },
  overdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  overdueText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: '#EF4444' },
  expandedContent: {},
  divider: {
    height: 1,
    backgroundColor: Colors.adminMutedBorder,
    marginVertical: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  detailItem: { width: '47%' },
  detailLabel: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, marginBottom: 2 },
  detailValue: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.text },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionApprove: { backgroundColor: '#10B981' },
  actionReject: { backgroundColor: '#EF4444' },
  actionDisburse: { backgroundColor: '#8B5CF6' },
  actionComplete: { backgroundColor: '#3B82F6' },
  actionText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 60,
    backgroundColor: Colors.adminCardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.adminCardBorder,
  },
  emptyTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.textSecondary },
  emptyText: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.textMuted },
});
