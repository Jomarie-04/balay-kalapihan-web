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
    const { username, email, fullName, password, phoneNumber } = req.body;

    if (!username || !email || !fullName || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prevent admin account creation
    if (username === 'admin') {
      return res.status(400).json({ error: 'This username is reserved' });
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('customers')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .limit(1);

    if (checkError) {
      console.error('Signup - Check user error:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('customers')
      .insert({
        username,
        email,
        full_name: fullName,
        password: hashedPassword,
        phone_number: phoneNumber || null
      })
      .select();

    if (insertError) {
      console.error('Signup - Insert error:', insertError);
      return res.status(500).json({ error: 'Could not create user: ' + insertError.message });
    }

    const userId = newUser[0].id;
    const token = generateToken(userId, username, fullName);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: userId,
        username,
        email,
        fullName,
        phoneNumber
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
}
