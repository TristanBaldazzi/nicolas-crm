'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { productsApi, uploadApi } from '@/lib/api';
import { categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    sku: '',
    price: '',
    compareAtPrice: '',
    brand: 'Autre',
    category: '',
    subCategory: '',
    stock: '',
    isInStock: true,
    isFeatured: false,
    images: [] as any[],
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll({ limit: 100 }),
        categoriesApi.getAll(),
      ]);
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files).slice(0, 50 - formData.images.length);
    if (files.length === 0) {
      toast.error('Maximum 50 images autorisées');
      return;
    }

    setUploadingImages(true);
    try {
      const res = await uploadApi.uploadImages(files);
      const newImages = res.data.images.map((img: any, index: number) => ({
        url: img.url,
        alt: '',
        order: formData.images.length + index,
        isPrimary: formData.images.length === 0 && index === 0,
      }));
      setFormData({ ...formData, images: [...formData.images, ...newImages] });
      toast.success(`${newImages.length} image(s) uploadée(s)`);
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        stock: parseInt(formData.stock) || 0,
      };

      if (editingProduct) {
        await productsApi.update(editingProduct._id, data);
        toast.success('Produit modifié');
      } else {
        await productsApi.create(data);
        toast.success('Produit créé');
      }

      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      sku: '',
      price: '',
      compareAtPrice: '',
      brand: 'Autre',
      category: '',
      subCategory: '',
      stock: '',
      isInStock: true,
      isFeatured: false,
      images: [],
    });
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      sku: product.sku || '',
      price: product.price.toString(),
      compareAtPrice: product.compareAtPrice?.toString() || '',
      brand: product.brand || 'Autre',
      category: product.category?._id || product.category || '',
      subCategory: product.subCategory?._id || product.subCategory || '',
      stock: product.stock.toString(),
      isInStock: product.isInStock,
      isFeatured: product.isFeatured,
      images: product.images || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await productsApi.delete(id);
      toast.success('Produit supprimé');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const mainCategories = categories.filter((c) => !c.parentCategory);
  const subCategories = categories.filter((c) => c.parentCategory);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gestion des produits</h1>
            <p className="text-gray-600 mt-1">{products.length} produit{products.length > 1 ? 's' : ''} au total</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProduct(null);
            resetForm();
          }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouveau produit
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {editingProduct ? 'Modifier' : 'Créer'} un produit
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-1">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1">Description courte</label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={2}
              />
            </div>

            <div>
              <label className="block mb-1">Description complète</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block mb-1">Prix *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-1">Prix comparé</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-1">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Marque</label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="Autre">Autre</option>
                  <option value="Nematic">Nematic</option>
                  <option value="Prinus">Prinus</option>
                  <option value="Bosch">Bosch</option>
                  <option value="Electro Lux">Electro Lux</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Catégorie *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value, subCategory: '' });
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Sélectionner...</option>
                  {mainCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.category && (
              <div>
                <label className="block mb-1">Sous-catégorie</label>
                <select
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Aucune</option>
                  {subCategories
                    .filter((c) => c.parentCategory === formData.category || c.parentCategory?._id === formData.category)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block mb-1">Images (max 50)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImages || formData.images.length >= 50}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {formData.images.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={`http://localhost:5000${img.url}`}
                        alt={img.alt}
                        className="w-full aspect-square object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = formData.images.filter((_, i) => i !== index);
                          setFormData({ ...formData, images: newImages });
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isInStock}
                  onChange={(e) => setFormData({ ...formData, isInStock: e.target.checked })}
                  className="mr-2"
                />
                En stock
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="mr-2"
                />
                Produit en vedette
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {editingProduct ? 'Modifier' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {products.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Commencez votre catalogue</h3>
            <p className="text-gray-600 mb-8">
              Vous n'avez pas encore de produits. Créez votre premier produit pour commencer à construire votre catalogue.
            </p>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingProduct(null);
                resetForm();
              }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Créer votre premier produit
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {products.map((product) => {
              const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
              return (
                <div 
                  key={product._id} 
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Miniature image */}
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={`http://localhost:5000${primaryImage.url}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Informations principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/produit/${product.slug}`}
                          className="font-bold text-gray-900 hover:text-green-600 transition-colors block truncate"
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {product.brand && (
                            <span className="text-xs text-gray-500">{product.brand}</span>
                          )}
                          {product.category && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-gray-500 truncate">
                                {product.category.name}
                                {product.subCategory && ` / ${product.subCategory.name}`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Prix */}
                        <div className="text-right">
                          <p className="font-bold text-green-600">{product.price.toFixed(2)} €</p>
                          {product.compareAtPrice && (
                            <p className="text-xs text-gray-400 line-through">{product.compareAtPrice.toFixed(2)} €</p>
                          )}
                        </div>
                        {/* Stock */}
                        <div className="text-right w-16">
                          <p className="text-xs text-gray-500">Stock</p>
                          <p className={`font-semibold ${product.isInStock ? 'text-green-600' : 'text-red-600'}`}>
                            {product.stock}
                          </p>
                        </div>
                        {/* Badges */}
                        <div className="flex flex-col gap-1">
                          {product.isFeatured && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded whitespace-nowrap">
                              ⭐
                            </span>
                          )}
                          {!product.isInStock && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded whitespace-nowrap">
                              Rupture
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

