import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  Alert, RefreshControl, TextInput, Modal, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAdmin, AdminUser } from '@/contexts/AdminContext';
import * as Haptics from 'expo-haptics';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';

// Document Viewer Modal
function DocumentModal({ visible, userId, userName, onClose }: {
  visible: boolean; userId: string; userName: string; onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any>(null);

  React.useEffect(() => {
    if (visible && userId) {
      setLoading(true);
      fetch(`${API_URL}/admin/users/${userId}/documents`)
        .then(res => res.json())
        .then(data => {
          setDocuments(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [visible, userId]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={docModalStyles.overlay}>
        <View style={docModalStyles.container}>
          <View style={docModalStyles.header}>
            <Text style={docModalStyles.title}>KYC Documents - {userName}</Text>
            <Pressable onPress={onClose} style={docModalStyles.closeBtn}>
              <Ionicons name="close" size={24} color="#F3E8FF" />
            </Pressable>
          </View>

          {loading ? (
            <View style={docModalStyles.loading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={docModalStyles.loadingText}>Loading documents...</Text>
            </View>
          ) : documents?.hasDocuments ? (
            <ScrollView style={docModalStyles.scroll}>
              <View style={docModalStyles.section}>
                <Text style={docModalStyles.label}>Document Type</Text>
                <Text style={docModalStyles.value}>
                  {documents.documents?.idDocumentType === 'national_id' ? 'National ID' : 'Passport'}
                </Text>
              </View>

              {documents.documents?.idDocumentImage && (
                <View style={docModalStyles.section}>
                  <Text style={docModalStyles.label}>ID Document</Text>
                  <Image
                    source={{ uri: documents.documents.idDocumentImage }}
                    style={docModalStyles.image}
                    resizeMode="contain"
                  />
                </View>
              )}

              {documents.documents?.selfieWithIdImage && (
                <View style={docModalStyles.section}>
                  <Text style={docModalStyles.label}>Selfie with ID</Text>
                  <Image
                    source={{ uri: documents.documents.selfieWithIdImage }}
                    style={docModalStyles.image}
                    resizeMode="contain"
                  />
                </View>
              )}

              <View style={docModalStyles.statusRow}>
                <Text style={docModalStyles.label}>Verification Status</Text>
                <View style={[docModalStyles.statusBadge, documents.user?.isKycVerified && docModalStyles.statusVerified]}>
                  <Text style={[docModalStyles.statusText, documents.user?.isKycVerified && docModalStyles.statusTextVerified]}>
                    {documents.user?.isKycVerified ? 'Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={docModalStyles.noDocs}>
              <Ionicons name="document-outline" size={48} color={Colors.adminIconMuted} />
              <Text style={docModalStyles.noDocsText}>No documents uploaded</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const docModalStyles = StyleSheet.create({
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
  image: { width: '100%', height: 200, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.2)' },
  statusVerified: { backgroundColor: 'rgba(16,185,129,0.2)' },
  statusText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: '#F59E0B' },
  statusTextVerified: { color: '#10B981' },
  noDocs: { padding: 40, alignItems: 'center', gap: 12 },
  noDocsText: { color: 'rgba(255,255,255,0.5)', fontFamily: 'DMSans_400Regular' },
});

function CreditMeterBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, ((score - 300) / (900 - 300)) * 100));
  const color = pct < 33 ? '#EF4444' : pct < 66 ? '#F59E0B' : '#10B981';
  return (
    <View style={meterStyles.container}>
      <View style={meterStyles.track}>
        <View style={[meterStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[meterStyles.score, { color }]}>{score}</Text>
    </View>
  );
}

const meterStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.adminMutedBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 3 },
  score: { fontSize: 12, fontFamily: 'DMSans_700Bold', minWidth: 30 },
});

function EditModal({ visible, title, initial, onSave, onClose, isNumber }: {
  visible: boolean; title: string; initial: string; onSave: (v: string) => void;
  onClose: () => void; isNumber?: boolean;
}) {
  const [value, setValue] = useState(initial);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>{title}</Text>
          <TextInput
            style={modalStyles.input}
            value={value}
            onChangeText={setValue}
            keyboardType={isNumber ? 'numeric' : 'default'}
            autoFocus
            selectTextOnFocus
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
          <View style={modalStyles.btns}>
            <Pressable style={[modalStyles.btn, modalStyles.cancel]} onPress={onClose}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[modalStyles.btn, modalStyles.save]}
              onPress={() => { onSave(value); onClose(); }}
            >
              <Text style={modalStyles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1A0533',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    gap: 16,
  },
  title: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#F3E8FF' },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(168,85,247,0.4)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    color: '#F3E8FF',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  btns: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancel: { backgroundColor: 'rgba(255,255,255,0.06)' },
  save: { backgroundColor: Colors.primary },
  cancelText: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: 'rgba(255,255,255,0.7)' },
  saveText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.white },
});

function UserCard({ user, loans, onVerifyKyc, onUpdateLimit, onUpdateScore, onBlacklist, onChangePassword, onViewDocuments }: {
  user: AdminUser;
  loans: { userId: string }[];
  onVerifyKyc: () => void;
  onUpdateLimit: (limit: number) => void;
  onUpdateScore: (score: number) => void;
  onBlacklist: () => void;
  onChangePassword: (password: string) => void;
  onViewDocuments: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingLimit, setEditingLimit] = useState(false);
  const [editingScore, setEditingScore] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  const userLoans = loans.filter(l => l.userId === user.id);
  const joinDate = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
      onPress={() => { setExpanded(!expanded); Haptics.selectionAsync(); }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user.fullName || 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.fullName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
        </View>
        <View style={styles.userMeta}>
          {user.isKycVerified ? (
            <View style={styles.kycBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              <Text style={styles.kycText}>KYC</Text>
            </View>
          ) : (
            <View style={[styles.kycBadge, styles.kycPending]}>
              <Ionicons name="time" size={12} color="#F59E0B" />
              <Text style={[styles.kycText, { color: '#F59E0B' }]}>Pending</Text>
            </View>
          )}
          {user.isBlacklisted && (
            <View style={[styles.kycBadge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Ionicons name="ban" size={12} color="#EF4444" />
              <Text style={[styles.kycText, { color: '#EF4444' }]}>Banned</Text>
            </View>
          )}
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.adminIconMuted} style={{ marginTop: 4 }} />
        </View>
      </View>

      <View style={styles.quickInfo}>
        <View style={styles.quickInfoItem}>
          <Text style={styles.quickInfoLabel}>Credit Score</Text>
          <CreditMeterBar score={user.creditScore || 500} />
        </View>
        <View style={styles.quickInfoItem}>
          <Text style={styles.quickInfoLabel}>Loan Limit</Text>
          <Text style={styles.quickInfoValue}>MWK {(user.loanLimit || 0).toLocaleString()}</Text>
        </View>
        <View style={styles.quickInfoItem}>
          <Text style={styles.quickInfoLabel}>Loans</Text>
          <Text style={styles.quickInfoValue}>{userLoans.length}</Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          <View style={styles.detailGrid}>
            {[
              { label: 'District', value: user.district || '—' },
              { label: 'Employment', value: user.employmentStatus || '—' },
              { label: 'Monthly Income', value: user.monthlyIncome ? `MWK ${Number(user.monthlyIncome).toLocaleString()}` : '—' },
              { label: 'Referral Code', value: user.referralCode || '—' },
              { label: 'Joined', value: joinDate },
              { label: 'User ID', value: '#' + user.id.slice(-6).toUpperCase() },
            ].map(item => (
              <View key={item.label} style={styles.detailItem}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.adminActions}>
            {!user.isKycVerified && (
              <Pressable
                style={({ pressed }) => [styles.adminBtn, styles.kycBtn, pressed && { opacity: 0.8 }]}
                onPress={onVerifyKyc}
              >
                <Ionicons name="shield-checkmark-outline" size={14} color="#fff" />
                <Text style={styles.adminBtnText}>Verify KYC</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.adminBtn, styles.limitBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setEditingLimit(true)}
            >
              <Ionicons name="trending-up-outline" size={14} color="#fff" />
              <Text style={styles.adminBtnText}>Set Limit</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.adminBtn, styles.scoreBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setEditingScore(true)}
            >
              <Ionicons name="analytics-outline" size={14} color="#fff" />
              <Text style={styles.adminBtnText}>Edit Score</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.adminBtn, styles.scoreBtn, pressed && { opacity: 0.8 }, { backgroundColor: '#F59E0B' }]}
              onPress={() => setEditingPassword(true)}
            >
              <Ionicons name="key-outline" size={14} color="#fff" />
              <Text style={styles.adminBtnText}>Password</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.adminBtn, styles.kycBtn, pressed && { opacity: 0.8 }, { backgroundColor: '#8B5CF6' }]}
              onPress={onViewDocuments}
            >
              <Ionicons name="document-text-outline" size={14} color="#fff" />
              <Text style={styles.adminBtnText}>Documents</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.adminBtn, styles.blacklistBtn, pressed && { opacity: 0.8 }, user.isBlacklisted && { backgroundColor: Colors.adminIconMuted }]}
              onPress={onBlacklist}
            >
              <Ionicons name={user.isBlacklisted ? "shield-checkmark-outline" : "ban-outline"} size={14} color="#fff" />
              <Text style={styles.adminBtnText}>{user.isBlacklisted ? 'Unblacklist' : 'Blacklist'}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <EditModal
        visible={editingPassword}
        title="Set New Password"
        initial=""
        onSave={v => {
          if (v && v.length >= 6) onChangePassword(v);
          else Alert.alert('Error', 'Password must be at least 6 characters');
        }}
        onClose={() => setEditingPassword(false)}
      />

      <EditModal
        visible={editingLimit}
        title="Set Loan Limit (MWK)"
        initial={(user.loanLimit || 50000).toString()}
        isNumber
        onSave={v => {
          const val = parseInt(v.replace(/,/g, ''), 10);
          if (!isNaN(val)) onUpdateLimit(val);
        }}
        onClose={() => setEditingLimit(false)}
      />
      <EditModal
        visible={editingScore}
        title="Edit Credit Score (300–900)"
        initial={(user.creditScore || 500).toString()}
        isNumber
        onSave={v => {
          const val = parseInt(v, 10);
          if (!isNaN(val) && val >= 300 && val <= 900) onUpdateScore(val);
        }}
        onClose={() => setEditingScore(false)}
      />
    </Pressable>
  );
}

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { users, loans, verifyKyc, updateLoanLimit, updateCreditScore, blacklistUser, refreshData } = useAdmin();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [docModal, setDocModal] = useState<{ visible: boolean; userId: string; userName: string }>({
    visible: false, userId: '', userName: ''
  });

  async function onRefresh() {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }

  const filtered = search.trim()
    ? users.filter(u =>
      (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search)
    )
    : users;

  function handleBlacklist(userId: string, name: string, isBlacklist: boolean) {
    Alert.alert(
      isBlacklist ? 'Unblacklist User' : 'Blacklist User',
      `Are you sure you want to ${isBlacklist ? 'unblacklist' : 'blacklist'} ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlacklist ? 'Unblacklist' : 'Blacklist',
          style: isBlacklist ? 'default' : 'destructive',
          onPress: () => {
            Haptics.notificationAsync(isBlacklist ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
            blacklistUser(userId);
          },
        },
      ]
    );
  }

  async function handleChangePassword(userId: string, newPassword: string) {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';
      const res = await fetch(`${API_URL}/admin/users/${userId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        Alert.alert('Success', 'Password updated successfully');
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to update password');
      }
    } catch {
      Alert.alert('Error', 'Network error while attempting to set password');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={[styles.header, { backgroundColor: Colors.white, borderColor: Colors.border }]}>
          <View>
            <Text style={styles.pageTitle}>Users</Text>
            <Text style={styles.pageSub}>{filtered.length} registered user{filtered.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchRow, searchFocused && styles.searchFocused]}>
          <Ionicons name="search-outline" size={18} color={searchFocused ? Colors.accent : Colors.adminIconMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, email, phone..."
            placeholderTextColor={Colors.adminPlaceholder}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.adminIconMuted} />
            </Pressable>
          )}
        </View>

        <View style={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="account-search-outline" size={48} color="rgba(168,85,247,0.3)" />
              <Text style={styles.emptyTitle}>{search ? 'No matches found' : 'No users yet'}</Text>
              <Text style={styles.emptyText}>
                {search ? 'Try a different search term' : 'Users who register will appear here'}
              </Text>
            </View>
          ) : (
            filtered.map(user => (
              <UserCard
                key={user.id}
                user={user}
                loans={loans as any}
                onVerifyKyc={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); verifyKyc(user.id); }}
                onUpdateLimit={limit => { Haptics.selectionAsync(); updateLoanLimit(user.id, limit); }}
                onUpdateScore={score => { Haptics.selectionAsync(); updateCreditScore(user.id, score); }}
                onBlacklist={() => handleBlacklist(user.id, user.fullName, user.isBlacklisted)}
                onChangePassword={pw => handleChangePassword(user.id, pw)}
                onViewDocuments={() => setDocModal({ visible: true, userId: user.id, userName: user.fullName })}
              />
            ))
          )}
        </View>

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>

      <DocumentModal
        visible={docModal.visible}
        userId={docModal.userId}
        userName={docModal.userName}
        onClose={() => setDocModal({ visible: false, userId: '', userName: '' })}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.adminMutedBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.adminMutedBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  searchFocused: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(168,85,247,0.06)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.text,
  },
  list: { gap: 10 },
  card: {
    backgroundColor: Colors.adminCardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.adminCardBorder,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(168,85,247,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.accent },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.text },
  userEmail: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, marginTop: 1 },
  userPhone: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, marginTop: 1 },
  userMeta: { alignItems: 'flex-end', gap: 4 },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  kycPending: { backgroundColor: 'rgba(245,158,11,0.15)' },
  kycText: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: '#10B981' },
  quickInfo: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.adminMutedBg,
    borderRadius: 10,
    padding: 10,
  },
  quickInfoItem: { flex: 1 },
  quickInfoLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  quickInfoValue: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.text },
  expandedContent: {},
  divider: {
    height: 1,
    backgroundColor: Colors.adminMutedBorder,
    marginVertical: 10,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  detailItem: { width: '47%' },
  detailLabel: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, marginBottom: 2 },
  detailValue: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.text },
  adminActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  adminBtnText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: '#fff' },
  kycBtn: { backgroundColor: '#10B981' },
  limitBtn: { backgroundColor: '#8B5CF6' },
  scoreBtn: { backgroundColor: '#3B82F6' },
  blacklistBtn: { backgroundColor: '#EF4444' },
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
  emptyText: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.textMuted, textAlign: 'center' },
});
