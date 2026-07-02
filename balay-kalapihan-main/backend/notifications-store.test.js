import test from 'node:test';
import assert from 'node:assert/strict';
import { addAdminNotification, clearAdminNotifications, getAdminNotifications, replaceAdminNotifications } from './notifications-store.js';

test('addAdminNotification stores new order alerts and keeps recent history', () => {
  clearAdminNotifications();

  const notification = addAdminNotification({
    type: 'new_order',
    message: 'New order received',
    orderNumber: 'ORD-123',
    orderStatus: 'pending'
  });

  assert.equal(notification.type, 'new_order');
  assert.equal(getAdminNotifications()[0].orderNumber, 'ORD-123');
  assert.equal(getAdminNotifications().length, 1);
});

test('replaceAdminNotifications syncs the full notification list without duplicates', () => {
  clearAdminNotifications();

  const synced = replaceAdminNotifications([
    { id: 'one', type: 'new_order', message: 'One', timestamp: 1, read: false },
    { id: 'two', type: 'new_order', message: 'Two', timestamp: 2, read: false }
  ]);

  assert.equal(synced.length, 2);
  assert.equal(getAdminNotifications().length, 2);
});
