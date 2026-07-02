import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultStorePath = path.resolve(__dirname, 'data', 'order-metadata.json');
const storePath = process.env.ORDER_METADATA_STORE_PATH || defaultStorePath;

let cache = null;
let loaded = false;

async function ensureLoaded() {
  if (loaded) return;

  try {
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    const raw = await fs.readFile(storePath, 'utf8');
    cache = raw ? JSON.parse(raw) : {};
  } catch (error) {
    if (error.code === 'ENOENT') {
      cache = {};
    } else {
      console.warn('Could not load order metadata store:', error.message);
      cache = {};
    }
  }

  loaded = true;
}

async function persistCache() {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(cache, null, 2));
}

export async function persistOrderMetadata(orderId, payload) {
  await ensureLoaded();
  if (!orderId || !payload) return null;

  cache[orderId] = payload;
  await persistCache();
  return payload;
}

export async function getOrderMetadata(orderId) {
  await ensureLoaded();
  return orderId ? cache[orderId] || null : null;
}

export async function getOrderMetadataForIds(orderIds = []) {
  await ensureLoaded();
  return orderIds.reduce((acc, orderId) => {
    if (orderId && cache[orderId]) {
      acc[orderId] = cache[orderId];
    }
    return acc;
  }, {});
}
