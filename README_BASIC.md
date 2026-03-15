<div align="center">

# 🔥 PHOENIX LOAN APP

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Expo Version](https://img.shields.io/badge/Expo-54.0.0-000000?style=flat&logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.76.6-61dafb?style=flat&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-lightgrey?style=flat)](https://expo.dev/)

*A modern, beautiful loan management application built with React Native and Expo*

[▶️ **Live Demo](https://expo.dev/@cvlyx/phoenix) • [📱 **Download App**](https://expo.dev/accounts/calyx2002/projects/phoenix-loan/builds) • [📖 **Documentation](#documentation)]

</div>

---

## ✨ Features

### 🎯 Core Functionality
- 💰 **Loan Management** - Apply, track, and manage loans seamlessly
- 👤 **User Authentication** - Secure login and registration system
- 📊 **Admin Dashboard** - Complete administrative control panel
- 🔔 **Smart Notifications** - Real-time alerts and updates
- 💾 **Data Persistence** - Backend integration with PostgreSQL

### 🎨 User Experience
- 🌙 **Dark Mode Support** - Beautiful light/dark themes
- 📱 **Responsive Design** - Perfect on all screen sizes
- ⚡ **Performance Optimized** - Smooth animations and transitions
- 🎯 **Intuitive Navigation** - Tab-based interface
- 🔄 **Real-time Updates** - Live data synchronization

### 🛠️ Technical Features
- 🔐 **JWT Authentication** - Secure token-based auth
- 📡 **Push Notifications** - Expo notifications with fallbacks
- 🗄️ **Database Integration** - Drizzle ORM with PostgreSQL
- 🔧 **Environment Config** - Multi-environment support
- 📦 **Modern Stack** - Latest React Native and Expo features

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- Physical device for testing notifications

### Installation

```bash
# Clone the repository
git clone https://github.com/cvlyx/PHOENIX.git
cd PHOENIX

# Install dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Start the development server
npm start
```

### Environment Setup

1. **Copy environment files:**
```bash
cp backend/.env.example backend/.env
```

2. **Configure your environment variables:**
```env
# backend/.env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
```

3. **Setup the database:**
```bash
cd backend
npm run db:push
npm run db:generate
```

---

## 📱 Development Build

For full functionality including push notifications, create a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure the project
eas build:configure

# Build for all platforms
eas build --profile development --platform all
```

### 📥 Download Development Build
- [**Android Build**](https://expo.dev/accounts/calyx2002/projects/phoenix-loan/builds) - Download APK
- [**iOS Build**](https://expo.dev/accounts/calyx2002/projects/phoenix-loan/builds) - Requires Apple Developer account

---

## 🏗️ Project Structure

```
PHOENIX/
├── 📁 app/                    # Expo Router navigation
│   ├── (tabs)/               # Main app tabs
│   ├── auth/                 # Authentication screens
│   └── admin/                # Admin dashboard
├── 📁 components/            # Reusable UI components
├── 📁 contexts/              # React Context providers
├── 📁 services/              # API and utility services
├── 📁 constants/             # App constants and themes
├── 📁 backend/               # Node.js API server
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── db/              # Database schema
│   │   └── middleware/       # Auth middleware
│   └── package.json
└── 📁 assets/               # Images and icons
```

---

## 🎯 Core Components

### 🔐 Authentication System
```typescript
// Secure login with JWT tokens
const { login, register, user } = useAuth();

// Automatic token refresh
// Protected route handling
// Biometric authentication support
```

### 💰 Loan Management
```typescript
// Complete loan lifecycle
const { loans, applyForLoan, updateLoan } = useLoans();

// Real-time status updates
// Document upload support
// Approval workflows
```

### 🔔 Notification System
```typescript
// Smart notifications with Expo Go detection
import { sendNotification } from '../services/NotificationService';

// Local notifications (work in Expo Go)
// Push notifications (development build)
// Backend persistence
```

---

## 🎨 UI Components

### Beautiful Design System
- **Color Palette**: Purple-themed with accessibility in mind
- **Typography**: Clean, readable font hierarchy
- **Animations**: Smooth transitions and micro-interactions
- **Icons**: Consistent icon library throughout

### Responsive Layout
```typescript
// Adaptive components for all screen sizes
import { View, Text } from 'react-native';
import { useWindowDimensions } from 'react-native';

// Tablet and desktop support
// Orientation handling
// Safe area management
```

---

## 🔧 Configuration

### App Configuration
```json
// app.json
{
  "expo": {
    "name": "Phoenix Loan",
    "slug": "phoenix-loan",
    "version": "1.0.0",
    "plugins": [
      "expo-notifications",
      "expo-router"
    ]
  }
}
```

### Environment Variables
```env
# .env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_ENVIRONMENT=development
```

---

## 📊 API Documentation

### Authentication Endpoints
```http
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/profile
```

### Loan Endpoints
```http
GET    /api/loans
POST   /api/loans
PUT    /api/loans/:id
DELETE /api/loans/:id
```

### Notification Endpoints
```http
GET  /api/notifications
POST /api/notifications
PUT  /api/notifications/:id/read
```

---

## 🧪 Testing

### Notification Testing
```typescript
// Use the built-in test component
import NotificationTest from './components/NotificationTest';

// Test local notifications
// Verify push token registration
// Debug notification flow
```

### Manual Testing
1. **Install development build** on physical device
2. **Enable notifications** in device settings
3. **Trigger notifications** from app actions
4. **Verify local and push notifications**

---

## 🔔 Notification Setup

### Local Notifications (Expo Go)
- ✅ Works immediately
- ✅ No setup required
- ❌ No push token support

### Push Notifications (Development Build)
- ✅ Full push notification support
- ✅ Remote notifications
- ✅ Background notifications
- ⚠️ Requires development build

### Setup Instructions
1. **Configure projectId** in `app.json`
2. **Create development build**
3. **Install on physical device**
4. **Enable permissions**

---

## 🛠️ Development Workflow

### Daily Development
```bash
# Start backend server
cd backend && npm run dev

# Start frontend development server
npm start

# Test on device
npx expo install --fix
```

### Building for Production
```bash
# Preview build
eas build --profile preview

# Production build
eas build --profile production

# Deploy to stores
eas submit --platform all
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use the existing design system
- Write tests for new features
- Update documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Expo Team** - Amazing development tools
- **React Native Community** - Excellent libraries and support
- **Drizzle ORM** - Modern database toolkit
- **Hono Framework** - Fast web framework

---

## 📞 Support

- 📧 **Email**: cvlyx@proton.me
- 🐛 **Issues**: [GitHub Issues](https://github.com/cvlyx/PHOENIX/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/cvlyx/PHOENIX/discussions)

---

<div align="center">

### ⭐ Star this repository if it helped you!

Made with ❤️ by [cvlyx](https://github.com/cvlyx)

</div>
