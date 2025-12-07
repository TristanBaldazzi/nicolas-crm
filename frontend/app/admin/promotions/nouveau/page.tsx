'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { promotionsApi, companiesApi, productsApi, categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function NewPromotionPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    description: '',
    discountPercentage: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
    appliesToAllProducts: true,
    productIds: [] as string[],
    categoryIds: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [companiesRes, productsRes, categoriesRes] = await Promise.all([
        companiesApi.getAll({ limit: 1000 }),
        productsApi.getAll({ limit: 1000 }),
        categoriesApi.getAll()
      ]);
      setCompanies(companiesRes.data.companies || []);
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...formData,
        endDate: formData.endDate || null,
        productIds: formData.appliesToAllProducts ? [] : formData.productIds,
        categoryIds: formData.appliesToAllProducts ? [] : formData.categoryIds
      };
      await promotionsApi.create(data);
      toast.success('Promotion créée avec succès');
      router.push('/admin/promotions');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/promotions"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la liste des promotions
        </Link>
        <h1 className="text-4xl font-black text-gray-900">Nouvelle promotion</h1>
        <p className="text-gray-600 mt-2">Créer une nouvelle promotion</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Entreprise *</label>
            <CustomSelect
              options={[
                { value: '', label: 'Sélectionner une entreprise' },
                ...companies.map((company) => ({
                  value: company._id,
                  label: company.name,
                })),
              ]}
              value={formData.company}
              onChange={(value) => setFormData({ ...formData, company: value })}
              placeholder="Sélectionner une entreprise"
              searchable={true}
              className="shadow-sm hover:shadow-md focus-within:shadow-lg"
            />
          </div>

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
            <label className="block mb-2 font-semibold text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
              rows={3}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">Pourcentage de réduction *</label>
            <input
              type="number"
              required
              min="0"
              max="100"
              value={formData.discountPercentage}
              onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Date de début *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Date de fin</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.appliesToAllProducts}
                onChange={(e) => setFormData({ ...formData, appliesToAllProducts: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="font-semibold text-gray-900">S'applique à tous les produits</span>
            </label>
          </div>

          {!formData.appliesToAllProducts && (
            <>
              <div>
                <label className="block mb-3 font-semibold text-gray-700">
                  Produits spécifiques
                  {formData.productIds.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-green-600">
                      ({formData.productIds.length} sélectionné{formData.productIds.length > 1 ? 's' : ''})
                    </span>
                  )}
                </label>
                {formData.productIds.length > 0 && (
                  <div className="mb-3 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="flex flex-wrap gap-2">
                      {formData.productIds.map((productId) => {
                        const product = products.find(p => p._id === productId);
                        if (!product) return null;
                        return (
                          <span
                            key={productId}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold border border-green-300"
                          >
                            {product.name}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  productIds: formData.productIds.filter(id => id !== productId)
                                });
                              }}
                              className="hover:text-green-900 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <select
                  multiple
                  value={formData.productIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, productIds: selected });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all h-40"
                >
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">Maintenez Ctrl/Cmd pour sélectionner plusieurs produits</p>
              </div>
              <div>
                <label className="block mb-3 font-semibold text-gray-700">
                  Catégories spécifiques
                  {formData.categoryIds.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-blue-600">
                      ({formData.categoryIds.length} sélectionnée{formData.categoryIds.length > 1 ? 's' : ''})
                    </span>
                  )}
                </label>
                {formData.categoryIds.length > 0 && (
                  <div className="mb-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="flex flex-wrap gap-2">
                      {formData.categoryIds.map((categoryId) => {
                        const category = categories.find(c => c._id === categoryId);
                        if (!category) return null;
                        return (
                          <span
                            key={categoryId}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold border border-blue-300"
                          >
                            {category.name}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  categoryIds: formData.categoryIds.filter(id => id !== categoryId)
                                });
                              }}
                              className="hover:text-blue-900 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <select
                  multiple
                  value={formData.categoryIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, categoryIds: selected });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all h-40"
                >
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">Maintenez Ctrl/Cmd pour sélectionner plusieurs catégories</p>
              </div>
            </>
          )}

          <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="font-semibold text-gray-900">Active</span>
            </label>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Création...' : 'Créer la promotion'}
            </button>
            <Link
              href="/admin/promotions"
              className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

