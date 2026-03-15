import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import * as dotenv from 'dotenv';
import { serve } from '@hono/node-server';
import { authRoutes } from './routes/auth.js';
import { loanRoutes } from './routes/loans.js';
import { applicationRoutes } from './routes/applications.js';
import { userRoutes } from './routes/users.js';
import { notificationRoutes } from './routes/notifications.js';
import { adminRoutes } from './routes/admin.js';
import { swaggerUI } from '@hono/swagger-ui';

// Load environment variables
dotenv.config();

const app = new Hono();

// Middleware
app.use('*', logger());

// Dynamic CORS for production and development
app.use('*', cors({
  origin: (origin) => {
    // Allow all origins in production, specific origins in development
    const allowedOrigins = [
      'http://localhost:8081',
      'http://localhost:8082',
      'http://192.168.90.50:8081',
      'http://192.168.90.50:8082',
      // Add your deployed frontend URL here when ready
    ];
    // In production, allow any origin
    if (process.env.NODE_ENV === 'production') {
      return origin || '*';
    }
    // In development, allow specific origins or any
    return origin || allowedOrigins[0];
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Documentation
app.get('/doc', (c) => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'Phoenix Loan API',
      version: '1.0.0',
      description: 'Loan management system API',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
    paths: {},
  });
});

app.get('/docs', swaggerUI({ url: '/doc' }));

// Routes
app.route('/api', authRoutes); // Auth uses /login, /register, etc. directly
app.route('/api/loans', loanRoutes);
app.route('/api/applications', applicationRoutes);
app.route('/api/users', userRoutes);
app.route('/api/notifications', notificationRoutes);
// Admin routes under /api/admin to avoid conflicts with /api/:id
app.route('/api/admin', adminRoutes);

// Start server with @hono/node-server
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

console.log(`🚀 Starting server on port ${port}...`);
console.log(`📝 API Documentation: http://localhost:${port}/docs`);
console.log(`💚 Health check: http://localhost:${port}/health`);

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0', // Listen on all network interfaces
}, (info) => {
  console.log(`✅ Server is running at http://localhost:${info.port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`✅ Also accessible at http://192.168.90.50:${info.port}`);
  }
});
