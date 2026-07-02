import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let adminNotifications = [];
const MAX_NOTIFICATIONS = 20;

function readNotifications() {
  return adminNotifications;
}

function writeNotifications(notifications) {
  adminNotifications = notifications.slice(-MAX_NOTIFICATIONS);
  return adminNotifications;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      res.status(200).json(readNotifications());
      return;
    }

    if (req.method === 'POST') {
      const payload = req.body;

      if (Array.isArray(payload)) {
        if (payload.length === 0) {
          writeNotifications([]);
          res.status(200).json({ message: 'Notifications cleared' });
          return;
        }

        writeNotifications(payload);
        res.status(200).json({ message: 'Notifications saved', notifications: readNotifications() });
        return;
      }

      if (!payload || !payload.message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const notification = {
        id: `${payload.type || 'notification'}_${Date.now()}`,
        type: payload.type || 'new_order',
        message: payload.message,
        orderNumber: payload.orderNumber,
        orderStatus: payload.orderStatus,
        read: false,
        timestamp: Date.now(),
      };

      const nextNotifications = [notification, ...readNotifications()].slice(0, MAX_NOTIFICATIONS);
      writeNotifications(nextNotifications);
      res.status(201).json(notification);
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
