import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { supabase } from '../database.js';
import { authenticate } from '../middleware.js';
import { deleteUploadedImageFile } from '../utils/image-utils.js';

const router = Router();
const uploadDir = path.resolve(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, extension).replace(/\s+/g, '-').toLowerCase();
    const fileName = `${safeName}-${Date.now()}-${Math.round(Math.random() * 1e6)}${extension}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('name');

    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(items || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get menu items by category
router.get('/category/:category', async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category', req.params.category)
      .order('name');

    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(items || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', req.params.id)
      .limit(1);

    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!items || items.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(items[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create menu item (admin only)
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, category, price, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a valid number greater than zero' });
    }

    const insertData = {
      name,
      category,
      price: numericPrice,
      status: 'available',
      description: description || null,
      image: imageUrl,
    };

    const { data: newItems, error } = await supabase
      .from('menu_items')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: error.message || 'Could not create menu item', details: error.details || error });
    }

    const item = newItems[0];
    res.status(201).json(item);
  } catch (err) {
    console.error('Create menu item error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update menu item (admin only)
router.put('/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, category, price, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined && price !== '') updateData.price = Number(price);
    if (description !== undefined) updateData.description = description || null;
    if (imageUrl !== undefined) updateData.image = imageUrl;

    const { data: updatedItems, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', req.params.id)
      .select();

    if (error) {
      return res.status(500).json({ error: 'Could not update menu item' });
    }

    res.json(updatedItems[0]);
  } catch (err) {
    console.error('Update menu item error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update menu item (PATCH - admin only)
router.patch('/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, category, price, status, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = Number(price);
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description || null;
    if (imageUrl !== undefined) updateData.image = imageUrl;

    const { error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', req.params.id);

    if (error) {
      console.error('Menu update error:', error);
      return res.status(500).json({ error: 'Could not update menu item: ' + error.message });
    }

    res.json({ message: 'Menu item updated successfully' });
  } catch (err) {
    console.error('Update menu error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete menu item (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: menuItemsData, error: selectError } = await supabase
      .from('menu_items')
      .select('id,image')
      .eq('id', req.params.id)
      .limit(1);

    if (selectError) {
      return res.status(500).json({ error: 'Could not load menu item' });
    }

    if (!menuItemsData || menuItemsData.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const imageUrl = menuItemsData[0].image;

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: 'Could not delete menu item' });
    }

    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      try {
        await deleteUploadedImageFile(imageUrl, uploadDir);
      } catch (unlinkError) {
        console.warn('Failed to delete menu item image file:', unlinkError);
      }
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update menu item status (admin only)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.body;

    if (!['available', 'unavailable'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "available" or "unavailable"' });
    }

    const { error } = await supabase
      .from('menu_items')
      .update({ status })
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: 'Could not update status' });
    }

    console.log(`Menu item ${req.params.id} status updated to: ${status}`);
    res.json({ message: 'Status updated successfully', status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Increment sales count
router.patch('/:id/sales', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    // Get current sales
    const { data: items, error: selectError } = await supabase
      .from('menu_items')
      .select('sales')
      .eq('id', req.params.id)
      .limit(1);

    if (selectError || !items || items.length === 0) {
      return res.status(500).json({ error: 'Could not update sales' });
    }

    const currentSales = items[0].sales || 0;
    const newSales = currentSales + quantity;

    const { error: updateError } = await supabase
      .from('menu_items')
      .update({ sales: newSales })
      .eq('id', req.params.id);

    if (updateError) {
      return res.status(500).json({ error: 'Could not update sales' });
    }

    res.json({ message: 'Sales updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
