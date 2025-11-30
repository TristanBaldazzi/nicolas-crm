'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { productsApi, uploadApi } from '@/lib/api';
import { categoriesApi } from '@/lib/api';
import { getImageUrl } from '@/lib/config';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
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
    isBestSeller: false,
    images: [] as any[],
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll({ limit: 1000 }),
        categoriesApi.getAll(),
      ]);
      const productsList = productsRes.data.products || [];
      setAllProducts(productsList);
      setProducts(productsList);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterProducts();
  }, [search, categoryFilter, brandFilter, stockFilter, featuredFilter, allProducts]);

  const filterProducts = () => {
    let filtered = [...allProducts];

    // Recherche textuelle
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.shortDescription?.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.brand?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre catégorie
    if (categoryFilter) {
      filtered = filtered.filter((p) => {
        const catId = p.category?._id || p.category;
        return catId === categoryFilter;
      });
    }

    // Filtre marque
    if (brandFilter) {
      filtered = filtered.filter((p) => p.brand === brandFilter);
    }

    // Filtre stock
    if (stockFilter === 'inStock') {
      filtered = filtered.filter((p) => p.isInStock);
    } else if (stockFilter === 'outOfStock') {
      filtered = filtered.filter((p) => !p.isInStock);
    }

    // Filtre vedette
    if (featuredFilter === 'featured') {
      filtered = filtered.filter((p) => p.isFeatured);
    } else if (featuredFilter === 'notFeatured') {
      filtered = filtered.filter((p) => !p.isFeatured);
    }

    setProducts(filtered);
  };

  const brands = Array.from(new Set(allProducts.map((p) => p.brand).filter(Boolean)));

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
      isBestSeller: false,
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
      isBestSeller: product.isBestSeller || false,
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
            <p className="text-gray-600 mt-1">{allProducts.length} produit{allProducts.length > 1 ? 's' : ''} au total</p>
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-3xl font-black text-gray-900">
              {editingProduct ? 'Modifier' : 'Créer'} un produit
            </h2>
            <p className="text-gray-600 mt-1">Remplissez les informations du produit ci-dessous</p>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Code barre</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">Description courte</label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                rows={2}
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">Description complète</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Prix *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Prix comparé</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Marque</label>
                <div className="relative">
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all appearance-none cursor-pointer bg-white font-medium"
                  >
                    <option value="Autre">Autre</option>
                    <option value="Nematic">Nematic</option>
                    <option value="Prinus">Prinus</option>
                    <option value="Bosch">Bosch</option>
                    <option value="Electro Lux">Electro Lux</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Catégorie *</label>
                <div className="relative">
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value, subCategory: '' });
                    }}
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all appearance-none cursor-pointer bg-white font-medium"
                  >
                    <option value="">Sélectionner...</option>
                    {mainCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {formData.category && (
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Sous-catégorie</label>
                <div className="relative">
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all appearance-none cursor-pointer bg-white font-medium"
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
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block mb-2 font-semibold text-gray-700">Images (max 50)</label>
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImages || formData.images.length >= 50}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    uploadingImages || formData.images.length >= 50
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-300 bg-gray-50 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold text-gray-700">
                    {uploadingImages ? 'Upload en cours...' : formData.images.length >= 50 ? 'Maximum atteint (50 images)' : 'Cliquez pour ajouter des images'}
                  </span>
                </label>
              </div>
              {formData.images.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    {formData.images.length} image{formData.images.length > 1 ? 's' : ''} ajoutée{formData.images.length > 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-5 gap-4">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 group-hover:border-green-500 transition-colors">
                          <img
                            src={getImageUrl(img.url)}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== index);
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-red-600 transition-all hover:scale-110"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {img.isPrimary && (
                          <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded-lg text-xs font-bold">
                            Principale
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Options du produit */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Options du produit</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* En stock */}
                <label className="flex items-center p-4 bg-white rounded-xl border-2 cursor-pointer transition-all hover:border-green-300 hover:bg-green-50"
                  style={{
                    borderColor: formData.isInStock ? '#10b981' : '#e5e7eb',
                    backgroundColor: formData.isInStock ? '#f0fdf4' : 'white'
                  }}>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isInStock}
                      onChange={(e) => setFormData({ ...formData, isInStock: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      formData.isInStock 
                        ? 'bg-green-600 border-green-600' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {formData.isInStock && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-bold text-gray-900">En stock</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">Produit disponible</p>
                  </div>
                </label>

                {/* Produit en vedette */}
                <label className="flex items-center p-4 bg-white rounded-xl border-2 cursor-pointer transition-all hover:border-emerald-300 hover:bg-emerald-50"
                  style={{
                    borderColor: formData.isFeatured ? '#10b981' : '#e5e7eb',
                    backgroundColor: formData.isFeatured ? '#ecfdf5' : 'white'
                  }}>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      formData.isFeatured 
                        ? 'bg-emerald-600 border-emerald-600' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {formData.isFeatured && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-bold text-gray-900">Produit en vedette</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">Mise en avant</p>
                  </div>
                </label>

                {/* Best Seller */}
                <label className="flex items-center p-4 bg-white rounded-xl border-2 cursor-pointer transition-all hover:border-orange-300 hover:bg-orange-50"
                  style={{
                    borderColor: formData.isBestSeller ? '#f97316' : '#e5e7eb',
                    backgroundColor: formData.isBestSeller ? '#fff7ed' : 'white'
                  }}>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isBestSeller}
                      onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      formData.isBestSeller 
                        ? 'bg-orange-600 border-orange-600' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {formData.isBestSeller && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-bold text-gray-900">Best Seller</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">Meilleure vente</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingProduct ? 'Enregistrer les modifications' : 'Créer le produit'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all border-2 border-gray-200"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      {!showForm && allProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, description, SKU, marque..."
                  className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filtre catégorie */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Toutes</option>
                  {mainCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtre marque */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Marque</label>
              <div className="relative">
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Toutes</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtre stock */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
              <div className="relative">
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Tous</option>
                  <option value="inStock">En stock</option>
                  <option value="outOfStock">Rupture</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres supplémentaires */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Vedette:</label>
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all appearance-none cursor-pointer"
              >
                <option value="all">Tous</option>
                <option value="featured">Vedettes uniquement</option>
                <option value="notFeatured">Non vedettes</option>
              </select>
            </div>

            {(search || categoryFilter || brandFilter || stockFilter !== 'all' || featuredFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('');
                  setBrandFilter('');
                  setStockFilter('all');
                  setFeaturedFilter('all');
                }}
                className="text-sm text-gray-600 hover:text-green-600 font-semibold flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Réinitialiser
              </button>
            )}

            <div className="ml-auto text-sm text-gray-600">
              <span className="font-semibold">{products.length}</span> produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
            </div>
          </div>
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
                        src={getImageUrl(primaryImage.url)}
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
                          {product.isBestSeller && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 text-xs font-black rounded whitespace-nowrap border border-orange-300">
                              🔥 Best Seller
                            </span>
                          )}
                          {product.isFeatured && (
                            <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-lg whitespace-nowrap shadow-lg flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Vedette
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



