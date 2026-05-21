import { Router } from 'express';
import { authenticate } from '../middleware.js';

const router = Router();

// Admin Security Data
router.get('/security', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Return mock security data
    const securityLog = {
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date().toISOString()
    };

    res.json(securityLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Sessions
router.get('/sessions', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Return mock session data
    const sessions = [
      {
        loginTime: Date.now(),
        loginDate: new Date().toLocaleDateString(),
        sessionDuration: 30 * 60 * 1000 // 30 minutes
      }
    ];

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Audit Log
router.get('/audit', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Return mock audit data
    const auditLog = [
      {
        action: 'login',
        timestamp: Date.now()
      }
    ];

    res.json(auditLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications endpoints
router.get('/notifications', authenticate, async (req, res) => {
  try {
    // Return empty notifications array
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications', authenticate, async (req, res) => {
  try {
    // Accept but don't persist notifications for now
    res.json({ message: 'Notifications saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
