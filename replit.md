# Phoenix Loan Services — Mobile App

## Overview
A full-featured mobile lending app for **Phoenix Loan Services**, a Malawian digital lending company. Built with Expo Go / React Native, supporting iOS and Android.

## Stack
- **Frontend:** Expo Router (file-based routing), React Native, TypeScript
- **Backend:** Express.js (port 5000) — API + static landing page
- **State:** React Context + AsyncStorage (no external DB)
- **Fonts:** DM Sans (DMSans_400Regular, DMSans_500Medium, DMSans_700Bold)
- **Icons:** @expo/vector-icons (Ionicons, MaterialCommunityIcons)

## Features
### User App
- Welcome screen with rate cards and animated hero
- 3-step registration (Personal Info, Residence/Employment, Security)
- Login with PIN support
- Dashboard with credit score meter and loan summary
- Loan calculator with interest breakdown
- Loan application (MWK 5,000–200,000 for 1–4 weeks)
- Loan status timeline tracking
- Repayment with photo proof upload (expo-image-picker)
- Profile management, notification center, settings

### Admin Dashboard
- Separate admin login (secured portal)
- Overview with revenue stats, active/completed loans, pending count
- Applications manager: Approve / Reject / Disburse / Complete
- User management: verify KYC, edit credit score, update loan limit, blacklist
- Settings: adjust interest rates, penalty rates, disbursement channels

## Admin Credentials
- **Email:** admin@phoenixloan.mw
- **Password:** Phoenix@2026

## Color Scheme
- Primary: `#6B21A8`
- Secondary: `#9333EA`
- Accent: `#A855F7`
- Light: `#E9D5FF`
- Dark BG: `#1A0533`
- Admin BG: `#0A0118`

## Loan Parameters
- Amounts: MWK 5,000 – 200,000
- Durations: 1 week (20%), 2 weeks (30%), 3 weeks (40%), 4 weeks (50%) interest
- Processing fee: 5% flat
- Disbursement: Airtel Money, TNM Mpamba, 4 Malawian banks

## Navigation Structure
```
app/
  index.tsx              — Root redirect (auth check)
  _layout.tsx            — Root layout (AdminProvider, AuthProvider, LoanProvider)
  auth/
    _layout.tsx
    welcome.tsx           — Landing/welcome with rate cards
    login.tsx             — User login
    register.tsx          — 3-step registration
  (tabs)/
    _layout.tsx           — 5-tab bar (NativeTabs)
    index.tsx             — Dashboard (credit meter, loan summary)
    apply.tsx             — Loan calculator + application form
    loans.tsx             — Loan status timeline
    repay.tsx             — Repayment instructions + proof upload
    profile.tsx           — Profile, notifications, settings
  admin/
    _layout.tsx           — Admin stack layout
    login.tsx             — Admin login screen
    (tabs)/
      _layout.tsx         — 4-tab admin bar
      index.tsx           — Overview (stats, revenue, recent loans)
      applications.tsx    — All loan apps with approve/reject/disburse
      users.tsx           — User management
      settings.tsx        — Rate config, company settings
```

## Contexts
- `AuthContext` — user auth, AsyncStorage key: `@phoenix_user`
- `LoanContext` — loan management, AsyncStorage key: `@phoenix_loans`
- `AdminContext` — admin session + admin operations, key: `@phoenix_admin_session`

## Key AsyncStorage Keys
- `@phoenix_user` — current user profile
- `@phoenix_loans` — all loan records
- `@phoenix_notifications` — notifications
- `@phoenix_admin_session` — admin session flag

## Known Notes
- Reanimated hooks must not be called in web contexts that render many instances (causes "Invalid hook call")
- react-native-maps pinned to 1.18.0 for Expo Go compatibility
- Expo Router uses file-based routing; adding new directories requires frontend restart
