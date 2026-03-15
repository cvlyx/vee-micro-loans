import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const usersRouter = new Hono();

// Get all users (admin only)
usersRouter.get('/', async (c) => {
  try {
    const allUsers = await db.query.users.findMany({
      columns: {
        password: false, // Exclude password
      },
      with: {
        loans: {
          columns: {
            id: true,
            amount: true,
            status: true,
          },
        },
        applications: {
          columns: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: [desc(users.createdAt)],
    });

    return c.json({ users: allUsers });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get user profile
usersRouter.get('/profile', async (c) => {
  try {
    const userId = c.req.header('X-User-Id'); // Temporary

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false,
      },
      with: {
        loans: true,
        applications: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user profile
usersRouter.put('/profile', async (c) => {
  try {
    const userId = c.req.header('X-User-Id'); // Temporary
    const body = await c.req.json();
    const { fullName, phone } = body;

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const [updatedUser] = await db.update(users)
      .set({
        fullName,
        phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        isBlacklisted: users.isBlacklisted,
      });

    return c.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get single user (admin)
usersRouter.get('/:id', async (c) => {
  try {
    const userId = c.req.param('id');

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false,
      },
      with: {
        loans: true,
        applications: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin toggle blacklist
usersRouter.put('/:id/blacklist', async (c) => {
  try {
    const userId = c.req.param('id');
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const [updatedUser] = await db.update(users)
      .set({
        isBlacklisted: !user.isBlacklisted,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id, isBlacklisted: users.isBlacklisted });

    return c.json({ message: 'User blacklist status updated', user: updatedUser });
  } catch (error) {
    console.error('Blacklist user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

import bcrypt from 'bcryptjs';

// Admin update user password
usersRouter.put('/:id/password', async (c) => {
  try {
    const userId = c.req.param('id');
    const { password } = await c.req.json();

    if (!password || password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [updatedUser] = await db.update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (!updatedUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { usersRouter as userRoutes };
