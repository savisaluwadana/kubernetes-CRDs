import React from 'react';
import { useQuery } from 'react-query';
import { productAPI, categoryAPI } from '../services/api';
import { Package, FolderTree, DollarSign, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { data: productsData } = useQuery('products', () => productAPI.getAll({}), {
    select: (response) => response.data,
  });

  const { data: categories } = useQuery('categories', () => categoryAPI.getAll(), {
    select: (response) => response.data,
  });

  const totalProducts = productsData?.totalItems || 0;
  const totalCategories = categories?.length || 0;
  const totalValue = productsData?.products?.reduce(
    (sum, p) => sum + parseFloat(p.price) * p.stock,
    0
  ) || 0;
  const lowStock = productsData?.products?.filter((p) => p.stock < 10).length || 0;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <h3>Total Products</h3>
          <div className="stat-value">
            <Package size={32} style={{ marginRight: '10px' }} />
            {totalProducts}
          </div>
        </div>

        <div className="stat-card">
          <h3>Categories</h3>
          <div className="stat-value">
            <FolderTree size={32} style={{ marginRight: '10px' }} />
            {totalCategories}
          </div>
        </div>

        <div className="stat-card">
          <h3>Total Inventory Value</h3>
          <div className="stat-value">
            <DollarSign size={32} style={{ marginRight: '10px' }} />
            ${totalValue.toFixed(2)}
          </div>
        </div>

        <div className="stat-card">
          <h3>Low Stock Items</h3>
          <div className="stat-value">
            <TrendingUp size={32} style={{ marginRight: '10px' }} />
            {lowStock}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Recent Products</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {productsData?.products?.slice(0, 5).map((product) => (
              <tr key={product.id}>
                <td><strong>{product.name}</strong></td>
                <td>{product.sku}</td>
                <td>${product.price}</td>
                <td>
                  <span className={product.stock < 10 ? 'badge badge-danger' : ''}>
                    {product.stock}
                  </span>
                </td>
                <td>{product.category?.name || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
