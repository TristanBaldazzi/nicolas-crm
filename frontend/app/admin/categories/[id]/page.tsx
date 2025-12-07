'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { categoriesApi, productsApi } from '@/lib/api';
import { getImageUrl } from '@/lib/config';
import toast from 'react-hot-toast';
import Link from 'next/link';
import CustomSelect from '@/components/CustomSelect';

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [category, setCategory] = useState<any>(null);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategory: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      // Charger toutes les catégories pour avoir les infos complètes
      const [categoriesRes, productsRes] = await Promise.all([
        categoriesApi.getAll(),
        productsApi.getAll({ category: id, limit: 100 })
      ]);
      
      const allCategories = categoriesRes.data || [];
      const foundCategory = allCategories.find((c: any) => c._id === id);
      
      if (!foundCategory) {
        toast.error('Catégorie non trouvée');
        router.push('/admin/categories');
        return;
      }

      setCategory(foundCategory);
      
      // Trouver les sous-catégories
      const subs = allCategories.filter((c: any) => 
        (c.parentCategory?._id || c.parentCategory) === id
      );
      setSubCategories(subs);
      
      // Trouver les produits
      setProducts(productsRes.data.products || []);
      
      // Trouver les catégories principales pour le select
      const mainCats = allCategories.filter((c: any) => !c.parentCategory && c._id !== id);
      setMainCategories(mainCats);

      setFormData({
        name: foundCategory.name || '',
        description: foundCategory.description || '',
        parentCategory: foundCategory.parentCategory?._id || foundCategory.parentCategory || '',
        order: foundCategory.order || 0,
        isActive: foundCategory.isActive !== undefined ? foundCategory.isActive : true
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du chargement');
      router.push('/admin/categories');
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
        parentCategory: formData.parentCategory || null,
        order: parseInt(formData.order.toString()) || 0,
      };

      await categoriesApi.update(id, data);
      toast.success('Catégorie modifiée avec succès');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
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

  if (!category) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Catégorie non trouvée</p>
          <Link href="/admin/categories" className="text-green-600 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const isMain = !category.parentCategory;
  const parent = category.parentCategory;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/categories"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la liste des catégories
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              {category.name}
            </h1>
            <p className="text-gray-600 mt-2">Détails et modification de la catégorie</p>
          </div>
          <div className={`px-4 py-2 rounded-xl border-2 flex items-center gap-2 ${
            isMain
              ? 'bg-green-50 border-green-300'
              : 'bg-blue-50 border-blue-300'
          }`}>
            <span className={`font-bold ${
              isMain ? 'text-green-700' : 'text-blue-700'
            }`}>
              {isMain ? 'Catégorie principale' : 'Sous-catégorie'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulaire d'édition */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Modifier la catégorie</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Catégorie parente
                  </label>
                  <CustomSelect
                    options={[
                      { value: '', label: 'Aucune (catégorie principale)' },
                      ...mainCategories.map((cat) => ({
                        value: cat._id,
                        label: cat.name
                      }))
                    ]}
                    value={formData.parentCategory}
                    onChange={(value) => setFormData({ ...formData, parentCategory: value })}
                    placeholder="Sélectionner une catégorie parente..."
                    searchable={true}
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-6 h-6 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer transition-all"
                    />
                    {formData.isActive && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-base font-bold text-gray-900 block">Catégorie active</span>
                    <span className="text-xs text-gray-600 mt-0.5">
                      {formData.isActive ? 'La catégorie est actuellement active' : 'La catégorie est actuellement inactive'}
                    </span>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    formData.isActive
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </div>
                </label>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>

          {/* Sous-catégories */}
          {isMain && subCategories.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sous-catégories</h2>
              <div className="space-y-3">
                {subCategories.map((sub) => (
                  <Link
                    key={sub._id}
                    href={`/admin/categories/${sub._id}`}
                    className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{sub.name}</p>
                        {sub.description && (
                          <p className="text-sm text-gray-600 line-clamp-1">{sub.description}</p>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Produits */}
          {products.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Produits dans cette catégorie</h2>
              <div className="space-y-3">
                {products.map((product) => (
                  <Link
                    key={product._id}
                    href={`/admin/produits`}
                    className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {product.images?.[0] && (
                        <img
                          src={getImageUrl(product.images[0].url)}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <p className="font-bold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.brand}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{product.price.toFixed(2)} €</p>
                      <p className="text-xs text-gray-500">{product.stock || 0} en stock</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Carte catégorie */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="text-center mb-6">
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${
                isMain
                  ? 'bg-gradient-to-br from-green-500 to-green-600'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}>
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {category.name}
              </h3>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Type</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isMain
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {isMain ? 'Principale' : 'Sous-catégorie'}
                </span>
              </div>
              {parent && (
                <div>
                  <span className="text-gray-600 text-sm">Catégorie parente</span>
                  <Link
                    href={`/admin/categories/${parent._id || parent}`}
                    className="block font-semibold text-gray-900 mt-1 hover:text-green-600 transition-colors"
                  >
                    {parent.name}
                  </Link>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Ordre</span>
                <span className="font-bold text-gray-900">#{category.order || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Statut</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  category.isActive !== false
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {category.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              {isMain && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sous-catégories</span>
                  <span className="font-bold text-gray-900">{subCategories.length}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Produits</span>
                <span className="font-bold text-gray-900">{products.length}</span>
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Informations système</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Date de création</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {category.createdAt ? new Date(category.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Dernière modification</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {category.updatedAt ? new Date(category.updatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Slug</span>
                <p className="font-mono text-xs text-gray-500 mt-1 break-all">{category.slug}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

