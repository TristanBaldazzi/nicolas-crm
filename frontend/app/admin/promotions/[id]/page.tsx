'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { promotionsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function PromotionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [promotion, setPromotion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [period, setPeriod] = useState<string>('30d');
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    loadPromotion(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (promotion) {
      // Sauvegarder la position du scroll avant le changement
      scrollPositionRef.current = window.scrollY;
      
      loadPromotion(false).then(() => {
        // Restaurer la position du scroll après le chargement
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: 'auto'
          });
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadPromotion = async (initialLoad = false) => {
    if (initialLoad) {
      setLoading(true);
    } else {
      setLoadingChart(true);
    }
    try {
      const res = await promotionsApi.getById(id, { period });
      setPromotion((prev: any) => ({
        ...prev,
        ...res.data,
        chartData: res.data.chartData,
        stats: res.data.stats
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du chargement');
      if (initialLoad) {
        router.push('/admin/promotions');
      }
    } finally {
      if (initialLoad) {
        setLoading(false);
      } else {
        setLoadingChart(false);
      }
    }
  };

  const getStatusConfig = (promotion: any) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = promotion.endDate ? new Date(promotion.endDate) : null;

    if (!promotion.isActive) {
      return {
        label: 'Inactive',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300'
      };
    }

    if (startDate > now) {
      return {
        label: 'À venir',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300'
      };
    }

    if (endDate && endDate < now) {
      return {
        label: 'Expirée',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-300'
      };
    }

    return {
      label: 'Active',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-300'
    };
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

  if (!promotion) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Promotion non trouvée</p>
          <Link href="/admin/promotions" className="text-green-600 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const statusConfig = getStatusConfig(promotion);
  const startDate = promotion.startDate ? new Date(promotion.startDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : '-';
  const endDate = promotion.endDate ? new Date(promotion.endDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Sans fin';

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              {promotion.name}
            </h1>
            <p className="text-gray-600 mt-2">Détails de la promotion</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin/promotions/${promotion._id}/edit`}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte principale */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{promotion.name}</h2>
                {promotion.description && (
                  <p className="text-gray-600">{promotion.description}</p>
                )}
              </div>
              <span className={`px-4 py-2 rounded-xl text-sm font-bold ${statusConfig.bgColor} ${statusConfig.textColor} border-2 ${statusConfig.borderColor}`}>
                {statusConfig.label}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Réduction</label>
                <div className="text-4xl font-black text-green-600">
                  {promotion.discountPercentage}%
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Entreprise</label>
                <div className="text-lg font-bold text-gray-900">
                  {promotion.company?.name || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Date de début</label>
                <div className="text-lg font-semibold text-gray-900">{startDate}</div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Date de fin</label>
                <div className="text-lg font-semibold text-gray-900">{endDate}</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-600 mb-3">Portée de la promotion</label>
              {promotion.appliesToAllProducts ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-xl border border-green-200">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-green-700">S'applique à tous les produits</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {promotion.productIds && promotion.productIds.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Produits spécifiques</label>
                      <div className="flex flex-wrap gap-2">
                        {promotion.productIds.map((product: any) => (
                          <span key={product._id || product} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                            {product.name || product}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {promotion.categoryIds && promotion.categoryIds.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Catégories spécifiques</label>
                      <div className="flex flex-wrap gap-2">
                        {promotion.categoryIds.map((category: any) => (
                          <span key={category._id || category} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                            {category.name || category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Statistiques */}
          {promotion.stats && (
            <div id="stats-section" className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Statistiques d'utilisation</h3>
                <div className="flex gap-2">
                  {[
                    { value: '24h', label: '24h' },
                    { value: '7d', label: '7j' },
                    { value: '30d', label: '30j' },
                    { value: '365d', label: '365j' }
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPeriod(p.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        period === p.value
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <div className="text-sm font-semibold text-gray-600 mb-2">Utilisations totales</div>
                  <div className="text-3xl font-black text-green-700">{promotion.stats.totalUsage || 0}</div>
                </div>
                <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                  <div className="text-sm font-semibold text-gray-600 mb-2">Réduction totale</div>
                  <div className="text-3xl font-black text-blue-700">{(promotion.stats.totalDiscount || 0).toFixed(2)} €</div>
                </div>
              </div>

              {/* Graphiques */}
              {loadingChart ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600"></div>
                  <p className="mt-4 text-gray-600 text-sm">Chargement des données...</p>
                </div>
              ) : promotion.chartData && promotion.chartData.length > 0 ? (
                <div className="space-y-8">
                  {/* Graphique des utilisations */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Évolution des utilisations</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={promotion.chartData}>
                          <defs>
                            <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="usage" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorUsage)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Graphique des réductions */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Évolution des réductions</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={promotion.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: number) => [`${value.toFixed(2)} €`, 'Réduction']}
                          />
                          <Bar 
                            dataKey="discount" 
                            fill="#3b82f6"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-500 font-semibold">Aucune donnée pour cette période</p>
                </div>
              )}
            </div>
          )}

          {/* Historique d'utilisation */}
          {promotion.usageHistory && promotion.usageHistory.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Utilisations récentes
              </h3>
              <div className="space-y-4">
                {promotion.usageHistory.map((usage: any, index: number) => (
                  <Link
                    key={index}
                    href={`/admin/paniers/${usage.cartId}`}
                    className="block border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {usage.user.firstName?.charAt(0)}{usage.user.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {usage.user.firstName} {usage.user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{usage.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Panier #{usage.cartId.slice(-8)}</span>
                          <span>•</span>
                          <span>{new Date(usage.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600 mb-1">
                          {usage.total.toFixed(2)} €
                        </div>
                        <div className="text-sm text-gray-500">
                          Réduction: {usage.discount.toFixed(2)} €
                        </div>
                        <span className={`inline-block mt-2 px-2 py-1 rounded-lg text-xs font-semibold ${
                          usage.status === 'fini' ? 'bg-green-100 text-green-700' :
                          usage.status === 'traité' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {usage.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(!promotion.usageHistory || promotion.usageHistory.length === 0) && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-semibold">Aucune utilisation enregistrée</p>
              <p className="text-sm text-gray-400 mt-2">Les utilisations seront affichées ici une fois que des clients auront utilisé cette promotion</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations système */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Informations système</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Date de création</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {promotion.createdAt ? new Date(promotion.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Dernière modification</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {promotion.updatedAt ? new Date(promotion.updatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">ID promotion</span>
                <p className="font-mono text-xs text-gray-500 mt-1 break-all">
                  {promotion._id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

