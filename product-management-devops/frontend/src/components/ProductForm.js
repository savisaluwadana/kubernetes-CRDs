import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { productAPI } from '../services/api';
import { X } from 'lucide-react';

const ProductForm = ({ product, onClose, categories }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: product || {
      name: '',
      description: '',
      price: '',
      stock: '',
      sku: '',
      imageUrl: '',
      categoryId: '',
      isActive: true,
    },
  });

  const mutation = useMutation(
    (data) => product ? productAPI.update(product.id, data) : productAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        alert(product ? 'Product updated successfully!' : 'Product created successfully!');
        onClose();
      },
      onError: (error) => {
        alert('Error: ' + (error.response?.data?.error || error.message));
      },
    }
  );

  const onSubmit = (data) => {
    mutation.mutate({
      ...data,
      price: parseFloat(data.price),
      stock: parseInt(data.stock),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Create Product'}</h2>
          <button className="btn btn-secondary" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Product Name *</label>
            <input
              {...register('name', { required: 'Name is required', minLength: 3 })}
              placeholder="Enter product name"
            />
            {errors.name && <span className="error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              {...register('description')}
              rows="3"
              placeholder="Enter product description"
            />
          </div>

          <div className="form-group">
            <label>Price *</label>
            <input
              type="number"
              step="0.01"
              {...register('price', { required: 'Price is required', min: 0 })}
              placeholder="0.00"
            />
            {errors.price && <span className="error">{errors.price.message}</span>}
          </div>

          <div className="form-group">
            <label>Stock *</label>
            <input
              type="number"
              {...register('stock', { required: 'Stock is required', min: 0 })}
              placeholder="0"
            />
            {errors.stock && <span className="error">{errors.stock.message}</span>}
          </div>

          <div className="form-group">
            <label>SKU *</label>
            <input
              {...register('sku', { required: 'SKU is required' })}
              placeholder="Enter SKU"
            />
            {errors.sku && <span className="error">{errors.sku.message}</span>}
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              {...register('imageUrl')}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select {...register('categoryId')}>
              <option value="">Select a category</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <input type="checkbox" {...register('isActive')} /> Active
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {product ? 'Update' : 'Create'} Product
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
