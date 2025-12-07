'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { promotionsApi, companiesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function AdminPromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [allPromotions, setAllPromotions] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [promotionsRes, companiesRes] = await Promise.all([
        promotionsApi.getAll({ limit: 1000 }),
        companiesApi.getAll({ limit: 1000 })
      ]);
      const promotionsList = promotionsRes.data.promotions || [];
      setAllPromotions(promotionsList);
      setPromotions(promotionsList);
      setCompanies(companiesRes.data.companies || []);
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
              <CustomSelect
                options={[
                  { value: '', label: 'Toutes' },
                  ...companies.map((company) => ({
                    value: company._id,
                    label: company.name,
                  })),
                ]}
                value={companyFilter}
                onChange={(value) => setCompanyFilter(value)}
                placeholder="Toutes les entreprises"
                searchable={true}
                className="shadow-sm hover:shadow-md focus-within:shadow-lg"
              />
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
        <Link
          href="/admin/promotions/nouveau"
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          + Nouvelle promotion
        </Link>
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
                  <tr 
                    key={promotion._id} 
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/promotions/${promotion._id}`)}
                  >
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
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/promotions/${promotion._id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Modifier la promotion"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(promotion._id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer la promotion"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
    </AdminLayout>
  );
}

