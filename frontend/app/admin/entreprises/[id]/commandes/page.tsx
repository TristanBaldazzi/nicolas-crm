'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import CustomSelect from '@/components/CustomSelect';
import { companiesApi, cartsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CompanyOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [company, setCompany] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [companyRes] = await Promise.all([
        companiesApi.getById(id),
      ]);
      setCompany(companyRes.data);
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du chargement');
      router.push('/admin/entreprises');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await cartsApi.getCompanyOrders(id);
      setOrders(res.data.carts || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'traité':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'en_cours':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'annulé':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'demande':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'traité':
        return 'Traité';
      case 'en_cours':
        return 'En cours';
      case 'annulé':
        return 'Annulée';
      case 'demande':
      default:
        return 'En attente';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrer les commandes
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filtre par statut
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order => {
        // Recherche dans le numéro de commande
        const orderId = order._id.slice(-8).toUpperCase();
        if (orderId.toLowerCase().includes(query)) return true;

        // Recherche dans le nom de l'utilisateur
        if (order.user) {
          const userName = `${order.user.firstName} ${order.user.lastName}`.toLowerCase();
          if (userName.includes(query)) return true;

          // Recherche dans l'email
          if (order.user.email?.toLowerCase().includes(query)) return true;
        }

        // Recherche dans les noms de produits
        if (order.items) {
          const productNames = order.items
            .map((item: any) => item.product?.name?.toLowerCase() || '')
            .join(' ');
          if (productNames.includes(query)) return true;
        }

        // Recherche dans les notes
        if (order.notes?.toLowerCase().includes(query)) return true;

        return false;
      });
    }

    return filtered;
  }, [orders, statusFilter, searchQuery]);

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

  if (!company) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Entreprise non trouvée</p>
          <Link href="/admin/entreprises" className="text-green-600 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            href={`/admin/entreprises/${id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l'entreprise
          </Link>
        </div>
        <h1 className="text-4xl font-black text-gray-900">
          Commandes de {company.name}
        </h1>
        <p className="text-gray-600 mt-2">Toutes les commandes de l'entreprise</p>
      </div>

      {/* Commandes */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {loadingOrders ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            <p className="mt-4 text-gray-600">Chargement des commandes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Aucune commande pour cette entreprise</p>
          </div>
        ) : (
          <>
            {/* Filtres et recherche */}
            <div className="mb-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Recherche */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher par numéro, nom, email, produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                </div>

                {/* Filtre par statut */}
                <div>
                  <CustomSelect
                    options={[
                      { value: '', label: 'Tous les statuts' },
                      { value: 'en_cours', label: 'En cours' },
                      { value: 'demande', label: 'En attente' },
                      { value: 'traité', label: 'Traité' },
                      { value: 'annulé', label: 'Annulée' },
                    ]}
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value)}
                    placeholder="Filtrer par statut"
                    searchable={false}
                    className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                  />
                </div>
              </div>

              {/* Compteur et réinitialisation */}
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900">{filteredOrders.length}</span> commande(s) 
                  {filteredOrders.length !== orders.length && (
                    <span className="text-gray-500"> sur {orders.length}</span>
                  )}
                </p>
                {(statusFilter || searchQuery) && (
                  <button
                    onClick={() => {
                      setStatusFilter('');
                      setSearchQuery('');
                    }}
                    className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            </div>

            {/* Liste des commandes */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Aucune commande ne correspond aux critères de recherche</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order._id}
                    className="border-2 border-gray-100 rounded-xl p-6 hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-900">
                            Commande #{order._id.slice(-8).toUpperCase()}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.user && (
                            <>
                              Par {order.user.firstName} {order.user.lastName} ({order.user.email})
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-gray-900">
                          {order.total?.toFixed(2) || '0.00'} €
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.items?.length || 0} article(s)
                        </p>
                      </div>
                    </div>
                    
                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Articles</h4>
                        <div className="space-y-2">
                          {order.items.map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <span className="text-gray-900 font-medium">
                                  {item.product?.name || 'Produit supprimé'}
                                </span>
                                <span className="text-gray-500 ml-2">
                                  × {item.quantity}
                                </span>
                              </div>
                              <span className="text-gray-700 font-semibold">
                                {(item.price * item.quantity).toFixed(2)} €
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-900">Total</span>
                          <span className="text-lg font-bold text-gray-900">
                            {order.total?.toFixed(2) || '0.00'} €
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {order.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Notes:</span> {order.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

