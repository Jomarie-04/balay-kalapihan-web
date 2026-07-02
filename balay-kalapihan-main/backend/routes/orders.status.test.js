import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readOrdersRoute() {
  const filePath = path.join(__dirname, 'orders.js');
  return readFile(filePath, 'utf8');
}

test('orders route includes a local fallback order creation helper for status updates', async () => {
  const source = await readOrdersRoute();
  assert.match(source, /async function ensureLocalFallbackOrder/);
  assert.match(source, /await ensureLocalFallbackOrder\(req\.params\.id/);
});
