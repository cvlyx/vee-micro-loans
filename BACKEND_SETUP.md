# Backend Setup Guide - Phoenix Loan

## ✅ What's Been Created

A complete backend API has been set up in the `backend/` directory with:

### 📁 Project Structure
```
backend/
├── src/
│   ├── db/
│   │   ├── index.ts          # Database connection (Neon DB)
│   │   └── schema.ts         # Database schema (users, loans, applications, repayments)
│   ├── routes/
│   │   ├── auth.ts           # Authentication endpoints
│   │   ├── loans.ts          # Loan management endpoints
│   │   ├── applications.ts   # Application endpoints
│   │   └── users.ts          # User management endpoints
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication middleware
│   └── index.ts              # Main server entry point
├── package.json
├── drizzle.config.ts
├── .env
└── README.md
```

### 🚀 Features Implemented

1. **Authentication System**
   - User registration with password hashing
   - User login with JWT token generation
   - Secure password storage using bcryptjs

2. **Loan Management**
   - Create loans
   - View all loans (admin)
   - View user-specific loans
   - Update loan status (admin)

3. **Application System**
   - Submit loan applications
   - Review applications (admin)
   - Track application status
   - Admin notes on applications

4. **User Management**
   - User profile management
   - Admin user listing
   - Role-based access control

5. **Security**
   - JWT authentication
   - Password hashing with bcryptjs
   - Input validation with Zod
   - CORS protection
   - Role-based middleware

## 🔧 Setup Instructions

### Step 1: Get Neon DB Connection String

1. Go to https://neon.tech
2. Sign up or log in
3. Create a new project (or use existing one)
4. Copy the connection string from the dashboard
   - Format: `postgresql://user:password@host/database?sslmode=require`

### Step 2: Configure Environment Variables

1. Open `backend/.env`
2. Replace `your_neon_db_connection_string` with your actual Neon DB connection string
3. Generate a strong JWT secret (use a random string generator)
4. Update `FRONTEND_URL` if needed

Example:
```env
DATABASE_URL=postgresql://alex:abc123@ep-cool-king-123456.us-east-2.aws.neon.tech/phoenix-loan?sslmode=require
JWT_SECRET=super_random_secret_key_change_this_now_12345
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
```

### Step 3: Set Up Database

Open a terminal in the backend directory and run:

```bash
cd backend
npm run db:push
```

This will create all the necessary tables in your Neon DB:
- users
- loans
- loan_applications
- repayments

### Step 4: Start the Backend Server

```bash
npm run dev
```

The server should start on http://localhost:5000

### Step 5: Test the API

1. **Health Check:**
   Visit: http://localhost:5000/health
   
2. **API Documentation:**
   Visit: http://localhost:5000/docs
   
3. **Test Registration:**
   ```bash
   curl -X POST http://localhost:5000/api/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "fullName": "Test User"
     }'
   ```

## 📝 Next Steps

### For Frontend Integration:

Update your frontend code to connect to this backend:

1. **Replace localhost URLs** in your frontend components with:
   ```javascript
   const API_URL = 'http://localhost:5000/api';
   ```

2. **Store JWT tokens** after login/registration
3. **Add Authorization header** to protected requests:
   ```javascript
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```

### Example API Usage from Frontend:

```javascript
// Register
const register = async (userData) => {
  const response = await fetch('http://localhost:5000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  // Save data.token to AsyncStorage
};

// Get user's loans
const getLoans = async (token) => {
  const response = await fetch('http://localhost:5000/api/loans/my-loans', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.loans;
};
```

## 🐛 Troubleshooting

**Database Connection Failed:**
- Verify your Neon DB connection string is correct
- Check if database is active in Neon dashboard
- Ensure SSL mode is enabled in connection string

**Port Already in Use:**
- Change PORT in `.env` file
- Or kill process: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`

**CORS Errors:**
- Make sure FRONTEND_URL in `.env` matches your frontend URL
- Restart the server after changing `.env`

## 📊 Database Schema

### Users Table
- id (UUID, primary key)
- email (unique)
- password (hashed)
- fullName
- phone
- role (user/admin)
- createdAt, updatedAt

### Loans Table
- id (UUID)
- userId (FK → users)
- amount
- interestRate
- term (months)
- status (pending/approved/rejected/active/completed)
- purpose
- createdAt, updatedAt

### Loan Applications Table
- id (UUID)
- userId (FK → users)
- loanId (FK → loans, nullable)
- amount
- employmentStatus
- monthlyIncome
- employerName
- reason
- status (pending/under_review/approved/rejected)
- adminNotes
- createdAt, reviewedAt, reviewedBy

### Repayments Table
- id (UUID)
- loanId (FK → loans)
- amount
- dueDate
- paidDate
- status (pending/paid/overdue)
- createdAt

## 🎯 Quick Commands Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Push database schema
npm run db:push

# Generate migrations
npm run db:generate
```

---

## ✨ Ready to Use!

Your backend is now ready to be connected to your Expo frontend application!
