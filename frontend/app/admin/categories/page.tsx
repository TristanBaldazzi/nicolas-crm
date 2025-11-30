'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategory: '',
    order: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        parentCategory: formData.parentCategory || null,
        order: parseInt(formData.order.toString()) || 0,
      };

      if (editingCategory) {
        await categoriesApi.update(editingCategory._id, data);
        toast.success('Catégorie modifiée');
      } else {
        await categoriesApi.create(data);
        toast.success('Catégorie créée');
      }

      setShowModal(false);
      setEditingCategory(null);
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
      parentCategory: '',
      order: 0,
    });
  };

  const handleEdit = (category: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentCategory: category.parentCategory?._id || category.parentCategory || '',
      order: category.order || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await categoriesApi.delete(id);
      toast.success('Catégorie supprimée');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const mainCategories = categories.filter((c) => !c.parentCategory);
  const subCategories = categories.filter((c) => c.parentCategory);

  // Grouper les sous-catégories par parent
  const subCategoriesByParent = subCategories.reduce((acc: any, sub: any) => {
    const parentId = sub.parentCategory?._id || sub.parentCategory;
    if (!acc[parentId]) {
      acc[parentId] = [];
    }
    acc[parentId].push(sub);
    return acc;
  }, {});

  const toggleExpand = (categoryId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Organiser les catégories de manière hiérarchique
  const getHierarchicalCategories = () => {
    let result: any[] = [];
    const currentFilter = typeFilter;
    
    // Si on filtre uniquement les sous-catégories et qu'il y a une recherche
    if (currentFilter === 'sub' && search) {
      const filteredSubs = subCategories.filter((sub: any) => {
        const matchesSearch = 
          sub.name.toLowerCase().includes(search.toLowerCase()) ||
          (sub.description && sub.description.toLowerCase().includes(search.toLowerCase()));
        return matchesSearch;
      });
      return filteredSubs.map((sub: any) => ({ ...sub, isSubCategory: true }));
    }
    
    mainCategories
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(mainCat => {
        // Filtrer selon la recherche
        const matchesSearch = !search || 
          mainCat.name.toLowerCase().includes(search.toLowerCase()) ||
          (mainCat.description && mainCat.description.toLowerCase().includes(search.toLowerCase()));
        
        const matchesType = currentFilter === 'all' || currentFilter === 'main';
        
        if (matchesSearch && matchesType) {
          result.push(mainCat);
          
          // Ajouter les sous-catégories si elles correspondent
          const subs = subCategoriesByParent[mainCat._id] || [];
          subs
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            .forEach((sub: any) => {
              const subMatchesSearch = !search || 
                sub.name.toLowerCase().includes(search.toLowerCase()) ||
                (sub.description && sub.description.toLowerCase().includes(search.toLowerCase()));
              
              const subMatchesType = currentFilter !== 'main';
              
              // Afficher la sous-catégorie si :
              // - Pas de recherche OU recherche correspond
              // - Type correspond
              // - Catégorie parente est expandée OU recherche active (pour voir les résultats)
              if (subMatchesSearch && subMatchesType && (expandedCategories.has(mainCat._id) || search)) {
                result.push({ ...sub, isSubCategory: true, parentId: mainCat._id });
              }
            });
        }
      });
    
    return result;
  };

  const hierarchicalCategories = getHierarchicalCategories();

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/admin/categories/${categoryId}`);
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestion des catégories</h1>
            <p className="text-gray-600">Organisez vos produits par catégories</p>
          </div>
          <button
            onClick={() => {
              setShowModal(true);
              setEditingCategory(null);
              resetForm();
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouvelle catégorie
          </button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="md:col-span-2">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher par nom, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md hover:border-green-300"
              />
            </div>
          </div>

          {/* Filtre type */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => {
                const newFilter = e.target.value;
                setTypeFilter(newFilter);
                // Expand toutes les catégories si on filtre par sous-catégories
                if (newFilter === 'sub') {
                  setExpandedCategories(new Set(mainCategories.map(c => c._id)));
                }
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold appearance-none cursor-pointer hover:border-green-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <option value="all">Tous les types</option>
              <option value="main">Catégories principales</option>
              <option value="sub">Sous-catégories</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des catégories */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      ) : hierarchicalCategories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune catégorie trouvée</h3>
          <p className="text-gray-600 mb-6">
            {search || typeFilter !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Créez votre première catégorie pour organiser vos produits'}
          </p>
          {!search && typeFilter === 'all' && (
            <button
              onClick={() => {
                setShowModal(true);
                setEditingCategory(null);
                resetForm();
              }}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Créer une catégorie
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ordre</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hierarchicalCategories.map((category) => {
                const isMain = !category.isSubCategory && !category.parentCategory;
                const isSub = category.isSubCategory;
                const hasSubs = subCategoriesByParent[category._id]?.length > 0;
                const isExpanded = expandedCategories.has(category._id);
                
                return (
                  <tr
                    key={category._id}
                    onClick={() => handleCategoryClick(category._id)}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSub ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3" style={{ paddingLeft: isSub ? '2rem' : '0' }}>
                        {isMain && hasSubs && (
                          <button
                            onClick={(e) => toggleExpand(category._id, e)}
                            className="flex-shrink-0 w-6 h-6 rounded hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <svg 
                              className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                        {!isMain && !hasSubs && <div className="w-6"></div>}
                        {isSub && (
                          <div className="flex-shrink-0 w-6 flex items-center justify-center">
                            <div className="w-4 h-4 border-l-2 border-b-2 border-gray-300"></div>
                          </div>
                        )}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isMain 
                            ? 'bg-gradient-to-br from-green-500 to-green-600' 
                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                        }`}>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div>
                          <span className={`text-sm font-bold ${isMain ? 'text-gray-900' : 'text-gray-700'}`}>
                            {category.name}
                          </span>
                          {isSub && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                              Sous-catégorie
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 line-clamp-1">
                        {category.description || <span className="text-gray-400 italic">Aucune description</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-700">#{category.order || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleEdit(category, e)}
                          className="text-blue-600 hover:text-blue-900 font-semibold px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={(e) => handleDelete(category._id, e)}
                          className="text-red-600 hover:text-red-900 font-semibold px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">Catégorie parente</label>
                  <div className="relative">
                    <select
                      value={formData.parentCategory}
                      onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                      className="w-full px-4 py-2.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Aucune (catégorie principale)</option>
                      {mainCategories
                        .filter((c) => !editingCategory || c._id !== editingCategory._id)
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
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">Ordre d'affichage</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
                >
                  {editingCategory ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
