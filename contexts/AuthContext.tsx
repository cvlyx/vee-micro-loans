import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveBiometricPreference, generateBiometricId } from '@/lib/biometric';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  dob?: string;
  nationalId?: string;
  district?: string;
  area?: string;
  employmentStatus?: string;
  monthlyIncome?: string;
  role: string;
  biometricEnabled?: boolean;
  loanLimit?: number;
  creditScore?: number;
  isKycVerified?: boolean;
  referralCode?: string;
  joinedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, enableBiometric?: boolean) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  enableBiometric: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const storedToken = await AsyncStorage.getItem('@phoenix_loan:token');
      const storedUser = await AsyncStorage.getItem('@phoenix_loan:user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string, enableBiometricLogin: boolean = false) {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setToken(data.token);
      setUser(data.user);
      
      await AsyncStorage.setItem('@phoenix_loan:token', data.token);
      await AsyncStorage.setItem('@phoenix_loan:user', JSON.stringify(data.user));

      // Enable biometric if requested
      if (enableBiometricLogin && data.user?.id) {
        const biometricId = generateBiometricId(data.user.id);
        await saveBiometricPreference(data.user.id, biometricId);
        
        // Notify backend
        await fetch(`${API_URL}/auth/enable-biometric`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id, biometricId }),
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function register(email: string, password: string, fullName: string, phone?: string) {
    try {
      console.log('📝 Attempting registration with:', { email, fullName });
      
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone }),
      });

      console.log('📡 Response status:', response.status);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        console.error('❌ Registration failed:', data.error);
        throw new Error(data.error || 'Registration failed');
      }

      setToken(data.token);
      setUser(data.user);
      
      await AsyncStorage.setItem('@phoenix_loan:token', data.token);
      await AsyncStorage.setItem('@phoenix_loan:user', JSON.stringify(data.user));
      
      console.log('✅ Registration successful!');
    } catch (error) {
      console.error('❌ Register error:', error);
      throw error;
    }
  }

  async function logout() {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('@phoenix_loan:token');
    await AsyncStorage.removeItem('@phoenix_loan:user');
  }

  async function enableBiometric() {
    if (!user?.id) return;
    
    try {
      const biometricId = generateBiometricId(user.id);
      await saveBiometricPreference(user.id, biometricId);
      
      // Notify backend
      await fetch(`${API_URL}/auth/enable-biometric`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, biometricId }),
      });
    } catch (error) {
      console.error('Enable biometric error:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, enableBiometric }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
