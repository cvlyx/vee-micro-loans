import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLoan } from '@/contexts/LoanContext';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

function NotificationItem({ notif, onRead }: {
  notif: { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string };
  onRead: () => void;
}) {
  const typeColors: Record<string, { color: string; bg: string; icon: string }> = {
    info: { color: Colors.info, bg: Colors.infoLight, icon: 'information-circle-outline' },
    success: { color: Colors.success, bg: Colors.successLight, icon: 'checkmark-circle-outline' },
    warning: { color: Colors.warning, bg: Colors.warningLight, icon: 'warning-outline' },
    error: { color: Colors.error, bg: Colors.errorLight, icon: 'close-circle-outline' },
  };
  const cfg = typeColors[notif.type] || typeColors.info;

  return (
    <Pressable
      style={[notifStyles.container, !notif.isRead && notifStyles.unread]}
      onPress={onRead}
    >
      <View style={[notifStyles.icon, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
      </View>
      <View style={notifStyles.content}>
        <Text style={notifStyles.title}>{notif.title}</Text>
        <Text style={notifStyles.message} numberOfLines={2}>{notif.message}</Text>
        <Text style={notifStyles.time}>
          {new Date(notif.createdAt).toLocaleDateString('en-MW', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {!notif.isRead && <View style={notifStyles.dot} />}
    </Pressable>
  );
}

const notifStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unread: {
    backgroundColor: Colors.lavender,
    borderColor: Colors.light,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1 },
  title: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.text },
  message: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, marginTop: 2, lineHeight: 17 },
  time: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.textMuted, marginTop: 4 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, marginTop: 4, flexShrink: 0,
  },
});

function SettingRow({ icon, label, value, onPress, color, rightNode, danger }: {
  icon: string; label: string; value?: string; onPress?: () => void;
  color?: string; rightNode?: React.ReactNode; danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [settingStyles.row, pressed && onPress && { opacity: 0.8 }]}
      onPress={onPress}
    >
      <View style={[settingStyles.iconWrap, { backgroundColor: (color || Colors.primary) + '15' }]}>
        <Ionicons name={icon as any} size={18} color={color || Colors.primary} />
      </View>
      <Text style={[settingStyles.label, danger && { color: Colors.error }]}>{label}</Text>
      <View style={settingStyles.right}>
        {value ? <Text style={settingStyles.value}>{value}</Text> : null}
        {rightNode}
        {onPress && !rightNode && (
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary },
});

