'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { cartsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCartsPage() {
  const router = useRouter();
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadCarts();
  }, [statusFilter, search, sortBy, sortOrder, page]);

  const loadCarts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        sortBy,
        sortOrder
      };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      
      const res = await cartsApi.getAll(params);
      setCarts(res.data.carts || []);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (cartId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChangingStatus(cartId);
    try {
      await cartsApi.updateStatus(cartId, newStatus);
      toast.success('Statut modifié avec succès');
      loadCarts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setChangingStatus(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'en_cours':
        return {
          label: 'En cours',
          color: 'gray',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300',
          dotColor: 'bg-gray-500'
        };
      case 'demande':
        return {
          label: 'Demande',
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-300',
          dotColor: 'bg-yellow-500'
        };
      case 'traité':
        return {
          label: 'Traité',
          color: 'blue',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-300',
          dotColor: 'bg-blue-500'
        };
      case 'fini':
        return {
          label: 'Fini',
          color: 'green',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-300',
          dotColor: 'bg-green-500'
        };
      case 'annulé':
        return {
          label: 'Annulé',
          color: 'red',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-300',
          dotColor: 'bg-red-500'
        };
      default:
        return {
          label: status,
          color: 'gray',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300',
          dotColor: 'bg-gray-500'
        };
    }
  };

  const handleCartClick = (cartId: string) => {
    router.push(`/admin/paniers/${cartId}`);
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestion des paniers</h1>
        <p className="text-gray-600">Gérez tous les paniers de commande</p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="md:col-span-2">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher par client, email, notes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md hover:border-green-300"
              />
            </div>
          </div>

          {/* Filtre statut */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold appearance-none cursor-pointer hover:border-green-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <option value="">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="demande">Demande</option>
              <option value="traité">Traité</option>
              <option value="fini">Fini</option>
              <option value="annulé">Annulé</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Tri */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
                setPage(1);
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold appearance-none cursor-pointer hover:border-green-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <option value="createdAt-desc">Plus récent</option>
              <option value="createdAt-asc">Plus ancien</option>
              <option value="total-desc">Montant décroissant</option>
              <option value="total-asc">Montant croissant</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des paniers */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      ) : carts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun panier trouvé</h3>
          <p className="text-gray-600">
            {search || statusFilter 
              ? 'Essayez de modifier vos filtres de recherche' 
              : 'Aucun panier pour le moment'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Articles</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {carts.map((cart) => {
                  const statusConfig = getStatusConfig(cart.status);
                  return (
                    <tr
                      key={cart._id}
                      onClick={() => handleCartClick(cart._id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-600">#{cart._id.slice(-8)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {cart.user ? (
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {cart.user.firstName} {cart.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{cart.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Utilisateur supprimé</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{cart.items.length} article{cart.items.length > 1 ? 's' : ''}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-green-600">{cart.total.toFixed(2)} €</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={cart.status}
                            onChange={(e) => handleStatusChange(cart._id, e.target.value, e)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={changingStatus === cart._id}
                            className={`text-xs font-bold px-4 py-2 pr-8 rounded-xl border-2 ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} cursor-pointer hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 appearance-none min-w-[120px]`}
                          >
                            <option value="en_cours">En cours</option>
                            <option value="demande">Demande</option>
                            <option value="traité">Traité</option>
                            <option value="fini">Fini</option>
                            <option value="annulé">Annulé</option>
                          </select>
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className={`w-4 h-4 ${statusConfig.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {new Date(cart.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCartClick(cart._id);
                          }}
                          className="text-green-600 hover:text-green-900 font-semibold"
                        >
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
              <div className="text-sm text-gray-700">
                Affichage de <span className="font-semibold">{(page - 1) * 10 + 1}</span> à{' '}
                <span className="font-semibold">{Math.min(page * 10, pagination.total)}</span> sur{' '}
                <span className="font-semibold">{pagination.total}</span> paniers
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-4 py-2 border rounded-lg text-sm font-semibold ${
                        page === pageNum
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
