import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendNotification, postNotificationToBackend } from '../services/NotificationService';

const LOANS_KEY = '@phoenix_loans';
const NOTIFICATIONS_KEY = '@phoenix_notifications';

export type LoanStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'active' | 'completed' | 'defaulted';
export type DisbursementMethod = 'airtel_money' | 'tnm_mpamba' | 'national_bank' | 'fdh_bank' | 'nbs_bank' | 'first_capital' | 'other';

export interface LoanApplication {
  id: string;
  userId: string;
  amount: number;
  durationDays: number;
  interestRate: number;
  interest: number;
  processingFee: number;
  totalRepayment: number;
  dueDate: string;
  status: LoanStatus;
  appliedAt: string;
  disbursedAt?: string;
  completedAt?: string;
  employmentStatus: string;
  employer: string;
  monthlyIncome: number;
  nextOfKinName: string;
  nextOfKinPhone: string;
  disbursementMethod: DisbursementMethod;
  accountNumber: string;
  accountName: string;
  collateralDescription?: string;
  collateralValue?: string;
  hasCollateral: boolean;
  paymentProofUploaded?: boolean;
  rating?: number;
  review?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

interface LoanContextValue {
  loans: LoanApplication[];
  notifications: Notification[];
  isLoading: boolean;
  applyForLoan: (data: Omit<LoanApplication, 'id' | 'appliedAt' | 'status'>) => Promise<string>;
  uploadRepaymentProof: (loanId: string) => Promise<void>;
  rateLoan: (loanId: string, rating: number, review: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  unreadCount: number;
  activeLoan: LoanApplication | null;
  refreshLoans: () => Promise<void>;
}

const LoanContext = createContext<LoanContextValue | null>(null);

function calcInterestRate(days: number): number {
  if (days <= 7) return 0.20;
  if (days <= 14) return 0.30;
  if (days <= 21) return 0.40;
  return 0.50;
}

function getDaysLabel(days: number): string {
  if (days === 7) return '1 Week';
  if (days === 14) return '2 Weeks';
  if (days === 21) return '3 Weeks';
  return '4 Weeks';
}

export { calcInterestRate, getDaysLabel };

export function LoanProvider({ children }: { children: ReactNode }) {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      let fetchedLoans: LoanApplication[] | null = null;

      const userRaw = await AsyncStorage.getItem('@phoenix_loan:user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';

        // Fetch loans
        try {
          const res = await fetch(`${API_URL}/applications/my-applications`, {
            headers: { 'X-User-Id': user.id }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.applications) {
              fetchedLoans = data.applications.map((app: any) => ({
                id: app.id,
                userId: app.userId,
                amount: Number(app.amount) || 0,
                durationDays: 30,
                interestRate: 0.20,
                interest: 0,
                processingFee: 0,
                totalRepayment: (Number(app.amount) || 0) * 1.25,
                dueDate: new Date(new Date(app.createdAt).setDate(new Date(app.createdAt).getDate() + 30)).toISOString(),
                status: app.status === 'pending' ? 'submitted' : app.status,
                appliedAt: app.createdAt || new Date().toISOString(),
                employmentStatus: app.employmentStatus || '',
                employer: app.employerName || '',
                monthlyIncome: Number(app.monthlyIncome) || 0,
                nextOfKinName: '',
                nextOfKinPhone: '',
                disbursementMethod: '',
                accountNumber: '',
                accountName: '',
                hasCollateral: false,
              }));
            }
          }
        } catch (e) {
          console.error('Failed to load backend loans', e);
        }

        // Fetch notifications from backend
        try {
          const nRes = await fetch(`${API_URL}/notifications`, {
            headers: { 'X-User-Id': user.id }
          });
          if (nRes.ok) {
            const nData = await nRes.json();
            const mapped = (nData.notifications || []).map((n: any) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              type: n.type as any,
              isRead: n.isRead,
              createdAt: n.createdAt,
            }));
            setNotifications(mapped);
            await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(mapped));
          }
        } catch (e) {
          console.error('Failed to load backend notifications', e);
          const notifRaw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
          if (notifRaw) setNotifications(JSON.parse(notifRaw));
        }
      }

      const loansRaw = await AsyncStorage.getItem(LOANS_KEY);
      const notifRaw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);

      if (fetchedLoans !== null) {
        setLoans(fetchedLoans);
        await AsyncStorage.setItem(LOANS_KEY, JSON.stringify(fetchedLoans));
      } else {
        if (loansRaw) setLoans(JSON.parse(loansRaw));
        if (notifRaw) setNotifications(JSON.parse(notifRaw));
      }
    } catch (e) {
      console.error('Failed to load loan data', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveLoans(updated: LoanApplication[]) {
    setLoans(updated);
    await AsyncStorage.setItem(LOANS_KEY, JSON.stringify(updated));
  }

  async function addNotification(notif: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) {
    // Fire push notification with sound + save to DB
    await sendNotification(notif.title, notif.message, notif.type);
    // Also update local state immediately
    const newNotif: Notification = {
      ...notif,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  }

  async function applyForLoan(data: Omit<LoanApplication, 'id' | 'appliedAt' | 'status'>): Promise<string> {
    let newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    // Attempt backend submission
    try {
      const userRaw = await AsyncStorage.getItem('@phoenix_loan:user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';
        const res = await fetch(`${API_URL}/applications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id
          },
          body: JSON.stringify({
            amount: data.amount.toString(),
            employmentStatus: data.employmentStatus || 'Employed',
            monthlyIncome: data.monthlyIncome.toString(),
            employerName: data.employer || '',
            reason: 'Personal Loan'
          })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.application && resData.application.id) {
            newId = resData.application.id;
          }
        }
      }
    } catch (e) {
      console.error('Failed to submit loan to backend', e);
    }

    const loan: LoanApplication = {
      ...data,
      id: newId,
      appliedAt: new Date().toISOString(),
      status: 'submitted',
    };

    const updated = [loan, ...loans];
    await saveLoans(updated);

    await addNotification({
      title: 'Loan Application Submitted',
      message: `Your loan application of MWK ${data.amount.toLocaleString()} has been submitted and is under review.`,
      type: 'info',
    });

    // Simulate status update locally only if not fully backend integrated on user end yet
    setTimeout(async () => {
      const reloaded = await AsyncStorage.getItem(LOANS_KEY);
      const list: LoanApplication[] = reloaded ? JSON.parse(reloaded) : [];
      const idx = list.findIndex(l => l.id === newId);
      if (idx >= 0 && list[idx].status === 'submitted') {
        list[idx].status = 'under_review';
        await AsyncStorage.setItem(LOANS_KEY, JSON.stringify(list));
        setLoans([...list]);
      }
    }, 3000);

    return newId;
  }

  async function uploadRepaymentProof(loanId: string) {
    const updated = loans.map(l =>
      l.id === loanId ? { ...l, paymentProofUploaded: true, status: 'completed' as LoanStatus } : l
    );
    await saveLoans(updated);
    await addNotification({
      title: 'Payment Proof Received',
      message: 'Thank you! Your repayment proof has been received and will be verified shortly.',
      type: 'success',
    });
  }

  async function rateLoan(loanId: string, rating: number, review: string) {
    const updated = loans.map(l =>
      l.id === loanId ? { ...l, rating, review } : l
    );
    await saveLoans(updated);
  }

  async function markNotificationRead(id: string) {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(updated);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    // Also mark in backend
    try {
      const userRaw = await AsyncStorage.getItem('@phoenix_loan:user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';
        await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PATCH', headers: { 'X-User-Id': user.id } });
      }
    } catch (e) { /* silently fail */ }
  }

  async function markAllRead() {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    try {
      const userRaw = await AsyncStorage.getItem('@phoenix_loan:user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';
        await fetch(`${API_URL}/notifications/read-all`, { method: 'PATCH', headers: { 'X-User-Id': user.id } });
      }
    } catch (e) { /* silently fail */ }
  }

  async function refreshLoans() {
    await loadData();
  }

  const activeLoan = useMemo(() =>
    loans.find(l => l.status === 'active' || l.status === 'disbursed') || null,
    [loans]
  );

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const value = useMemo(() => ({
    loans, notifications, isLoading,
    applyForLoan, uploadRepaymentProof, rateLoan,
    markNotificationRead, markAllRead, unreadCount, activeLoan, refreshLoans,
  }), [loans, notifications, isLoading, unreadCount, activeLoan]);

  return <LoanContext.Provider value={value}>{children}</LoanContext.Provider>;
}

export function useLoan() {
  const ctx = useContext(LoanContext);
  if (!ctx) throw new Error('useLoan must be used within LoanProvider');
  return ctx;
}
