'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { promotionsApi, companiesApi, productsApi, categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [allPromotions, setAllPromotions] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
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
      const [promotionsRes, companiesRes, productsRes, categoriesRes] = await Promise.all([
        promotionsApi.getAll({ limit: 1000 }),
        companiesApi.getAll({ limit: 1000 }),
        productsApi.getAll({ limit: 1000 }),
        categoriesApi.getAll()
      ]);
      const promotionsList = promotionsRes.data.promotions || [];
      setAllPromotions(promotionsList);
      setPromotions(promotionsList);
      setCompanies(companiesRes.data.companies || []);
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterPromotions();
  }, [search, companyFilter, statusFilter, allPromotions]);

  const filterPromotions = () => {
    let filtered = [...allPromotions];

    // Recherche textuelle
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.company?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre entreprise
    if (companyFilter) {
      filtered = filtered.filter((p) => {
        const companyId = p.company?._id || p.company;
        return companyId === companyFilter;
      });
    }

    // Filtre statut
    const now = new Date();
    if (statusFilter === 'active') {
      filtered = filtered.filter((p) => {
        if (!p.isActive) return false;
        const startDate = new Date(p.startDate);
        const endDate = p.endDate ? new Date(p.endDate) : null;
        return startDate <= now && (!endDate || endDate >= now);
      });
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((p) => !p.isActive);
    } else if (statusFilter === 'expired') {
      filtered = filtered.filter((p) => {
        if (!p.endDate) return false;
        return new Date(p.endDate) < now;
      });
    } else if (statusFilter === 'upcoming') {
      filtered = filtered.filter((p) => {
        return new Date(p.startDate) > now;
      });
    }

    setPromotions(filtered);
  };

  const handleOpenModal = (promotion?: any) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        company: promotion.company?._id || promotion.company || '',
        name: promotion.name || '',
        description: promotion.description || '',
        discountPercentage: promotion.discountPercentage || 0,
        startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
        isActive: promotion.isActive !== undefined ? promotion.isActive : true,
        appliesToAllProducts: promotion.appliesToAllProducts !== undefined ? promotion.appliesToAllProducts : true,
        productIds: promotion.productIds?.map((p: any) => p._id || p) || [],
        categoryIds: promotion.categoryIds?.map((c: any) => c._id || c) || []
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        company: '',
        name: '',
        description: '',
        discountPercentage: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true,
        appliesToAllProducts: true,
        productIds: [],
        categoryIds: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPromotion(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        endDate: formData.endDate || null,
        productIds: formData.appliesToAllProducts ? [] : formData.productIds,
        categoryIds: formData.appliesToAllProducts ? [] : formData.categoryIds
      };
      if (editingPromotion) {
        await promotionsApi.update(editingPromotion._id, data);
        toast.success('Promotion mise à jour');
      } else {
        await promotionsApi.create(data);
        toast.success('Promotion créée');
      }
      handleCloseModal();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
      return;
    }
    try {
      await promotionsApi.delete(id);
      toast.success('Promotion supprimée');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  return (
    <AdminLayout>
      {/* Barre de recherche et filtres */}
      {allPromotions.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, description, entreprise..."
                  className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filtre entreprise */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Entreprise</label>
              <div className="relative">
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Toutes</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
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

            {/* Filtre statut */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Toutes</option>
                  <option value="active">Actives</option>
                  <option value="inactive">Inactives</option>
                  <option value="expired">Expirées</option>
                  <option value="upcoming">À venir</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            {(search || companyFilter || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setCompanyFilter('');
                  setStatusFilter('all');
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
              <span className="font-semibold">{promotions.length}</span> promotion{promotions.length > 1 ? 's' : ''} trouvée{promotions.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des promotions</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          + Nouvelle promotion
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Nom</th>
              <th className="px-6 py-3 text-left">Entreprise</th>
              <th className="px-6 py-3 text-left">Réduction</th>
              <th className="px-6 py-3 text-left">Période</th>
              <th className="px-6 py-3 text-left">Statut</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Aucune promotion
                </td>
              </tr>
            ) : (
              promotions.map((promotion) => {
                const startDate = promotion.startDate ? new Date(promotion.startDate).toLocaleDateString('fr-FR') : '-';
                const endDate = promotion.endDate ? new Date(promotion.endDate).toLocaleDateString('fr-FR') : 'Sans fin';
                return (
                  <tr key={promotion._id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold">{promotion.name}</td>
                    <td className="px-6 py-4">{promotion.company?.name || '-'}</td>
                    <td className="px-6 py-4 font-bold text-green-600">{promotion.discountPercentage}%</td>
                    <td className="px-6 py-4 text-sm">
                      {startDate} - {endDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        promotion.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {promotion.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(promotion)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(promotion._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingPromotion ? 'Modifier la promotion' : 'Nouvelle promotion'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Entreprise *</label>
                <select
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Sélectionner une entreprise</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Pourcentage de réduction *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Date de début *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.appliesToAllProducts}
                    onChange={(e) => setFormData({ ...formData, appliesToAllProducts: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-semibold">S'applique à tous les produits</span>
                </label>
              </div>
              {!formData.appliesToAllProducts && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Produits spécifiques</label>
                    <select
                      multiple
                      value={formData.productIds}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setFormData({ ...formData, productIds: selected });
                      }}
                      className="w-full px-3 py-2 border rounded-lg h-32"
                    >
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Maintenez Ctrl/Cmd pour sélectionner plusieurs produits</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Catégories spécifiques</label>
                    <select
                      multiple
                      value={formData.categoryIds}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setFormData({ ...formData, categoryIds: selected });
                      }}
                      className="w-full px-3 py-2 border rounded-lg h-32"
                    >
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Maintenez Ctrl/Cmd pour sélectionner plusieurs catégories</p>
                  </div>
                </>
              )}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-semibold">Active</span>
                </label>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingPromotion ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

