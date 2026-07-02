import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderMetadataPayload, encodeOrderMetadataNote, decodeOrderMetadataFromNote } from './order-metadata.js';

test('buildOrderMetadataPayload keeps the payment and pickup fields in a serializable object', () => {
  const payload = buildOrderMetadataPayload({
    paymentMethod: 'Maya',
    referenceNumber: 'REF-123',
    pickupDate: '2026-07-02',
    pickupTime: '14:00',
    subtotal: 100,
    discount: 0,
    tax: 0,
  });

  assert.deepEqual(payload, {
    paymentMethod: 'Maya',
    referenceNumber: 'REF-123',
    pickupDate: '2026-07-02',
    pickupTime: '14:00',
    subtotal: 100,
    discount: 0,
    tax: 0,
  });
});

test('encodeOrderMetadataNote and decodeOrderMetadataFromNote round-trip the metadata payload', () => {
  const payload = buildOrderMetadataPayload({
    paymentMethod: 'GCash',
    referenceNumber: 'ABC-999',
    pickupDate: '2026-07-03',
    pickupTime: '16:30',
    subtotal: 80,
    discount: 10,
    tax: 5,
  });

  const note = encodeOrderMetadataNote(payload);
  assert.match(note, /^__ORDER_META__/);

  const decoded = decodeOrderMetadataFromNote(note);
  assert.deepEqual(decoded, payload);
});
