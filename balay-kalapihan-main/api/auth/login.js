import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function generateToken(userId, username, fullName, isAdmin = false) {
  return jwt.sign(
    { userId, username, fullName, isAdmin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Admin login
    if (username === 'admin' && password === 'admin123') {
      const token = generateToken(999, 'admin', 'Administrator', true);
      return res.json({
        message: 'Admin login successful',
        token,
        user: {
          id: 999,
          username: 'admin',
          email: 'admin@balaykalapihan.com',
          fullName: 'Administrator',
          isAdmin: true
        }
      });
    }

    // Get user from database
    const { data: users, error: selectError } = await supabase
      .from('customers')
      .select('id, username, email, full_name, password')
      .eq('username', username)
      .limit(1);

    if (selectError) {
      console.error('Login - Select error:', selectError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    
    // Try bcrypt comparison first (for hashed passwords)
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
    } catch (err) {
      // If bcrypt fails, fall back to plain text comparison (for legacy accounts)
      passwordMatch = (password === user.password);
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If password was plain text, hash it and update in database
    if (password === user.password && !user.password.startsWith('$2')) {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await supabase
          .from('customers')
          .update({ password: hashedPassword })
          .eq('id', user.id);
      } catch (hashErr) {
        console.warn('Could not update password hash:', hashErr);
      }
    }

    const token = generateToken(user.id, user.username, user.full_name);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
}
