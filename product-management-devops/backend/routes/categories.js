const express = require('express');
const router = express.Router();
const db = require('../models');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await db.Category.findAll({
      order: [['name', 'ASC']],
      include: [{ 
        model: db.Product, 
        as: 'products',
        attributes: ['id']
      }]
    });

    res.json(categories.map(cat => ({
      ...cat.toJSON(),
      productCount: cat.products.length
    })));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET single category
router.get('/:id', async (req, res) => {
  try {
    const category = await db.Category.findByPk(req.params.id, {
      include: [{ model: db.Product, as: 'products' }]
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// CREATE category
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await db.Category.create({ name, description });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors.map(e => e.message) 
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Category name already exists' });
    }

    res.status(500).json({ error: 'Failed to create category' });
  }
});

// UPDATE category
router.put('/:id', async (req, res) => {
  try {
    const category = await db.Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { name, description, isActive } = req.body;
    await category.update({ name, description, isActive });

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  try {
    const category = await db.Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has products
    const productCount = await db.Product.count({ where: { categoryId: req.params.id } });
    if (productCount > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete category with existing products',
        productCount 
      });
    }

    await category.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
