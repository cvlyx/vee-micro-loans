import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';
const ADMIN_SESSION_KEY = '@phoenix_admin_session';

const ADMIN_CREDENTIALS = {
  email: 'admin@phoenixloan.mw',
  password: 'Phoenix@2026',
};

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  creditScore: number;
  loanLimit: number;
  isKycVerified: boolean;
  isBlacklisted: boolean;
  joinedAt: string;
  district?: string;
  employmentStatus?: string;
  monthlyIncome?: string;
  referralCode?: string;
}

export interface AdminLoan {
  id: string;
  userId: string;
  amount: number;
  durationDays: number;
  interestRate: number;
  interest: number;
  processingFee: number;
  totalRepayment: number;
  dueDate: string;
  status: string;
  appliedAt: string;
  disbursedAt?: string;
  disbursementMethod?: string;
  disbursementReference?: string;
  repaidAt?: string;
  repaymentAmount?: number;
  repaymentMethod?: string;
  repaymentReference?: string;
  completedAt?: string;
  completionNotes?: string;
  employmentStatus: string;
  employer: string;
  monthlyIncome: number;
  nextOfKinName: string;
  nextOfKinPhone: string;
  accountNumber: string;
  accountName: string;
  collateralDescription?: string;
  collateralValue?: string;
  hasCollateral: boolean;
  paymentProofUploaded?: boolean;
}

export interface InterestRateSetting {
  days: number;
  label: string;
  rate: number;
}

export interface DisbursementChannel {
  id: string;
  name: string;
  type: 'mobile_money' | 'bank';
  number: string;
  enabled: boolean;
}

interface AdminContextValue {
  isAdminLoggedIn: boolean;
  adminLoading: boolean;
  loans: AdminLoan[];
  users: AdminUser[];
  interestRates: InterestRateSetting[];
  disbursementChannels: DisbursementChannel[];
  penaltyRate: number;
  processingFeeRate: number;
  loanParameters: { minAmount: number, maxAmount: number, minDurationDays: number, maxDurationDays: number };
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => Promise<void>;
  approveLoan: (loanId: string) => Promise<void>;
  rejectLoan: (loanId: string) => Promise<void>;
  disburseLoan: (loanId: string) => Promise<boolean>;
  completeLoan: (loanId: string) => Promise<boolean>;
  blacklistUser: (userId: string) => Promise<void>;
  updateLoanLimit: (userId: string, limit: number) => Promise<void>;
  updateCreditScore: (userId: string, score: number) => Promise<void>;
  verifyKyc: (userId: string) => Promise<void>;
  saveSettings: () => Promise<void>;
  updateDisbursementChannel: (id: string, updates: Partial<DisbursementChannel>) => void;
  updateLoanParameter: (key: keyof AdminContextValue['loanParameters'], val: number) => void;
  updateInterestRate: (days: number, rate: number) => void;
  updatePenaltyRate: (rate: number) => void;
  updateProcessingFeeRate: (rate: number) => void;
  refreshData: () => Promise<void>;
  pendingCount: number;
  totalRevenue: number;
  stats: {
    totalLoans: number;
    activeLoans: number;
    completedLoans: number;
    rejectedLoans: number;
    totalDisbursed: number;
    totalRepaid: number;
    pendingApprovals: number;
  };
}

const AdminContext = createContext<AdminContextValue | null>(null);

const DEFAULT_INTEREST_RATES: InterestRateSetting[] = [
  { days: 7, label: '1 Week', rate: 0.20 },
  { days: 14, label: '2 Weeks', rate: 0.30 },
  { days: 21, label: '3 Weeks', rate: 0.40 },
  { days: 30, label: '4 Weeks', rate: 0.50 },
];

