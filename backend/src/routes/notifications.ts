import { Hono } from 'hono';
import { db } from '../db/index.js';
import { notifications } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

const notificationsRouter = new Hono();

// Get user's notifications
notificationsRouter.get('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id'); // Temporary - will use auth middleware

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });

    const unreadCount = userNotifications.filter((n: any) => !n.isRead).length;

    return c.json({
      notifications: userNotifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mark notification as read
notificationsRouter.patch('/:id/read', async (c) => {
  try {
    const notificationId = c.req.param('id');

    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));

    return c.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mark all notifications as read
notificationsRouter.patch('/read-all', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));

    return c.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create a notification
notificationsRouter.post('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { title, message, type } = await c.req.json();
    const [notif] = await db.insert(notifications).values({
      userId,
      title,
      message,
      type: type || 'info',
    }).returning();

    return c.json({ notification: notif }, 201);
  } catch (error) {
    console.error('Create notification error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete all read notifications for a user
notificationsRouter.delete('/read', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    await db.delete(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, true)));
    return c.json({ message: 'Read notifications cleared' });
  } catch (error) {
    console.error('Delete notifications error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { notificationsRouter as notificationRoutes };
