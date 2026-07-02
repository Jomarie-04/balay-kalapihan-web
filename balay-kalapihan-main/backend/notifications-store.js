const MAX_NOTIFICATIONS = 20;
const storageKey = 'adminNotifications';
let notifications = [];

function readNotifications() {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage?.getItem) {
    try {
      const raw = globalThis.localStorage.getItem(storageKey);
      if (!raw) {
        return notifications;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        notifications = parsed;
      }
    } catch {
      // ignore storage parse errors
    }
  }

  return notifications;
}

function writeNotifications(nextNotifications) {
  notifications = nextNotifications.slice(-MAX_NOTIFICATIONS);

  if (typeof globalThis !== 'undefined' && globalThis.localStorage?.setItem) {
    try {
      globalThis.localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch {
      // ignore storage write failures
    }
  }
}

export function getAdminNotifications() {
  return readNotifications().slice(-MAX_NOTIFICATIONS);
}

export function addAdminNotification(payload) {
  const notification = {
    id: `${payload.type || 'notification'}_${Date.now()}`,
    type: payload.type || 'new_order',
    message: payload.message || 'New notification',
    orderNumber: payload.orderNumber,
    orderStatus: payload.orderStatus,
    timestamp: Date.now(),
    read: false,
  };

  const next = [notification, ...readNotifications()].slice(0, MAX_NOTIFICATIONS);
  writeNotifications(next);
  return notification;
}

export function replaceAdminNotifications(nextNotifications) {
  const normalized = Array.isArray(nextNotifications)
    ? nextNotifications.slice(-MAX_NOTIFICATIONS)
    : [];

  writeNotifications(normalized);
  return normalized;
}

export function clearAdminNotifications() {
  writeNotifications([]);
}
