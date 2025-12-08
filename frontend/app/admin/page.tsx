'use client';

import AdminLayout from '@/components/AdminLayout';
import CustomSelect from '@/components/CustomSelect';
import { productsApi, authApi, categoriesApi, emailApi, cartsApi, analyticsApi } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getImageUrl } from '@/lib/config';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();
  const [stats, setStats] = useState({
    products: 0,
    clients: 0,
    categories: 0,
    campaigns: 0,
  });
  const [userStats, setUserStats] = useState<any[]>([]);
  const [period, setPeriod] = useState<'7d' | '14d' | '30d' | '365d'>('14d');
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [productStats, setProductStats] = useState<any[]>([]);
  const [productStatsLoading, setProductStatsLoading] = useState(false);
  const [productPeriod, setProductPeriod] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [productSortBy, setProductSortBy] = useState<'views' | 'sales' | 'revenue' | 'cartAdds' | 'favorites' | 'conversionRate'>('views');

  useEffect(() => {
    // Vérifier que l'utilisateur est admin avant de charger les données
    if (!user || user.role !== 'admin') {
      return; // AdminLayout gère déjà la redirection
    }
    loadStats();
    loadUserStats();
    loadPendingOrdersCount();
    loadProductStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, period, productPeriod, productSortBy]);

  const loadPendingOrdersCount = async () => {
    try {
      const res = await cartsApi.countPending();
      setPendingOrdersCount(res.data.count || 0);
    } catch (error) {
      console.error('Error loading pending orders count:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [products, clients, categories, campaigns] = await Promise.all([
        productsApi.getAll().then((res) => res.data.pagination?.total || 0).catch(() => 0),
        authApi.getUsers().then((res) => res.data.pagination?.total || 0).catch(() => 0),
        categoriesApi.getAll().then((res) => res.data?.length || 0).catch(() => 0),
        emailApi.getAll().then((res) => res.data?.length || 0).catch(() => 0),
      ]);

      setStats({ products, clients, categories, campaigns });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const res = await authApi.getUserStats({ period });
      const stats = res.data?.stats || res.data || [];
      setUserStats(stats);
    } catch (error: any) {
      console.error('Error loading user stats:', error);
      setUserStats([]);
    }
  };

  const loadProductStats = async () => {
    try {
      setProductStatsLoading(true);
      const res = await analyticsApi.getAllProductsStats({ 
        period: productPeriod,
        sortBy: productSortBy,
        limit: 10
      });
      setProductStats(res.data || []);
    } catch (error: any) {
      console.error('Error loading product stats:', error);
      setProductStats([]);
    } finally {
      setProductStatsLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case '7d':
        return '7 derniers jours';
      case '14d':
        return '14 derniers jours';
      case '30d':
        return '30 derniers jours';
      case '365d':
        return '365 derniers jours';
      default:
        return '7 derniers jours';
    }
  };

  const totalUsers = userStats.reduce((sum, stat) => sum + (stat.count || 0), 0);
  const maxCount = userStats.length > 0 ? Math.max(...userStats.map((s: any) => s.count || 0), 1) : 1;
  const hasUsers = totalUsers > 0;

  return (
    <AdminLayout>
      {/* Avertissement pour les commandes en attente */}
      {pendingOrdersCount > 0 && (
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900">
                  {pendingOrdersCount} commande{pendingOrdersCount > 1 ? 's' : ''} en attente
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Des commandes nécessitent votre attention. Veuillez les traiter.
                </p>
              </div>
            </div>
            <Link
              href="/admin/paniers?status=demande"
              className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
            >
              Voir les commandes
            </Link>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 mb-2">Produits</h3>
          <p className="text-3xl font-bold text-green-600">{stats.products}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 mb-2">Clients</h3>
          <p className="text-3xl font-bold text-green-600">{stats.clients}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 mb-2">Catégories</h3>
          <p className="text-3xl font-bold text-green-600">{stats.categories}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 mb-2">Campagnes Email</h3>
          <p className="text-3xl font-bold text-green-600">{stats.campaigns}</p>
        </div>
      </div>

      {/* Graphique des nouveaux utilisateurs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nouveaux utilisateurs</h2>
              <p className="text-xs text-gray-600 mt-0.5">{getPeriodLabel()}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-green-600">{totalUsers}</div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total</div>
            </div>
          </div>
          
          {/* Filtres de période */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                period === '7d' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              7j
            </button>
            <button
              onClick={() => setPeriod('14d')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                period === '14d' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              14j
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                period === '30d' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              30j
            </button>
            <button
              onClick={() => setPeriod('365d')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                period === '365d' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              365j
            </button>
          </div>
        </div>
        
        {userStats.length > 0 && hasUsers ? (
          <div className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={userStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '8px 12px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '11px' }}
                  formatter={(value: any) => [`${value} utilisateur${value > 1 ? 's' : ''}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorUsers)"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : userStats.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-600 mb-4"></div>
            <p className="text-gray-500 font-semibold">Chargement des statistiques...</p>
          </div>
        ) : (
          <div className="p-8">
            <div className="text-center py-12 mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-700 text-xl font-bold mb-2">Aucun nouvel utilisateur</p>
              <p className="text-gray-500 text-sm">Les nouveaux utilisateurs apparaîtront ici sur {getPeriodLabel().toLowerCase()}</p>
            </div>
            
            {/* Tableau détaillé avec design amélioré */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Détail {getPeriodLabel().toLowerCase()}</h3>
              <div className={`grid gap-2 ${
                period === '7d' ? 'grid-cols-7' :
                period === '14d' ? 'grid-cols-7' :
                period === '30d' ? 'grid-cols-10' :
                'grid-cols-12'
              } overflow-x-auto`}>
                {userStats.map((stat: any, index: number) => (
                  <div key={index} className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:from-gray-100 hover:to-gray-200 transition-all min-w-[80px]">
                    <div className="text-2xl font-black text-gray-400 mb-1">{stat.count}</div>
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide leading-tight">{stat.day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques des produits */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mt-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Statistiques des produits</h2>
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
            {productStats.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <Link
                  href={`/admin/statistiques?period=${productPeriod}&sortBy=${productSortBy}`}
                  className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm transition-colors group"
                >
                  <span>Voir plus</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}



