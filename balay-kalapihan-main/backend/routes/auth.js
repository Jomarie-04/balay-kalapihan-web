import { Router } from 'express';
import { supabase } from '../database.js';
import { generateToken } from '../middleware.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, fullName, password, phoneNumber } = req.body;

    if (!username || !email || !fullName || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
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
        fullname: fullName,
        password: hashedPassword,
        phonenumber: phoneNumber || null
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
      user: { id: userId, username, email, fullName, phoneNumber }
    });
  } catch (err) {
    console.error('Signup - Catch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
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
        user: { id: 999, username: 'admin', email: 'admin@balaykalapihan.com', fullName: 'Administrator', isAdmin: true }
      });
    }

    // Get user from database
    const { data: users, error: selectError } = await supabase
      .from('customers')
      .select('id, username, email, fullname, password')
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
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.username, user.fullname);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, fullName: user.fullname }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    if (!req.userId && req.username !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.username === 'admin') {
      return res.json({
        id: 999,
        username: 'admin',
        email: 'admin@balaykalapihan.com',
        fullName: 'Administrator',
        isAdmin: true
      });
    }

    const { data: users, error: selectError } = await supabase
      .from('customers')
      .select('id, username, email, fullname, phonenumber, createdAt')
      .eq('id', req.userId)
      .limit(1);

    if (selectError) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email, fullName, phoneNumber } = req.body;

    const { error: updateError } = await supabase
      .from('customers')
      .update({
        email,
        fullname: fullName,
        phonenumber: phoneNumber
      })
      .eq('id', req.userId);

    if (updateError) {
      return res.status(500).json({ error: 'Could not update profile' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
