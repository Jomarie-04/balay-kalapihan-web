import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultStorePath = path.resolve(__dirname, 'data', 'orders.json');
const storePath = process.env.ORDER_STORE_PATH || defaultStorePath;

let cache = [];
let loaded = false;

async function ensureLoaded() {
  if (loaded) return;

  try {
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    const raw = await fs.readFile(storePath, 'utf8');
    cache = raw ? JSON.parse(raw) : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      cache = [];
    } else {
      console.warn('Could not load order store:', error.message);
      cache = [];
    }
  }

  loaded = true;
}

async function persistCache() {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(cache, null, 2));
}

export async function addLocalOrder(order) {
  await ensureLoaded();
  if (!order?.id) return null;

  const normalized = {
    ...order,
    id: String(order.id),
    status: order.status || 'pending',
    created_at: order.created_at || new Date().toISOString(),
    updated_at: order.updated_at || new Date().toISOString(),
    orderItems: Array.isArray(order.orderItems) ? order.orderItems : [],
    items: Array.isArray(order.orderItems) ? order.orderItems : [],
  };

  const existingIndex = cache.findIndex((entry) => String(entry.id) === String(order.id));
  if (existingIndex >= 0) {
    cache[existingIndex] = normalized;
  } else {
    cache.unshift(normalized);
  }

  await persistCache();
  return normalized;
}

export async function getLocalOrders() {
  await ensureLoaded();
  return cache;
}

export async function getLocalOrderById(orderId) {
  await ensureLoaded();
  return cache.find((entry) => String(entry.id) === String(orderId)) || null;
}

export async function updateLocalOrderStatus(orderId, status) {
  await ensureLoaded();
  const existing = cache.find((entry) => String(entry.id) === String(orderId));
  if (!existing) return null;

  existing.status = status;
  existing.updated_at = new Date().toISOString();
  await persistCache();
  return existing;
}

export async function deleteLocalOrder(orderId) {
  await ensureLoaded();
  const existingIndex = cache.findIndex((entry) => String(entry.id) === String(orderId));
  if (existingIndex === -1) return null;

  const [deleted] = cache.splice(existingIndex, 1);
  await persistCache();
  return deleted;
}
