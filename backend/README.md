# Phoenix Loan Backend API

A secure and scalable backend API for the Phoenix Loan application, built with Hono and connected to Neon DB.

## Features

- 🔐 JWT Authentication (Register/Login)
- 💰 Loan Management
- 📝 Loan Applications
- 👥 User Management
- 🔒 Role-based Access Control (Admin/User)
- 📊 API Documentation with Swagger UI
- 🛡️ Input Validation with Zod

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Hono (Fast, lightweight web framework)
- **Database:** PostgreSQL via Neon DB
- **ORM:** Drizzle ORM
- **Authentication:** JWT + bcryptjs
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- Neon DB account (free tier available at https://neon.tech)

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=your_neon_db_connection_string
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:8081
   ```

4. **Get your Neon DB connection string:**
   - Go to https://neon.tech
   - Create a new project or select existing one
   - Copy the connection string from the dashboard
   - Paste it in `DATABASE_URL` in your `.env` file

5. **Push database schema**
   ```bash
   npm run db:push
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Loans
- `GET /api/loans` - Get all loans (Admin)
- `GET /api/loans/my-loans` - Get user's loans
- `GET /api/loans/:id` - Get single loan
- `POST /api/loans` - Create loan
- `PATCH /api/loans/:id/status` - Update loan status (Admin)

### Applications
- `GET /api/applications` - Get all applications (Admin)
- `GET /api/applications/my-applications` - Get user's applications
- `GET /api/applications/:id` - Get single application
- `POST /api/applications` - Create application
- `PATCH /api/applications/:id/review` - Review application (Admin)

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:id` - Get single user (Admin)

## API Documentation

Once the server is running, visit:
- **Swagger UI:** http://localhost:5000/docs
- **OpenAPI Spec:** http://localhost:5000/doc

## Database Schema

### Tables

1. **users** - User accounts (admin & regular users)
2. **loans** - Loan records
3. **loan_applications** - Loan applications
4. **repayments** - Repayment schedules

Run `npm run db:push` to create/update tables in your Neon DB.

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_token_here>
```

Get the token by registering or logging in via `/api/register` or `/api/login`.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong, random `JWT_SECRET`
3. Configure CORS with your production frontend URL
4. Deploy to your preferred hosting (Railway, Render, Fly.io, etc.)

### Example Deployment Commands

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Security Notes

- Always use HTTPS in production
- Keep your `JWT_SECRET` secure and rotate periodically
- Never commit `.env` files
- Enable rate limiting for production
- Implement proper error handling (currently in development)

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Drizzle migrations

## Troubleshooting

**Database connection errors:**
- Verify your Neon DB connection string
- Check if your IP is allowed in Neon dashboard
- Ensure database is active

**Port already in use:**
- Change `PORT` in your `.env` file
- Or kill the process using port 5000

**CORS errors:**
- Add your frontend URL to `FRONTEND_URL` in `.env`
- Update CORS configuration in `src/index.ts`

## License

MIT
