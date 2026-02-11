import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * User Register
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, password and name are required' });
    return;
  }

  try {
    // Check if user exists (Supabase will return error if not found, but we should handle graceful 'not found')
    // Note: If RLS is on and we use anon key, we might not be able to query users table directly.
    // Ensure we are using Service Role Key in lib/supabase.ts for backend admin tasks.
    
    // First, check for duplicate email without throwing
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('email', email);

    if (count && count > 0) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          name,
          role: 'analyst' // Default role
        }
      ])
      .select()
      .single();

    if (error) {
      // Catch unique constraint violation explicitly if race condition occurs
      if (error.code === '23505') {
         res.status(409).json({ error: 'User already exists' });
         return;
      }
      throw error;
    }

    res.status(201).json({ message: 'User created successfully', user: { id: data.id, email: data.email, name: data.name } });
  } catch (error: any) {
    console.error('Registration error:', error);
    // Return more specific error message if available
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  // Since JWT is stateless, logout is handled client-side by removing the token.
  // We can just return success here.
  res.json({ message: 'Logged out successfully' });
});

export default router;
