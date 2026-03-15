import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, Modal, TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAdmin } from '@/contexts/AdminContext';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

function EditSettingModal({ visible, title, initial, onSave, onClose, isNumber, prefix }: {
  visible: boolean; title: string; initial: string; onSave: (v: string) => void;
  onClose: () => void; isNumber?: boolean; prefix?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>{title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {prefix && <Text style={{ color: Colors.textMuted, marginRight: 8 }}>{prefix}</Text>}
            <TextInput
              style={[modalStyles.input, { flex: 1 }]}
              value={value}
              onChangeText={setValue}
              keyboardType={isNumber ? 'numeric' : 'default'}
              autoFocus selectTextOnFocus placeholderTextColor="rgba(255,255,255,0.4)"
            />
          </View>
          <View style={modalStyles.btns}>
            <Pressable style={[modalStyles.btn, modalStyles.cancel]} onPress={onClose}><Text style={modalStyles.cancelText}>Cancel</Text></Pressable>
            <Pressable style={[modalStyles.btn, modalStyles.save]} onPress={() => { onSave(value); onClose(); }}><Text style={modalStyles.saveText}>Save</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  container: { backgroundColor: '#1A0533', borderRadius: 20, padding: 24, width: '100%', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', gap: 16 },
  title: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#F3E8FF' },
  input: { borderWidth: 1.5, borderColor: 'rgba(168,85,247,0.4)', borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'DMSans_400Regular', color: '#F3E8FF', backgroundColor: 'rgba(255,255,255,0.06)' },
  btns: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancel: { backgroundColor: 'rgba(255,255,255,0.06)' },
  save: { backgroundColor: Colors.primary },
  cancelText: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: 'rgba(255,255,255,0.7)' },
  saveText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.white },
});

function RateSlider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.row}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={sliderStyles.value}>{format(value)}</Text>
      </View>
      <View style={sliderStyles.btns}>
        <Pressable
          style={({ pressed }) => [sliderStyles.btn, pressed && { opacity: 0.7 }]}
          onPress={() => {
            const next = Math.max(min, parseFloat((value - step).toFixed(4)));
            Haptics.selectionAsync();
            onChange(next);
          }}
          disabled={value <= min}
        >
          <Ionicons name="remove" size={16} color={value <= min ? Colors.textMuted : Colors.accent} />
        </Pressable>
        <View style={sliderStyles.track}>
          <View style={[sliderStyles.fill, { width: `${((value - min) / (max - min)) * 100}%` as any }]} />
        </View>
        <Pressable
          style={({ pressed }) => [sliderStyles.btn, pressed && { opacity: 0.7 }]}
          onPress={() => {
            const next = Math.min(max, parseFloat((value + step).toFixed(4)));
            Haptics.selectionAsync();
            onChange(next);
          }}
          disabled={value >= max}
        >
          <Ionicons name="add" size={16} color={value >= max ? Colors.textMuted : Colors.accent} />
        </Pressable>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.adminMutedBorder,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.text },
  value: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.accent },
  btns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.adminMutedBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
});

function SettingRow({ icon, label, value, onPress, destructive }: {
  icon: string; label: string; value?: string; onPress?: () => void; destructive?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [settingStyles.container, pressed && { opacity: 0.8 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[settingStyles.iconWrap, { backgroundColor: destructive ? 'rgba(239,68,68,0.1)' : 'rgba(168,85,247,0.1)' }]}>
        <Ionicons name={icon as any} size={16} color={destructive ? '#EF4444' : Colors.accent} />
      </View>
      <View style={settingStyles.info}>
        <Text style={[settingStyles.label, destructive && { color: '#EF4444' }]}>{label}</Text>
        {value ? <Text style={settingStyles.value}>{value}</Text> : null}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={14} color={Colors.adminIconMuted} />}
    </Pressable>
  );
}

const settingStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.adminMutedBorder,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  label: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.text },
  value: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, marginTop: 1 },
});

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const {
    interestRates, penaltyRate, processingFeeRate, loanParameters, disbursementChannels,
    updateInterestRate, updatePenaltyRate, updateProcessingFeeRate,
    updateLoanParameter, updateDisbursementChannel, saveSettings, adminLogout
  } = useAdmin();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit states
  const [editParam, setEditParam] = useState<{ key: string, title: string, initial: string, isNumber?: boolean, prefix?: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    await saveSettings();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
    Alert.alert('Settings Saved', 'Settings have been updated and are now live.');
  }

  function handleSaveParam(val: string) {
    if (!editParam) return;
    const k = editParam.key;
    if (k.startsWith('param_')) {
      const field = k.replace('param_', '');
      const num = parseInt(val.replace(/,/g, ''), 10);
      if (!isNaN(num)) updateLoanParameter(field as any, num);
    } else if (k === 'processingFee') {
      const v = parseFloat(val) / 100;
      if (!isNaN(v) && v >= 0) updateProcessingFeeRate(v);
    } else if (k.startsWith('channel_')) {
      const id = k.replace('channel_', '');
      updateDisbursementChannel(id, { number: val });
    }
  }

  function handleLogout() {
    Alert.alert(
      'Sign Out',
      'Sign out of the admin panel?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await adminLogout();
            router.replace('/auth/welcome');
          },
        },
      ]
    );
  }

  const totalRevenuePct = interestRates.reduce((s, r) => s + r.rate, 0) + processingFeeRate;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: Colors.white, borderColor: Colors.border }]}>
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.pageSub}>Loan configuration & admin preferences</Text>
        </View>

        {/* Company Info Banner */}
        <LinearGradient
          colors={['#2D1065', '#4C1D95']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.infoBanner}
        >
          <View style={styles.infoBannerLeft}>
            <MaterialCommunityIcons name="shield-crown" size={24} color={Colors.white} />
            <View>
              <Text style={styles.companyName}>Vee Micro Loans</Text>
              <Text style={styles.companyTagline}>Malawi Digital Lending · Admin v1.0</Text>
            </View>
          </View>
          <View style={styles.companyBadge}>
            <Text style={styles.companyBadgeText}>LIVE</Text>
          </View>
        </LinearGradient>

        {/* Interest Rates Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up-outline" size={16} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Interest Rate Configuration</Text>
          </View>
          <View style={styles.card}>
            {interestRates.map(rate => (
              <RateSlider
                key={rate.days}
                label={`${rate.label} (${rate.days} days)`}
                value={rate.rate}
                min={0.05}
                max={0.80}
                step={0.05}
                format={v => `${(v * 100).toFixed(0)}%`}
                onChange={v => updateInterestRate(rate.days, v)}
              />
            ))}
            <RateSlider
              label="Late Penalty Rate"
              value={penaltyRate}
              min={0.01}
              max={0.20}
              step={0.01}
              format={v => `${(v * 100).toFixed(0)}%`}
              onChange={updatePenaltyRate}
            />
          </View>
        </View>

        {/* Loan Parameters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={16} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Loan Parameters</Text>
          </View>
          <View style={styles.card}>
            <SettingRow icon="arrow-down-circle-outline" label="Minimum Loan Amount" value={`MWK ${loanParameters.minAmount.toLocaleString()}`} onPress={() => setEditParam({ key: 'param_minAmount', title: 'Minimum Loan Amount', initial: loanParameters.minAmount.toString(), isNumber: true, prefix: 'MWK' })} />
            <SettingRow icon="arrow-up-circle-outline" label="Maximum Loan Amount" value={`MWK ${loanParameters.maxAmount.toLocaleString()}`} onPress={() => setEditParam({ key: 'param_maxAmount', title: 'Maximum Loan Amount', initial: loanParameters.maxAmount.toString(), isNumber: true, prefix: 'MWK' })} />
            <SettingRow icon="calendar-outline" label="Minimum Duration" value={`${loanParameters.minDurationDays} days`} onPress={() => setEditParam({ key: 'param_minDurationDays', title: 'Minimum Duration (Days)', initial: loanParameters.minDurationDays.toString(), isNumber: true })} />
            <SettingRow icon="calendar-outline" label="Maximum Duration" value={`${loanParameters.maxDurationDays} days`} onPress={() => setEditParam({ key: 'param_maxDurationDays', title: 'Maximum Duration (Days)', initial: loanParameters.maxDurationDays.toString(), isNumber: true })} />
            <SettingRow icon="receipt-outline" label="Processing Fee" value={`${(processingFeeRate * 100).toFixed(0)}% flat`} onPress={() => setEditParam({ key: 'processingFee', title: 'Processing Fee %', initial: (processingFeeRate * 100).toString(), isNumber: true, prefix: '%' })} />
          </View>
        </View>

        {/* Disbursement Channels */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait-outline" size={16} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Disbursement Channels</Text>
          </View>
          <View style={styles.card}>
            {disbursementChannels.map(c => (
              <SettingRow
                key={c.id}
                icon={c.type === 'bank' ? 'business-outline' : 'phone-portrait-outline'}
                label={c.name}
                value={c.number}
                onPress={() => setEditParam({ key: `channel_${c.id}`, title: c.name, initial: c.number })}
              />
            ))}
          </View>
        </View>

        {/* Rate Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={16} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Revenue Rate Summary</Text>
          </View>
          <View style={styles.rateGrid}>
            {interestRates.map(r => (
              <View key={r.days} style={styles.rateChip}>
                <Text style={styles.rateChipLabel}>{r.label}</Text>
                <Text style={styles.rateChipValue}>{(r.rate * 100).toFixed(0)}%</Text>
                <Text style={styles.rateChipSub}>interest</Text>
              </View>
            ))}
            <View style={[styles.rateChip, styles.rateChipFee]}>
              <Text style={styles.rateChipLabel}>All Loans</Text>
              <Text style={[styles.rateChipValue, { color: '#F59E0B' }]}>{(processingFeeRate * 100).toFixed(0)}%</Text>
              <Text style={styles.rateChipSub}>processing</Text>
            </View>
          </View>
        </View>

        {/* Admin Account */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={16} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Admin Account</Text>
          </View>
          <View style={styles.card}>
            <SettingRow icon="mail-outline" label="Admin Email" value="admin@phoenixloan.mw" />
            <SettingRow icon="key-outline" label="Password" value="••••••••••••" />
            <SettingRow icon="time-outline" label="Session" value="Active" />
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          style={({ pressed }) => [styles.saveBtn, (pressed || saving) && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={['#7C3AED', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnInner}
          >
            <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{saved ? 'Settings Saved!' : (saving ? 'Saving...' : 'Save Settings')}</Text>
          </LinearGradient>
        </Pressable>

        {/* Edit Modal */}
        {editParam && (
          <EditSettingModal
            visible={!!editParam}
            title={editParam.title}
            initial={editParam.initial}
            isNumber={editParam.isNumber}
            prefix={editParam.prefix}
            onSave={handleSaveParam}
            onClose={() => setEditParam(null)}
          />
        )}

        {/* Sign Out */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out of Admin Panel</Text>
        </Pressable>

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  header: { marginBottom: 16 },
  pageTitle: { fontSize: 24, fontFamily: 'DMSans_700Bold', color: Colors.text },
  pageSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, marginTop: 2 },
  infoBanner: {
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyName: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.white },
  companyTagline: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  companyBadge: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  companyBadgeText: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: '#10B981', letterSpacing: 1 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.text },
  card: {
    backgroundColor: Colors.adminCardBg,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.adminCardBorder,
  },
  rateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rateChip: {
    flex: 1,
    minWidth: '20%',
    backgroundColor: 'rgba(168,85,247,0.08)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.2)',
  },
  rateChipFee: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.2)',
  },
  rateChipLabel: { fontSize: 9, fontFamily: 'DMSans_400Regular', color: Colors.textSecondary, textAlign: 'center' },
  rateChipValue: { fontSize: 20, fontFamily: 'DMSans_700Bold', color: Colors.accent, marginVertical: 3 },
  rateChipSub: { fontSize: 9, fontFamily: 'DMSans_400Regular', color: Colors.textMuted },
  saveBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  saveBtnInner: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveBtnText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.white },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#EF4444' },
});
