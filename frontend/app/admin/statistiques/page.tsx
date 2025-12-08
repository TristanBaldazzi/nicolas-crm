'use client';

import AdminLayout from '@/components/AdminLayout';
import CustomSelect from '@/components/CustomSelect';
import { analyticsApi } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getImageUrl } from '@/lib/config';

export default function ProductStatisticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin } = useAuthStore();
  const [productStats, setProductStats] = useState<any[]>([]);
  const [productStatsLoading, setProductStatsLoading] = useState(false);
  const [productPeriod, setProductPeriod] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [productSortBy, setProductSortBy] = useState<'views' | 'sales' | 'revenue' | 'cartAdds' | 'favorites' | 'conversionRate'>('views');

  // Initialiser depuis les query params
  useEffect(() => {
    const periodParam = searchParams.get('period');
    const sortByParam = searchParams.get('sortBy');
    if (periodParam && ['today', '7d', '30d', 'all'].includes(periodParam)) {
      setProductPeriod(periodParam as any);
    }
    if (sortByParam && ['views', 'sales', 'revenue', 'cartAdds', 'favorites', 'conversionRate'].includes(sortByParam)) {
      setProductSortBy(sortByParam as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user || !isAdmin()) {
      return;
    }
    loadProductStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, productPeriod, productSortBy]);

  const loadProductStats = async () => {
    try {
      setProductStatsLoading(true);
      const res = await analyticsApi.getAllProductsStats({ 
        period: productPeriod,
        sortBy: productSortBy,
        limit: 1000 // Limite élevée pour afficher tous les produits
      });
      setProductStats(res.data || []);
    } catch (error: any) {
      console.error('Error loading product stats:', error);
      setProductStats([]);
    } finally {
      setProductStatsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 font-semibold text-sm transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au dashboard
        </Link>
        <h1 className="text-3xl font-bold">Statistiques des produits</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tous les produits</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {productPeriod === 'today' ? "Aujourd'hui" :
                 productPeriod === '7d' ? '7 derniers jours' :
                 productPeriod === '30d' ? '30 derniers jours' :
                 'Toutes périodes'}
              </p>
            </div>
          </div>
          
          {/* Filtres de période et tri */}
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setProductPeriod('today')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  productPeriod === 'today' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setProductPeriod('7d')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  productPeriod === '7d' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                7j
              </button>
              <button
                onClick={() => setProductPeriod('30d')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  productPeriod === '30d' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                30j
              </button>
              <button
                onClick={() => setProductPeriod('all')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  productPeriod === 'all' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Tout
              </button>
            </div>
            
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-sm text-gray-600 font-semibold whitespace-nowrap">Trier par:</span>
              <div className="w-64">
                <CustomSelect
                  options={[
                    { value: 'views', label: 'Plus vus' },
                    { value: 'sales', label: 'Plus vendus' },
                    { value: 'revenue', label: 'Plus de revenus' },
                    { value: 'cartAdds', label: 'Plus ajoutés au panier' },
                    { value: 'favorites', label: 'Plus favoris' },
                    { value: 'conversionRate', label: 'Taux de conversion' },
                  ]}
                  value={productSortBy}
                  onChange={(value) => setProductSortBy(value as any)}
                  placeholder="Trier par..."
                  searchable={false}
                />
              </div>
            </div>
          </div>
        </div>
        
        {productStatsLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-600 mb-4"></div>
            <p className="text-gray-500 font-semibold">Chargement des statistiques...</p>
          </div>
        ) : productStats.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-700 text-xl font-bold mb-2">Aucune statistique disponible</p>
            <p className="text-gray-500 text-sm">Les statistiques des produits apparaîtront ici</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Produit</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Vues</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Ventes</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Revenus</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Panier</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Favoris</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productStats.map((item: any, index: number) => {
                    const product = item.product;
                    const stats = item.stats;
                    if (!product) return null;
                    
                    return (
                      <tr 
                        key={product._id || index} 
                        onClick={() => router.push(`/admin/produits/${product._id}/stats`)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {product.images && product.images.length > 0 && product.images[0] && (
                              <img
                                src={getImageUrl(product.images[0])}
                                alt={product.name || 'Produit'}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div>
                              <div className="font-semibold text-gray-900">
                                {product.name}
                              </div>
                              {product.price && (
                                <div className="text-sm text-gray-500">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product.price)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-4 px-4">
                          <span className="font-semibold text-gray-900">{stats.views || 0}</span>
                        </td>
                        <td className="text-right py-4 px-4">
                          <span className="font-semibold text-green-600">{stats.sales || 0}</span>
                        </td>
                        <td className="text-right py-4 px-4">
                          <span className="font-semibold text-green-700">
                            {stats.revenue ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.revenue) : '0 €'}
                          </span>
                        </td>
                        <td className="text-right py-4 px-4">
                          <span className="font-semibold text-blue-600">{stats.cartAdds || 0}</span>
                        </td>
                        <td className="text-right py-4 px-4">
                          <span className="font-semibold text-purple-600">{stats.favorites || 0}</span>
                        </td>
                        <td className="text-right py-4 px-4">
                          <span className="font-semibold text-orange-600">{stats.conversionRate || '0.00'}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              {productStats.length} produit{productStats.length > 1 ? 's' : ''} affiché{productStats.length > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

