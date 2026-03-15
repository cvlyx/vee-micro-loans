import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/index.js';
import { users, notifications } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const auth = new Hono();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  // Additional KYC fields
  dob: z.string().optional(),
  nationalId: z.string().optional(),
  district: z.string().optional(),
  area: z.string().optional(),
  employmentStatus: z.string().optional(),
  monthlyIncome: z.string().optional(),
});

// Extended registration schema with documents
const registerWithDocsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  dob: z.string().optional(),
  nationalId: z.string().optional(),
  district: z.string().optional(),
  area: z.string().optional(),
  employmentStatus: z.string().optional(),
  monthlyIncome: z.string().optional(),
  // KYC Documents
  idDocumentType: z.enum(['national_id', 'passport']).optional(),
  idDocumentImage: z.string().optional(), // Base64 encoded
  selfieWithIdImage: z.string().optional(), // Base64 encoded
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Biometric login schema
const biometricLoginSchema = z.object({
  biometricId: z.string(),
});

// Enable biometric schema
const enableBiometricSchema = z.object({
  userId: z.string().uuid(),
  biometricId: z.string(),
});

// Register
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { email, password, fullName, phone, dob, nationalId, district, area, employmentStatus, monthlyIncome } = c.req.valid('json');

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with all KYC fields
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      fullName,
      phone: phone || null,
      dob: dob || null,
      nationalId: nationalId || null,
      district: district || null,
      area: area || null,
      employmentStatus: employmentStatus || null,
      monthlyIncome: monthlyIncome || null,
      role: 'user',
    }).returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
    });

    // Generate token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // TODO: Create welcome notification (uncomment after notifications table is created)
    // await db.insert(notifications).values({
    //   userId: newUser.id,
    //   title: 'Welcome to Vee Micro Loans!',
    //   message: `Your account has been created successfully, ${fullName}. You can now apply for loans.`,
    //   type: 'registration',
    // });

    return c.json({
      message: 'Registration successful',
      user: newUser,
      token,
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    console.log('🔑 Login attempt for:', email);

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    console.log('👤 User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('❌ User not found');
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔐 Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    console.log('✅ Login successful for:', email);

    return c.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Register with KYC Documents
auth.post('/register-with-documents', zValidator('json', registerWithDocsSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const { email, password, fullName, phone, dob, nationalId, district, area, employmentStatus, monthlyIncome, idDocumentType, idDocumentImage, selfieWithIdImage } = data;

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with all KYC fields including documents
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      fullName,
      phone: phone || null,
      dob: dob || null,
      nationalId: nationalId || null,
      district: district || null,
      area: area || null,
      employmentStatus: employmentStatus || null,
      monthlyIncome: monthlyIncome || null,
      role: 'user',
      // KYC Documents
      idDocumentType: idDocumentType || null,
      idDocumentImage: idDocumentImage || null,
      selfieWithIdImage: selfieWithIdImage || null,
      // If documents provided, set verification status to pending
      verificationStatus: (idDocumentImage || selfieWithIdImage) ? 'pending' : 'pending',
    }).returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      idDocumentType: users.idDocumentType,
      verificationStatus: users.verificationStatus,
    });

    // Generate token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return c.json({
      message: 'Registration successful',
      user: newUser,
      token,
    }, 201);
  } catch (error) {
    console.error('Register with documents error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Biometric Login
auth.post('/biometric-login', zValidator('json', biometricLoginSchema), async (c) => {
  try {
    const { biometricId } = c.req.valid('json');
    console.log('🔑 Biometric login attempt');

    // Find user by biometric ID
    const user = await db.query.users.findFirst({
      where: eq(users.biometricId, biometricId),
    });

    if (!user || !user.biometricEnabled) {
      console.log('❌ User not found or biometric not enabled');
      return c.json({ error: 'Biometric authentication failed' }, 401);
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    console.log('✅ Biometric login successful for:', user.email);

    return c.json({
      message: 'Biometric login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('❌ Biometric login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Enable Biometric for existing user
auth.post('/enable-biometric', zValidator('json', enableBiometricSchema), async (c) => {
  try {
    const { userId, biometricId } = c.req.valid('json');
    console.log('🔐 Enabling biometric for user:', userId);

    // Update user with biometric settings
    const [updatedUser] = await db.update(users)
      .set({
        biometricEnabled: true,
        biometricId: biometricId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        biometricEnabled: users.biometricEnabled,
      });

    if (!updatedUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    console.log('✅ Biometric enabled for:', updatedUser.email);

    return c.json({
      message: 'Biometric authentication enabled',
      user: updatedUser,
    });
  } catch (error) {
    console.error('❌ Enable biometric error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Disable Biometric
auth.post('/disable-biometric', async (c) => {
  try {
    const { userId } = await c.req.json();
    console.log('🔐 Disabling biometric for user:', userId);

    const [updatedUser] = await db.update(users)
      .set({
        biometricEnabled: false,
        biometricId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        biometricEnabled: users.biometricEnabled,
      });

    if (!updatedUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      message: 'Biometric authentication disabled',
      user: updatedUser,
    });
  } catch (error) {
    console.error('❌ Disable biometric error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { auth as authRoutes };
