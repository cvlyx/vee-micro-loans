import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

export interface AuthContextVariable {
  userId: string;
  email: string;
  role: string;
}

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthContextVariable;
      
      // Set user info in context variables
      c.set('userId', decoded.userId);
      c.set('email', decoded.email);
      c.set('role', decoded.role);

      await next();
    } catch (error) {
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};

// Admin only middleware
export const adminMiddleware = async (c: Context, next: Next) => {
  const role = c.get('role');
  
  if (role !== 'admin') {
    return c.json({ error: 'Forbidden - Admin access required' }, 403);
  }

  await next();
};
