---
name: code-review
description: Review code for quality, security, and maintainability following Phoenix Loan Services project standards. Use when reviewing pull requests, examining code changes, or when the user asks for a code review on the React Native/Expo loan app.
---

# Code Review - Phoenix Loan Services

## Quick Start

When reviewing code in this project:

1. Check for correctness and potential bugs
2. Verify security best practices (financial data handling)
3. Assess React Native / Expo compatibility
4. Ensure AsyncStorage usage follows patterns
5. Validate loan calculation accuracy
6. Check admin portal security

## Review Checklist

### General Code Quality
- [ ] Logic is correct and handles edge cases
- [ ] No console.log statements in production code
- [ ] Proper error handling with try/catch
- [ ] TypeScript types are accurate and complete
- [ ] Functions are appropriately sized and focused
- [ ] No hardcoded values (use constants/colors.ts)

### React Native / Expo Specific
- [ ] No Reanimated hooks in web contexts (causes "Invalid hook call")
- [ ] Proper use of Expo Router file-based routing
- [ ] Correct icon usage (@expo/vector-icons)
- [ ] Image assets use proper Expo Asset patterns
- [ ] Keyboard handling uses KeyboardAwareScrollView

### Security (Critical for Financial App)
- [ ] No sensitive data in AsyncStorage (only session tokens)
- [ ] Admin endpoints require authentication
- [ ] Input validation on all forms
- [ ] No SQL injection vulnerabilities in backend
- [ ] Proper password hashing (bcrypt)
- [ ] No hardcoded credentials or API keys

### Loan Business Logic
- [ ] Interest calculations match specifications:
  - 1 week: 20%, 2 weeks: 30%, 3 weeks: 40%, 4 weeks: 50%
- [ ] Processing fee is 5% flat
- [ ] Loan amounts within MWK 5,000–200,000 range
- [ ] Repayment calculations include all fees
- [ ] Date calculations handle timezone correctly

### Context/State Management
- [ ] AuthContext properly manages user session
- [ ] LoanContext handles loan lifecycle correctly
- [ ] AdminContext secures admin operations
- [ ] AsyncStorage keys use `@phoenix_` prefix

## Providing Feedback

Format feedback as:
- **Critical**: Must fix before merge (security, broken functionality)
- **Suggestion**: Consider improving (performance, readability)
- **Nice to have**: Optional enhancement

## Project-Specific Patterns

### Color Usage
Always import from constants/colors.ts:
```typescript
import { Colors } from '@/constants/colors';
// Use: Colors.primary, Colors.secondary, etc.
```

### AsyncStorage Pattern
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys must use @phoenix_ prefix
const USER_KEY = '@phoenix_user';
const LOANS_KEY = '@phoenix_loans';
```

### Navigation
Use Expo Router file-based routing. New directories require frontend restart.

## Additional Resources

- For project architecture, see [replit.md](/replit.md)
- For backend API details, see [BACKEND_SETUP.md](/BACKEND_SETUP.md)
