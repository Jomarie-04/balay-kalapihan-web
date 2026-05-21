import { Router } from 'express';
import { supabase } from '../database.js';
import { authenticate } from '../middleware.js';

const router = Router();

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
router.post('/', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, category, price, description } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: newItems, error } = await supabase
      .from('menu_items')
      .insert({
        name,
        category,
        price,
        status: 'available',
        description: description || null,
        sales: 0
      })
      .select();

    if (error) {
      return res.status(500).json({ error: 'Could not create menu item' });
    }

    const item = newItems[0];
    res.status(201).json({
      message: 'Menu item created successfully',
      id: item.id,
      item: { id: item.id, name, category, price, status: 'available', sales: 0 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update menu item (admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, category, price, description } = req.body;

    const { error } = await supabase
      .from('menu_items')
      .update({
        name,
        category,
        price,
        description: description || null
      })
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: 'Could not update menu item' });
    }

    res.json({ message: 'Menu item updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update menu item (PATCH - admin only)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, category, price, status, description } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = price;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description || null;

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

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: 'Could not delete menu item' });
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
