export function buildOrderMetadataPayload(values = {}) {
  return {
    paymentMethod: values.paymentMethod ?? null,
    referenceNumber: values.referenceNumber ?? null,
    paymentProofPath: values.paymentProofPath ?? null,
    pickupDate: values.pickupDate ?? null,
    pickupTime: values.pickupTime ?? null,
    subtotal: values.subtotal ?? null,
    discount: values.discount ?? null,
    tax: values.tax ?? null,
  };
}

export function encodeOrderMetadataNote(payload) {
  return `__ORDER_META__${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
}

export function decodeOrderMetadataFromNote(note) {
  if (!note || typeof note !== 'string' || !note.startsWith('__ORDER_META__')) {
    return null;
  }

  try {
    const encoded = note.replace('__ORDER_META__', '');
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}
