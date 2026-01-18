const express = require('express');
const router = express.Router();
const db = require('../models');

// GET all products
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoryId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where.name = { [db.Sequelize.Op.iLike]: `%${search}%` };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const { count, rows } = await db.Product.findAndCountAll({
      where,
      include: [{ model: db.Category, as: 'category' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      products: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const product = await db.Product.findByPk(req.params.id, {
      include: [{ model: db.Category, as: 'category' }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// CREATE product
router.post('/', async (req, res) => {
  try {
    const { name, description, price, stock, sku, imageUrl, categoryId } = req.body;

    const product = await db.Product.create({
      name,
      description,
      price,
      stock,
      sku,
      imageUrl,
      categoryId
    });

    const createdProduct = await db.Product.findByPk(product.id, {
      include: [{ model: db.Category, as: 'category' }]
    });

    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors.map(e => e.message) 
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'SKU already exists' });
    }

    res.status(500).json({ error: 'Failed to create product' });
  }
});

// UPDATE product
router.put('/:id', async (req, res) => {
  try {
    const product = await db.Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, description, price, stock, sku, imageUrl, categoryId, isActive } = req.body;

    await product.update({
      name,
      description,
      price,
      stock,
      sku,
      imageUrl,
      categoryId,
      isActive
    });

    const updatedProduct = await db.Product.findByPk(product.id, {
      include: [{ model: db.Category, as: 'category' }]
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors.map(e => e.message) 
      });
    }

    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const product = await db.Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