const DEFAULT_DISBURSEMENT_CHANNELS: DisbursementChannel[] = [
  { id: 'airtel', name: 'Airtel Money', type: 'mobile_money', number: '+265 0997 971 750', enabled: true },
  { id: 'tnm', name: 'TNM Mpamba', type: 'mobile_money', number: '+265 0894 741 508', enabled: true },
  { id: 'natbank', name: 'National Bank of Malawi', type: 'bank', number: 'Enabled', enabled: true },
  { id: 'standard', name: 'Standard Bank Malawi', type: 'bank', number: 'Enabled', enabled: true },
  { id: 'firstcap', name: 'First Capital Bank', type: 'bank', number: 'Enabled', enabled: true },
  { id: 'nbs', name: 'NBS Bank', type: 'bank', number: 'Enabled', enabled: true },
];

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [interestRates, setInterestRates] = useState<InterestRateSetting[]>(DEFAULT_INTEREST_RATES);
  const [disbursementChannels, setDisbursementChannels] = useState<DisbursementChannel[]>(DEFAULT_DISBURSEMENT_CHANNELS);
  const [loanParameters, setLoanParameters] = useState({ minAmount: 5000, maxAmount: 200000, minDurationDays: 7, maxDurationDays: 30 });
  const [penaltyRate, setPenaltyRate] = useState(0.05);
  const [processingFeeRate, setProcessingFeeRate] = useState(0.05);

  useEffect(() => {
    loadAdminSession();
  }, []);

  async function loadAdminSession() {
    try {
      const session = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
      if (session === 'active') {
        setIsAdminLoggedIn(true);
        await loadData();
      }
    } catch (e) {
      console.error('Admin session load failed', e);
    } finally {
      setAdminLoading(false);
    }
  }

  function mapApiLoanToAdminLoan(app: any): AdminLoan {
    const amount = Number(app.amount) || 0;
    const interestRate = 0.20;
    const processingFeeRate = 0.05;
    const interest = amount * interestRate;
    const processingFee = amount * processingFeeRate;
    const totalRepayment = amount + interest + processingFee;
    const appliedAt = app.createdAt || new Date().toISOString();
    const dueDate = new Date(appliedAt);
    dueDate.setDate(dueDate.getDate() + 30);
    const user = app.user || {};
    return {
      id: app.id,
      userId: app.userId,
      amount,
      durationDays: 30,
      interestRate,
      interest,
      processingFee,
      totalRepayment,
      dueDate: dueDate.toISOString(),
      status: app.status === 'pending' ? 'submitted' : app.status,
      appliedAt,
      employmentStatus: app.employmentStatus || '',
      employer: app.employerName || '',
      monthlyIncome: Number(app.monthlyIncome) || 0,
      nextOfKinName: '',
      nextOfKinPhone: '',
      disbursementMethod: '',
      accountNumber: '',
      accountName: user.fullName || 'Unknown',
      hasCollateral: false,
    };
  }

  async function loadData() {
    try {
      const [usersRes, loansRes, settingsRes] = await Promise.allSettled([
        fetch(`${API_URL}/admin/users`),
        fetch(`${API_URL}/admin/loans`),
        fetch(`${API_URL}/admin/settings`),
      ]);

      let fetchedUsers: AdminUser[] | null = null;
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const data = await usersRes.value.json();
        const apiUsers = data.users || [];
        fetchedUsers = apiUsers.map((u: any) => ({
          id: u.id,
          fullName: u.fullName || u.full_name || 'Unknown',
          email: u.email || '',
          phone: u.phone || '',
          creditScore: u.creditScore ?? 500,
          loanLimit: u.loanLimit ?? 50000,
          isKycVerified: !!u.isKycVerified,
          isBlacklisted: !!u.isBlacklisted,
          joinedAt: u.joinedAt || u.createdAt || new Date().toISOString(),
          district: u.district,
          employmentStatus: u.employmentStatus,
          monthlyIncome: u.monthlyIncome,
          referralCode: u.referralCode,
        }));
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
        const { settings } = await settingsRes.value.json();
        if (settings.interestRates) setInterestRates(settings.interestRates);
        if (settings.disbursementChannels) setDisbursementChannels(settings.disbursementChannels);
        if (settings.loanParameters) setLoanParameters(settings.loanParameters);
        if (settings.penaltyRate !== undefined) setPenaltyRate(settings.penaltyRate);
        if (settings.processingFeeRate !== undefined) setProcessingFeeRate(settings.processingFeeRate);
      }

      let fetchedLoans: AdminLoan[] | null = null;
      if (loansRes.status === 'fulfilled' && loansRes.value.ok) {
        const data = await loansRes.value.json();
        const apiLoans = data.loans || [];
        fetchedLoans = apiLoans.map((app: any) => mapApiLoanToAdminLoan(app));
        // Always update cache with fresh data from server
        await AsyncStorage.setItem('@phoenix_loans', JSON.stringify(fetchedLoans));
      }

      try {
        if (fetchedLoans !== null) {
          // We fetched successfully from the DB, so we no longer care about the ghost local cache
          await AsyncStorage.setItem('@phoenix_loans', JSON.stringify(fetchedLoans));
        } else {
          // We are offline or the API failed, fetch from local cache
          const loansRaw = await AsyncStorage.getItem('@phoenix_loans');
          if (loansRaw) {
            const localLoans: AdminLoan[] = JSON.parse(loansRaw);
            for (const local of localLoans) {
              if (!fetchedLoans!.find((l: any) => l.id === local.id)) fetchedLoans!.push(local);
            }
          }
        }
      } catch (e) {
        console.error('Async storage loans read error', e);
      }

      setUsers(fetchedUsers || []);
      setLoans(fetchedLoans || []);
    } catch (e) {
      console.error('Failed to load admin data', e);
      // Fallback to AsyncStorage on error
      try {
        const loansRaw = await AsyncStorage.getItem('@phoenix_loans');
        const userRaw = await AsyncStorage.getItem('@phoenix_user');
        if (loansRaw) setLoans(JSON.parse(loansRaw));
        if (userRaw) setUsers([JSON.parse(userRaw)]);
        const allKeys = await AsyncStorage.getAllKeys();
        const userKeys = allKeys.filter(k => k.startsWith('@phoenix_user'));
        for (const key of userKeys) {
          const raw = await AsyncStorage.getItem(key);
          if (raw) {
            const u = JSON.parse(raw);
            if (u.id && u.fullName) setUsers(prev => [...prev, u].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i));
          }
        }
      } catch (_) { }
    }
  }

  async function adminLogin(email: string, password: string): Promise<boolean> {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      await AsyncStorage.setItem(ADMIN_SESSION_KEY, 'active');
      setIsAdminLoggedIn(true);
      await loadData();
      return true;
    }
    return false;
  }

  async function adminLogout() {
    await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminLoggedIn(false);
    setLoans([]);
    setUsers([]);
  }

  async function updateLoanStatus(loanId: string, status: string, extra?: Partial<AdminLoan>) {
    const updated = loans.map(l =>
      l.id === loanId ? { ...l, status, ...extra } : l
    );
    setLoans(updated);
  }

  async function approveLoan(loanId: string) {
    try {
      const res = await fetch(`${API_URL}/applications/${loanId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      await updateLoanStatus(loanId, 'approved');
      // Send notification to the loan applicant
      const loan = loans.find(l => l.id === loanId);
      if (loan?.userId) {
        await fetch(`${API_URL}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': loan.userId },
          body: JSON.stringify({
            title: '🎉 Loan Approved!',
            message: `Your loan application of MWK ${loan.amount.toLocaleString()} has been approved. Funds will be disbursed shortly.`,
            type: 'success',
          }),
        });
      }
    } catch {
      await updateLoanStatus(loanId, 'approved');
    }
  }

  async function rejectLoan(loanId: string) {
    try {
      const res = await fetch(`${API_URL}/applications/${loanId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
      await updateLoanStatus(loanId, 'rejected');
      // Send notification to the loan applicant
      const loan = loans.find(l => l.id === loanId);
      if (loan?.userId) {
        await fetch(`${API_URL}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': loan.userId },
          body: JSON.stringify({
            title: '❌ Loan Application Update',
            message: `We regret to inform you that your loan application of MWK ${loan.amount.toLocaleString()} was not approved at this time.`,
            type: 'warning',
          }),
        });
      }
    } catch {
      await updateLoanStatus(loanId, 'rejected');
    }
  }

  async function disburseLoan(loanId: string) {
    try {
      console.log(`💰 Disbursing loan: ${loanId}`);
      const res = await fetch(`${API_URL}/admin/applications/${loanId}/disburse`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          disbursementMethod: 'airtel_money',
          disbursementReference: `DISB-${Date.now()}`
        }),
      });
      
      console.log('Disburse response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Disburse response:', data);
        await updateLoanStatus(loanId, 'disbursed', { 
          disbursedAt: new Date().toISOString(),
          disbursementMethod: 'airtel_money',
          disbursementReference: `DISB-${Date.now()}`
        });
        refreshData(); // Refresh data from server
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Disburse failed:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Disburse loan error:', error);
      return false;
    }
  }

  async function completeLoan(loanId: string) {
    try {
      console.log(`✅ Completing loan: ${loanId}`);
      const res = await fetch(`${API_URL}/admin/applications/${loanId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repaymentAmount: 100000,
          repaymentMethod: 'bank_transfer',
          repaymentReference: `REP-${Date.now()}`
        }),
      });
      
      console.log('Complete response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Complete response:', data);
        await updateLoanStatus(loanId, 'completed', { 
          repaidAt: new Date().toISOString(),
          repaymentAmount: 100000,
          repaymentMethod: 'bank_transfer',
          repaymentReference: `REP-${Date.now()}`
        });
        refreshData(); // Refresh data from server
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Complete failed:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Complete loan error:', error);
      return false;
    }
  }

  async function blacklistUser(userId: string) {
    try {
      console.log(`🚫 Toggling blacklist for user: ${userId}`);
      const res = await fetch(`${API_URL}/admin/users/${userId}/blacklist`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const { user } = await res.json();
        setUsers(users.map(u => u.id === userId ? { ...u, isBlacklisted: user.isBlacklisted } : u));
        console.log(`✅ User ${userId} blacklist toggled`);
      } else {
        const error = await res.json().catch(() => ({}));
        console.error('Blacklist failed:', error);
      }
    } catch (err) {
      console.error('Failed to blacklist', err);
    }
  }

  async function updateLoanLimit(userId: string, limit: number) {
    try {
      console.log(`💰 Updating loan limit for user ${userId} to ${limit}`);
      const res = await fetch(`${API_URL}/admin/users/${userId}/loan-limit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanLimit: limit }),
      });
      if (res.ok) {
        const { user } = await res.json();
        setUsers(users.map(u => u.id === userId ? { ...u, loanLimit: user.loanLimit } : u));
        console.log(`✅ User ${userId} loan limit updated`);
      } else {
        const error = await res.json().catch(() => ({}));
        console.error('Update loan limit failed:', error);
      }
    } catch (err) {
      console.error('Failed to update loan limit', err);
    }
  }

  async function updateCreditScore(userId: string, score: number) {
    try {
      console.log(`📊 Updating credit score for user ${userId} to ${score}`);
      const res = await fetch(`${API_URL}/admin/users/${userId}/credit-score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditScore: score }),
      });
      if (res.ok) {
        const { user } = await res.json();
        setUsers(users.map(u => u.id === userId ? { ...u, creditScore: user.creditScore } : u));
        console.log(`✅ User ${userId} credit score updated`);
      } else {
        const error = await res.json().catch(() => ({}));
        console.error('Update credit score failed:', error);
      }
    } catch (err) {
      console.error('Failed to update credit score', err);
    }
  }

  async function verifyKyc(userId: string) {
    try {
      console.log(`✅ Verifying KYC for user: ${userId}`);
      const res = await fetch(`${API_URL}/admin/users/${userId}/verify-kyc`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const { user } = await res.json();
        setUsers(users.map(u => u.id === userId ? { ...u, isKycVerified: true, verificationStatus: 'verified' } : u));
        console.log(`✅ User ${userId} KYC verified`);
      } else {
        const error = await res.json().catch(() => ({}));
        console.error('Verify KYC failed:', error);
      }
    } catch (err) {
      console.error('Failed to verify KYC', err);
    }
  }

  function updateDisbursementChannel(id: string, updates: Partial<DisbursementChannel>) {
    setDisbursementChannels(cs => cs.map(c => c.id === id ? { ...c, ...updates } : c));
  }

  function updateLoanParameter(key: keyof AdminContextValue['loanParameters'], val: number) {
    setLoanParameters(p => ({ ...p, [key]: val }));
  }

  function updateInterestRate(days: number, rate: number) {
    setInterestRates(rts => rts.map(r => r.days === days ? { ...r, rate } : r));
  }

  function updatePenaltyRate(rate: number) {
    setPenaltyRate(rate);
  }

  function updateProcessingFeeRate(rate: number) {
    setProcessingFeeRate(rate);
  }

  async function saveSettings() {
    try {
      await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interestRates,
          disbursementChannels,
          loanParameters,
          penaltyRate,
          processingFeeRate,
        }),
      });
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  async function refreshData() {
    try {
      // Clear cache first
      await AsyncStorage.removeItem('@phoenix_loans');
      await AsyncStorage.removeItem('@phoenix_admin_users_cache');
      
      // Reload fresh data
      await loadData();
    } catch (e) {
      console.error('Refresh data failed', e);
    }
  }

  const stats = useMemo(() => ({
    totalLoans: loans.length,
    activeLoans: loans.filter(l => l.status === 'active' || l.status === 'disbursed').length,
    completedLoans: loans.filter(l => l.status === 'completed').length,
    rejectedLoans: loans.filter(l => l.status === 'rejected').length,
    totalDisbursed: loans.filter(l => ['active', 'disbursed', 'completed'].includes(l.status)).reduce((s, l) => s + l.amount, 0),
    totalRepaid: loans.filter(l => l.status === 'completed').reduce((s, l) => s + l.totalRepayment, 0),
    pendingApprovals: loans.filter(l => l.status === 'submitted' || l.status === 'under_review').length,
  }), [loans]);

  const pendingCount = stats.pendingApprovals;

  const totalRevenue = useMemo(() =>
    loans.filter(l => l.status === 'completed').reduce((s, l) => s + l.interest + l.processingFee, 0),
    [loans]
  );

  const value = useMemo(() => ({
    isAdminLoggedIn, adminLoading, loans, users,
    interestRates, penaltyRate, processingFeeRate, disbursementChannels, loanParameters,
    adminLogin, adminLogout, approveLoan, rejectLoan, disburseLoan, completeLoan,
    blacklistUser, updateLoanLimit, updateCreditScore, verifyKyc,
    updateInterestRate, updatePenaltyRate, updateProcessingFeeRate,
    updateDisbursementChannel, updateLoanParameter, saveSettings, refreshData,
    pendingCount, totalRevenue, stats,
  }), [isAdminLoggedIn, adminLoading, loans, users, interestRates, penaltyRate, processingFeeRate, disbursementChannels, loanParameters, stats, totalRevenue]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
