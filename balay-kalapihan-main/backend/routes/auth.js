import { Router } from 'express';
import { supabase } from '../database.js';
import { generateToken } from '../middleware.js';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { generateResetCode, storeResetCode, verifyResetCode } from '../password-reset.js';
import { sendResetCodeEmail } from '../email.js';

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

    // Insert new user with timeout and retry logic
    let newUser;
    let insertError;

    try {
      // Try REST API with fresh client instance (sometimes helps with schema cache issues)
      const freshSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
      );

      // First try with the main client
      const { data: restData, error: restError } = await supabase
        .from('customers')
        .insert({
          username,
          email,
          full_name: fullName,
          password: hashedPassword,
          phone_number: phoneNumber || null
        })
        .select();

      if (!restError) {
        newUser = restData;
      } else if (restError.code === 'PGRST204') {
        // Schema cache issue - try with fresh client instance
        console.warn('⚠️  Schema cache issue detected, retrying with fresh Supabase client...');
        
        // Wait a moment and retry
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: retryData, error: retryError } = await freshSupabase
          .from('customers')
          .insert({
            username,
            email,
            full_name: fullName,
            password: hashedPassword,
            phone_number: phoneNumber || null
          })
          .select();
        
        if (!retryError) {
          newUser = retryData;
        } else {
          insertError = retryError;
        }
      } else {
        insertError = restError;
      }
    } catch (err) {
      console.error('Signup - Catch error:', err);
      insertError = err;
    }

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

// Forgot password - step 1: send security code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: users, error: selectError } = await supabase
      .from('customers')
      .select('id, email')
      .limit(100);

    if (selectError) {
      console.error('Forgot password - Select error:', selectError);
      return res.status(500).json({ error: 'Database error' });
    }

    const matchingUser = users?.find((user) => user.email?.trim().toLowerCase() === normalizedEmail);

    if (!matchingUser) {
      return res.status(404).json({ error: 'No account found with that email address' });
    }

    const code = generateResetCode();
    await storeResetCode(normalizedEmail, code);
    const emailResult = await sendResetCodeEmail(normalizedEmail, code);

    console.log(`Password reset code for ${normalizedEmail}: ${code}`);

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.reason);
      return res.status(500).json({ error: 'Failed to send verification code email', reason: emailResult.reason });
    }

    res.json({ message: 'Verification code sent to your email', email: normalizedEmail });
  } catch (err) {
    console.error('Forgot password route error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Forgot password - step 2: verify code and change password
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isValidCode = await verifyResetCode(normalizedEmail, code);

    if (!isValidCode) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const { data: users, error: selectError } = await supabase
      .from('customers')
      .select('id, email')
      .limit(100);

    if (selectError) {
      console.error('Verify reset code - Select error:', selectError);
      return res.status(500).json({ error: 'Database error' });
    }

    const matchingUser = users?.find((user) => user.email?.trim().toLowerCase() === normalizedEmail);

    if (!matchingUser) {
      return res.status(404).json({ error: 'No account found with that email address' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from('customers')
      .update({ password: hashedPassword })
      .eq('id', matchingUser.id);

    if (updateError) {
      console.error('Verify reset code - Update error:', updateError);
      return res.status(500).json({ error: 'Could not update password' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Verify reset code route error:', err);
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
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.username, user.full_name);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, fullName: user.full_name }
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
      .select('id, username, email, full_name, phone_number, created_at')
      .eq('id', req.userId)
      .limit(1);

    if (selectError) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: users[0].id,
      username: users[0].username,
      email: users[0].email,
      fullName: users[0].full_name,
      phoneNumber: users[0].phone_number,
      createdAt: users[0].created_at
    });
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
        full_name: fullName,
        phone_number: phoneNumber
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
