'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { analyticsApi, productsApi } from '@/lib/api';
import { getImageUrl } from '@/lib/config';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import Link from 'next/link';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ProductStatsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadProduct();
    loadStats();
  }, [productId, dateRange]);

  const loadProduct = async () => {
    try {
      const res = await productsApi.getById(productId);
      setProduct(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du produit');
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      console.log('[StatsPage] Chargement des stats pour produit:', productId, 'Période:', dateRange);
      const endDate = new Date();
      const startDate = new Date();
      
      if (dateRange === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (dateRange === '90d') {
        startDate.setDate(startDate.getDate() - 90);
      } else {
        startDate.setTime(0); // Toutes les dates
      }

      const params = {
        startDate: dateRange !== 'all' ? startDate.toISOString().split('T')[0] : undefined,
        endDate: endDate.toISOString().split('T')[0],
      };
      console.log('[StatsPage] Paramètres de requête:', params);

      const res = await analyticsApi.getProductStats(productId, params);
      console.log('[StatsPage] Réponse reçue:', res.data);
      console.log('[StatsPage] Structure des stats:', {
        hasStats: !!res.data.stats,
        hasTrafficSources: !!res.data.trafficSources,
        hasDailyStats: !!res.data.dailyStats,
        dailyStatsLength: res.data.dailyStats?.length,
        totalEvents: res.data.totalEvents
      });
      
      if (!res.data || !res.data.stats) {
        console.error('[StatsPage] Données invalides reçues:', res.data);
        toast.error('Format de données invalide');
        return;
      }
      
      setStats(res.data);
    } catch (error: any) {
      console.error('[StatsPage] Erreur complète:', error);
      console.error('[StatsPage] Erreur response:', error.response?.data);
      console.error('[StatsPage] Erreur message:', error.message);
      toast.error(error.response?.data?.error || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatPercentage = (num: number | string) => {
    return `${parseFloat(String(num)).toFixed(2)}%`;
  };

  if (loading && !stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mb-4"></div>
            <p className="text-gray-600">Chargement des statistiques...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!product || !stats) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Produit ou statistiques non trouvés</p>
          <Link href="/admin/produits" className="text-green-600 hover:underline mt-4 inline-block">
            Retour aux produits
          </Link>
        </div>
      </AdminLayout>
    );
  }

  // Fonction pour remplir tous les jours de la période
  const fillAllDays = (dailyStats: any[], dateRange: string) => {
    const endDate = new Date();
    const startDate = new Date();
    let daysCount = 0;
    
    if (dateRange === '7d') {
      startDate.setDate(startDate.getDate() - 7);
      daysCount = 7;
    } else if (dateRange === '30d') {
      startDate.setDate(startDate.getDate() - 30);
      daysCount = 30;
    } else if (dateRange === '90d') {
      startDate.setDate(startDate.getDate() - 90);
      daysCount = 90;
    } else {
      // Pour 'all', on retourne les stats telles quelles
      return dailyStats.map((day: any) => ({
        date: new Date(day.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        Vues: day.views,
        'Ajouts panier': day.cartAdds,
        'Achats': day.purchases,
        'Favoris': day.favorites,
      }));
    }

    // Créer un map des stats existantes par date
    const statsMap = new Map();
    dailyStats.forEach((day: any) => {
      const dateKey = new Date(day.date).toISOString().split('T')[0];
      statsMap.set(dateKey, {
        views: day.views || 0,
        cartAdds: day.cartAdds || 0,
        purchases: day.purchases || 0,
        favorites: day.favorites || 0,
      });
    });

    // Générer tous les jours de la période
    const allDays = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < daysCount; i++) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayStats = statsMap.get(dateKey) || { views: 0, cartAdds: 0, purchases: 0, favorites: 0 };
      
      allDays.push({
        date: currentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        Vues: dayStats.views,
        'Ajouts panier': dayStats.cartAdds,
        'Achats': dayStats.purchases,
        'Favoris': dayStats.favorites,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return allDays;
  };

  // Préparer les données pour les graphiques
  const dailyData = fillAllDays(stats.dailyStats || [], dateRange);

  const trafficData = Object.entries(stats.trafficSources).map(([source, data]: [string, any]) => ({
    name: source === 'direct' ? 'Direct' : 
          source === 'search' ? 'Recherche' :
          source === 'catalog' ? 'Catalogue' :
          source === 'category' ? 'Catégorie' :
          source === 'brand' ? 'Marque' :
          source === 'external' ? 'Externe' : 'Autre',
    value: data.views,
    ...data
  }));

  // Préparer les données des referrers
  const topReferrers = (stats.topReferrers || []).map((ref: any) => ({
    ...ref,
    referrer: ref.referrer || '/',
    displayName: ref.referrer === '/' ? 'Page d\'accueil' : 
                 ref.referrer === '/admin' ? 'Admin' :
                 ref.referrer.startsWith('/catalogue') ? 'Catalogue' :
                 ref.referrer.startsWith('/produit') ? 'Page produit' :
                 ref.referrer.startsWith('/category') ? 'Catégorie' :
                 ref.referrer.startsWith('/search') ? 'Recherche' :
                 ref.referrer
  }));

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/produits"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2">Statistiques du produit</h1>
              <div className="flex items-center gap-3">
                {product.images?.[0] && (
                  <img
                    src={getImageUrl(product.images[0].url)}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                )}
                <div>
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">
                    {typeof product.brand === 'object' && product.brand !== null 
                      ? product.brand.name 
                      : product.brand || 'Sans marque'} • SKU: {product.sku || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  dateRange === range
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {range === '7d' ? '7j' : range === '30d' ? '30j' : range === '90d' ? '90j' : 'Tout'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 mb-2">Vues totales</h3>
          <p className="text-3xl font-bold text-green-600">{formatNumber(stats.stats.totalViews)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 mb-2">Ajouts au panier</h3>
          <p className="text-3xl font-bold text-green-600">{formatNumber(stats.stats.totalCartAdds)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatPercentage(parseFloat(stats.stats.cartAbandonmentRate))} des vues
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 mb-2">Achats</h3>
          <p className="text-3xl font-bold text-green-600">{formatNumber(stats.stats.totalPurchases)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatPercentage(parseFloat(stats.stats.conversionRate))} de conversion
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 mb-2">Favoris</h3>
          <p className="text-3xl font-bold text-green-600">{formatNumber(stats.stats.totalFavorites)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatPercentage(parseFloat(stats.stats.favoriteRate))} des vues
          </p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Graphique temporel */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Évolution dans le temps</h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  {dateRange === '7d' ? '7 derniers jours' : 
                   dateRange === '30d' ? '30 derniers jours' : 
                   dateRange === '90d' ? '90 derniers jours' : 
                   'Toutes les périodes'}
                </p>
              </div>
            </div>
          </div>
          
          {dailyData.length > 0 ? (
            <div className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFavorites" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="date" 
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
                  />
                  <Area
                    type="monotone"
                    dataKey="Vues"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorViews)"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Ajouts panier"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#colorCart)"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Achats"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fill="url(#colorPurchases)"
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Favoris"
                    stroke="#ef4444"
                    strokeWidth={3}
                    fill="url(#colorFavorites)"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-700 text-xl font-bold mb-2">Aucune donnée</p>
              <p className="text-gray-500 text-sm">Les statistiques apparaîtront ici une fois que des événements seront enregistrés</p>
            </div>
          )}
        </div>

        {/* Sources de trafic */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Sources de trafic</h3>
            <p className="text-xs text-gray-600 mt-0.5">Répartition des vues par source</p>
          </div>
          
          {trafficData.length > 0 ? (
            <div className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={trafficData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => {
                      const percent = entry.percent || 0;
                      return `${entry.name || 'Autre'} ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '8px 12px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-700 text-xl font-bold mb-2">Aucune donnée</p>
              <p className="text-gray-500 text-sm">Les sources de trafic apparaîtront ici</p>
            </div>
          )}
        </div>
      </div>

      {/* Détails par source */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Détails par source de trafic</h3>
          <p className="text-xs text-gray-600 mt-0.5">Analyse détaillée des performances par source</p>
        </div>
        
        {trafficData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Source</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Vues</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Ajouts panier</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Achats</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Favoris</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Taux conversion</th>
                </tr>
              </thead>
              <tbody>
                {trafficData.map((source, index) => {
                  const conversionRate = source.views > 0 ? ((source.purchases / source.views) * 100).toFixed(2) : '0.00';
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{source.name}</td>
                      <td className="py-3 px-4 text-right text-gray-700 font-semibold">{formatNumber(source.value)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(source.cartAdds)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(source.purchases)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(source.favorites)}</td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">{conversionRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-700 text-xl font-bold mb-2">Aucune donnée</p>
            <p className="text-gray-500 text-sm">Les détails par source apparaîtront ici</p>
          </div>
        )}
      </div>

      {/* Top Referrers */}
      {topReferrers.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Pages d'origine du trafic</h3>
            <p className="text-xs text-gray-600 mt-0.5">Les pages d'où provient le plus de trafic vers ce produit</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Page d'origine</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Vues</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Ajouts panier</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Achats</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Favoris</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Taux conversion</th>
                </tr>
              </thead>
              <tbody>
                {topReferrers.map((ref: any, index: number) => {
                  const conversionRate = ref.views > 0 ? ((ref.purchases / ref.views) * 100).toFixed(2) : '0.00';
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 w-6 text-center">#{index + 1}</span>
                          <span className="font-medium text-gray-900">{ref.displayName}</span>
                          {ref.referrer !== ref.displayName && (
                            <span className="text-xs text-gray-500 font-mono truncate max-w-xs">{ref.referrer}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 font-semibold">{formatNumber(ref.views)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(ref.cartAdds)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(ref.purchases)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(ref.favorites)}</td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">{conversionRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistiques par type d'appareil */}
      {stats.deviceStats && stats.deviceStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mt-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Trafic par type d'appareil</h3>
            <p className="text-xs text-gray-600 mt-0.5">Répartition du trafic selon le type d'appareil utilisé</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Type d'appareil</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Vues</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Ajouts panier</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Achats</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Favoris</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Taux conversion</th>
                </tr>
              </thead>
              <tbody>
                {stats.deviceStats.map((device: any, index: number) => {
                  const conversionRate = device.views > 0 ? ((device.purchases / device.views) * 100).toFixed(2) : '0.00';
                  const totalViews = stats.deviceStats.reduce((sum: number, d: any) => sum + d.views, 0);
                  const percentage = totalViews > 0 ? ((device.views / totalViews) * 100).toFixed(1) : '0';
                  
                  // Icône selon le type d'appareil
                  const getDeviceIcon = (deviceType: string) => {
                    if (deviceType.includes('iPhone')) {
                      return (
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      );
                    }
                    if (deviceType.includes('iPad') || deviceType.includes('Tablette')) {
                      return (
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      );
                    }
                    if (deviceType.includes('Android') || deviceType.includes('Mobile')) {
                      return (
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      );
                    }
                    return (
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    );
                  };
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {getDeviceIcon(device.deviceType)}
                          <div>
                            <span className="font-medium text-gray-900">{device.deviceType}</span>
                            <span className="text-xs text-gray-500 ml-2">{percentage}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 font-semibold">{formatNumber(device.views)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(device.cartAdds)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(device.purchases)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(device.favorites)}</td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">{conversionRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistiques par utilisateur */}
      {stats.userStats && stats.userStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mt-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Activité par utilisateur</h3>
            <p className="text-xs text-gray-600 mt-0.5">Détails des actions de chaque utilisateur</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Utilisateur</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Vues</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Ajouts panier</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Achats</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Favoris</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Total actions</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.userStats.map((user: any, index: number) => {
                  const getEventTypeLabel = (type: string) => {
                    const labels: { [key: string]: string } = {
                      'view': 'Vue',
                      'cart_add': 'Ajout panier',
                      'cart_remove': 'Retrait panier',
                      'purchase': 'Achat',
                      'favorite_add': 'Ajout favoris',
                      'favorite_remove': 'Retrait favoris'
                    };
                    return labels[type] || type;
                  };
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{user.userName}</div>
                          {user.userEmail && (
                            <div className="text-xs text-gray-500">{user.userEmail}</div>
                          )}
                          {!user.userId && (
                            <div className="text-xs text-gray-400 italic">Visiteur anonyme</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 font-semibold">{formatNumber(user.views)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(user.cartAdds)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(user.purchases)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(user.favorites)}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">{formatNumber(user.totalEvents)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-green-600 hover:text-green-700 font-semibold text-sm"
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
        </div>
      )}

      {/* Modal de détails utilisateur */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Détails des actions</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedUser.userName}
                  {selectedUser.userEmail && ` • ${selectedUser.userEmail}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Vues</div>
                  <div className="text-2xl font-bold text-blue-600">{selectedUser.views}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Ajouts panier</div>
                  <div className="text-2xl font-bold text-green-600">{selectedUser.cartAdds}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Achats</div>
                  <div className="text-2xl font-bold text-purple-600">{selectedUser.purchases}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Favoris</div>
                  <div className="text-2xl font-bold text-red-600">{selectedUser.favorites}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 mb-4">Historique des événements ({selectedUser.events.length})</h4>
                {selectedUser.events.map((event: any, index: number) => {
                  const getEventTypeColor = (type: string) => {
                    const colors: { [key: string]: string } = {
                      'view': 'bg-blue-100 text-blue-800',
                      'cart_add': 'bg-green-100 text-green-800',
                      'cart_remove': 'bg-yellow-100 text-yellow-800',
                      'purchase': 'bg-purple-100 text-purple-800',
                      'favorite_add': 'bg-red-100 text-red-800',
                      'favorite_remove': 'bg-gray-100 text-gray-800'
                    };
                    return colors[type] || 'bg-gray-100 text-gray-800';
                  };

                  const getEventTypeLabel = (type: string) => {
                    const labels: { [key: string]: string } = {
                      'view': 'Vue',
                      'cart_add': 'Ajout panier',
                      'cart_remove': 'Retrait panier',
                      'purchase': 'Achat',
                      'favorite_add': 'Ajout favoris',
                      'favorite_remove': 'Retrait favoris'
                    };
                    return labels[type] || type;
                  };

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEventTypeColor(event.eventType)}`}>
                            {getEventTypeLabel(event.eventType)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(event.createdAt).toLocaleString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {event.referrer && (
                          <div>
                            <span className="text-gray-500">Page d'origine:</span>
                            <div className="text-gray-900 font-mono text-xs mt-1 truncate">{event.referrer}</div>
                          </div>
                        )}
                        {event.source && (
                          <div>
                            <span className="text-gray-500">Source:</span>
                            <div className="text-gray-900 mt-1 capitalize">{event.source}</div>
                          </div>
                        )}
                        {event.userAgent && (
                          <div>
                            <span className="text-gray-500">Appareil:</span>
                            <div className="text-gray-900 text-xs mt-1 truncate">{event.userAgent}</div>
                          </div>
                        )}
                        {event.sessionId && (
                          <div>
                            <span className="text-gray-500">Session:</span>
                            <div className="text-gray-900 font-mono text-xs mt-1 truncate">{event.sessionId}</div>
                          </div>
                        )}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="md:col-span-2">
                            <span className="text-gray-500">Métadonnées:</span>
                            <pre className="text-gray-900 text-xs mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

