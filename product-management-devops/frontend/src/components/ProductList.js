import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productAPI, categoryAPI } from '../services/api';
import ProductForm from './ProductForm';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const ProductList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: productsData, isLoading, error } = useQuery(
    ['products', search, selectedCategory],
    () => productAPI.getAll({ search, categoryId: selectedCategory }),
    {
      select: (response) => response.data,
    }
  );

  const { data: categoriesData } = useQuery('categories', () => categoryAPI.getAll(), {
    select: (response) => response.data,
  });

  const deleteMutation = useMutation(productAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('products');
      alert('Product deleted successfully!');
    },
    onError: (error) => {
      alert('Failed to delete product: ' + error.response?.data?.error);
    },
  });

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="card error">Error loading products: {error.message}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Products</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '200px' }}
            >
              <option value="">All Categories</option>
              {categoriesData?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="product-grid">
          {productsData?.products?.map((product) => (
            <div key={product.id} className="product-card">
              {product.imageUrl && (
                <img src={product.imageUrl} alt={product.name} className="product-image" />
              )}
              <div className="product-content">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="product-price">${product.price}</div>
                <p>
                  <strong>SKU:</strong> {product.sku}
                </p>
                <p>
                  <strong>Stock:</strong> {product.stock}
                </p>
                <p>
                  <strong>Category:</strong> {product.category?.name || 'N/A'}
                </p>
                <span className={`badge ${product.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="product-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleEdit(product)}
                    style={{ flex: 1 }}
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(product.id)}
                    style={{ flex: 1 }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {productsData?.products?.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            No products found. Create your first product!
          </p>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleFormClose}
          categories={categoriesData}
        />
      )}
    </div>
  );
};

export default ProductList;