type Tab = 'profile' | 'notifications' | 'settings';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { user, logout } = useAuth();
  const { notifications, markNotificationRead, markAllRead, unreadCount, loans } = useLoan();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [biometric, setBiometric] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const completedLoans = loans.filter(l => l.status === 'completed').length;
  const totalBorrowed = loans.reduce((sum, l) => sum + l.amount, 0);

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace('/auth/welcome');
        },
      },
    ]);
  }

  const tabs: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key: 'profile', label: 'Profile', icon: 'person-outline' },
    { key: 'notifications', label: 'Alerts', icon: 'notifications-outline', badge: unreadCount },
    { key: 'settings', label: 'Settings', icon: 'settings-outline' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <LinearGradient
          colors={['#1A0533', '#3B0764', '#6B21A8']}
          style={styles.profileHeader}
        >
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{user?.fullName?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.profileName}>{user?.fullName || 'User'}</Text>
          <Text style={styles.profilePhone}>{user?.phone}</Text>

          <View style={styles.profileBadges}>
            <View style={[styles.profileBadge, { backgroundColor: user?.isKycVerified ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)' }]}>
              <Ionicons
                name={user?.isKycVerified ? 'shield-checkmark' : 'shield-outline'}
                size={12}
                color={user?.isKycVerified ? Colors.success : Colors.warning}
              />
              <Text style={[styles.profileBadgeText, { color: user?.isKycVerified ? Colors.success : Colors.warning }]}>
                {user?.isKycVerified ? 'KYC Verified' : 'KYC Pending'}
              </Text>
            </View>
            <View style={[styles.profileBadge, { backgroundColor: 'rgba(168,85,247,0.2)' }]}>
              <MaterialCommunityIcons name="bird" size={12} color={Colors.accent} />
              <Text style={[styles.profileBadgeText, { color: Colors.accent }]}>
                {user?.referralCode}
              </Text>
            </View>
          </View>

          <View style={styles.profileStats}>
            {[
              { label: 'Credit Score', value: user?.creditScore?.toString() || '500' },
              { label: 'Total Loans', value: loans.length.toString() },
              { label: 'Completed', value: completedLoans.toString() },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={styles.statsDivider} />}
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{s.value}</Text>
                  <Text style={styles.statsLabel}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map(tab => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.key); }}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={activeTab === tab.key ? Colors.primary : Colors.textMuted}
                />
                {tab.badge && tab.badge > 0 ? (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            {[
              { label: 'Full Name', value: user?.fullName || '-', icon: 'person-outline' },
              { label: 'Email', value: user?.email || '-', icon: 'mail-outline' },
              { label: 'Phone', value: user?.phone || '-', icon: 'call-outline' },
              { label: 'Date of Birth', value: user?.dob || '-', icon: 'calendar-outline' },
              { label: 'National ID', value: user?.nationalId ? '***' + user.nationalId.slice(-4) : '-', icon: 'card-outline' },
              { label: 'District', value: user?.district || '-', icon: 'location-outline' },
              { label: 'Area', value: user?.area || '-', icon: 'map-outline' },
              { label: 'Employment', value: user?.employmentStatus || '-', icon: 'briefcase-outline' },
              { label: 'Monthly Income', value: user?.monthlyIncome ? `MWK ${parseInt(user.monthlyIncome).toLocaleString()}` : '-', icon: 'cash-outline' },
            ].map(r => (
              <View key={r.label} style={profileStyles.infoRow}>
                <View style={profileStyles.infoIcon}>
                  <Ionicons name={r.icon as any} size={14} color={Colors.primary} />
                </View>
                <View style={profileStyles.infoContent}>
                  <Text style={profileStyles.infoLabel}>{r.label}</Text>
                  <Text style={profileStyles.infoValue}>{r.value}</Text>
                </View>
              </View>
            ))}

            <View style={styles.loanLimitCard}>
              <LinearGradient colors={['#F3E8FF', '#EDE9FE']} style={styles.loanLimitInner}>
                <View>
                  <Text style={styles.loanLimitLabel}>Your Loan Limit</Text>
                  <Text style={styles.loanLimitValue}>
                    MWK {(user?.loanLimit || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.loanLimitRight}>
                  <Text style={styles.loanLimitBorrowed}>Total Borrowed</Text>
                  <Text style={styles.loanLimitBorrowedVal}>
                    MWK {totalBorrowed.toLocaleString()}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.memberSince}>
              <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.memberText}>
                Member since {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-MW', { month: 'long', year: 'numeric' }) : 'N/A'}
              </Text>
            </View>
          </View>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <View style={styles.card}>
            <View style={styles.notifHeader}>
              <Text style={styles.cardTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <Pressable
                  style={styles.markAllBtn}
                  onPress={() => { Haptics.selectionAsync(); markAllRead(); }}
                >
                  <Text style={styles.markAllText}>Mark all read</Text>
                </Pressable>
              )}
            </View>
            {notifications.length === 0 ? (
              <View style={styles.emptyNotif}>
                <Ionicons name="notifications-off-outline" size={40} color={Colors.border} />
                <Text style={styles.emptyNotifText}>No notifications yet</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {notifications.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onRead={() => { Haptics.selectionAsync(); markNotificationRead(notif.id); }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Security</Text>
              <SettingRow
                icon="finger-print-outline"
                label="Biometric Login"
                rightNode={
                  <Switch
                    value={biometric}
                    onValueChange={v => { Haptics.selectionAsync(); setBiometric(v); }}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                }
              />
              <SettingRow
                icon="lock-closed-outline"
                label="Change Password"
                onPress={() => { Haptics.selectionAsync(); Alert.alert('Coming Soon', 'Password change will be available soon.'); }}
              />
              <SettingRow
                icon="shield-checkmark-outline"
                label="KYC Verification"
                value={user?.isKycVerified ? 'Verified' : 'Pending'}
                color={user?.isKycVerified ? Colors.success : Colors.warning}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Preferences</Text>
              <SettingRow
                icon="notifications-outline"
                label="Push Notifications"
                rightNode={
                  <Switch
                    value={pushNotif}
                    onValueChange={v => { Haptics.selectionAsync(); setPushNotif(v); }}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                }
              />
              <SettingRow
                icon="moon-outline"
                label="Dark Mode"
                rightNode={
                  <Switch
                    value={darkMode}
                    onValueChange={v => { Haptics.selectionAsync(); setDarkMode(v); }}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                }
              />
              <SettingRow
                icon="language-outline"
                label="Language"
                value="English"
                onPress={() => { Haptics.selectionAsync(); Alert.alert('Coming Soon', 'Multi-language support coming soon.'); }}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Support</Text>
              <SettingRow
                icon="call-outline"
                label="Call Support"
                value="+265 997 971 750"
                color={Colors.success}
                onPress={() => { Haptics.selectionAsync(); }}
              />
              <SettingRow
                icon="chatbubble-outline"
                label="WhatsApp Support"
                value="+265 894 741 508"
                color="#25D366"
                onPress={() => { Haptics.selectionAsync(); }}
              />
              <SettingRow
                icon="document-text-outline"
                label="Terms & Conditions"
                onPress={() => { Haptics.selectionAsync(); Alert.alert('Terms & Conditions', 'Late payments incur penalty fees. Vee Micro Loans reserves the right to report defaulters. Collateral may be claimed in case of default. GPS tracking is active during loan period. Data is securely encrypted per our privacy policy.'); }}
              />
              <SettingRow
                icon="shield-outline"
                label="Privacy Policy"
                onPress={() => { Haptics.selectionAsync(); }}
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.9 }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color={Colors.error} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </Pressable>

            <Text style={styles.appVersion}>Vee Micro Loans v1.0.0 · Malawi</Text>
          </>
        )}

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>
    </View>
  );
}

const profileStyles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.lavender,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.textMuted },
  infoValue: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.text, marginTop: 1 },
});

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  profileHeader: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(168,85,247,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(168,85,247,0.6)',
    marginBottom: 4,
  },
  avatarText: { fontSize: 28, fontFamily: 'DMSans_700Bold', color: Colors.white },
  profileName: { fontSize: 20, fontFamily: 'DMSans_700Bold', color: Colors.white },
  profilePhone: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.6)' },
  profileBadges: { flexDirection: 'row', gap: 8, marginTop: 4 },
  profileBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  profileBadgeText: { fontSize: 11, fontFamily: 'DMSans_700Bold' },
  profileStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginTop: 8,
  },
  statsItem: { flex: 1, alignItems: 'center' },
  statsValue: { fontSize: 20, fontFamily: 'DMSans_700Bold', color: Colors.white },
  statsLabel: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.5)' },
  statsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: Colors.lavender,
  },
  tabLabel: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.textMuted },
  tabLabelActive: { color: Colors.primary, fontFamily: 'DMSans_700Bold' },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { fontSize: 9, fontFamily: 'DMSans_700Bold', color: Colors.white },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    marginBottom: 8,
  },
  loanLimitCard: { borderRadius: 14, overflow: 'hidden', marginTop: 12 },
  loanLimitInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  loanLimitLabel: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary },
  loanLimitValue: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.primary },
  loanLimitRight: { alignItems: 'flex-end' },
  loanLimitBorrowed: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary },
  loanLimitBorrowedVal: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.text },
  memberSince: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8,
  },
  memberText: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.textMuted },
  notifHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  markAllBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: Colors.lavender, borderRadius: 20,
  },
  markAllText: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.primary },
  emptyNotif: {
    alignItems: 'center', gap: 8,
    paddingVertical: 30,
  },
  emptyNotifText: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.textMuted },
  adminAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(107,33,168,0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.2)',
    marginBottom: 12,
  },
  adminAccessText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(168,85,247,0.9)',
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  logoutText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.error },
  appVersion: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
});
