'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { cartsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CartStatsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<'7d' | '14d' | '30d' | '365d'>('7d');
  const [status, setStatus] = useState<string>('traité');
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    loadStats(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stats) {
      // Sauvegarder la position du scroll avant le changement
      scrollPositionRef.current = window.scrollY;
      
      loadStats(false).then(() => {
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
  }, [period, status]);

  const loadStats = async (initialLoad = false) => {
    if (initialLoad) {
      setLoading(true);
    } else {
      setLoadingChart(true);
    }
    try {
      const res = await cartsApi.getStats({ period, status });
      setStats((prev: any) => ({
        ...prev,
        ...res.data,
        summary: res.data.summary,
        dailyStats: res.data.dailyStats,
        topCompanies: res.data.topCompanies,
        topClients: res.data.topClients
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      if (initialLoad) {
        setLoading(false);
      } else {
        setLoadingChart(false);
      }
    }
  };

  const getStatusLabel = (statusValue: string) => {
    switch (statusValue) {
      case 'demande':
        return 'Panier validé';
      case 'annulé':
        return 'Panier annulé';
      case 'en_cours':
        return 'Panier en cours';
      case 'traité':
        return 'Panier traité';
      default:
        return statusValue;
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Erreur lors du chargement des statistiques</p>
          <Link href="/admin/paniers" className="text-green-600 hover:underline mt-4 inline-block">
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
        <Link
          href="/admin/paniers"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la gestion des paniers
        </Link>
        <div>
          <h1 className="text-4xl font-black text-gray-900">Statistiques des paniers</h1>
          <p className="text-gray-600 mt-2">Analyse des commandes et performances</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-8 space-y-4">
        {/* Filtres de statut */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-bold text-gray-700 mb-3">Filtrer par statut</label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatus('traité')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                status === 'traité' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Panier traité
            </button>
            <button
              onClick={() => setStatus('demande')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                status === 'demande' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Panier validé
            </button>
            <button
              onClick={() => setStatus('en_cours')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                status === 'en_cours' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Panier en cours
            </button>
            <button
              onClick={() => setStatus('annulé')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                status === 'annulé' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Panier annulé
            </button>
          </div>
        </div>

        {/* Filtres de période */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-bold text-gray-700 mb-3">Période</label>
          <div className="flex gap-2">
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
      </div>

      {/* Statistiques principales */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="text-sm font-semibold text-gray-600 mb-2">Nombre de paniers</div>
          <div className="text-3xl font-black text-green-600">{stats.summary.totalCarts}</div>
          <div className="text-xs text-gray-500 mt-1">{getStatusLabel(status)} - {getPeriodLabel()}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="text-sm font-semibold text-gray-600 mb-2">Panier moyen</div>
          <div className="text-3xl font-black text-blue-600">{stats.summary.averageCart.toFixed(2)} €</div>
          <div className="text-xs text-gray-500 mt-1">Montant moyen par panier</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="text-sm font-semibold text-gray-600 mb-2">Montant total</div>
          <div className="text-3xl font-black text-purple-600">{stats.summary.totalAmount.toFixed(2)} €</div>
          <div className="text-xs text-gray-500 mt-1">Total sur {getPeriodLabel().toLowerCase()}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Graphique nombre de paniers */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Nombre de paniers par jour</h3>
          {loadingChart ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600"></div>
              <p className="mt-4 text-gray-600 text-sm">Chargement des données...</p>
            </div>
          ) : stats.dailyStats && stats.dailyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.dailyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
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
                  allowDecimals={false}
                  domain={[0, 'auto']}
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
                  formatter={(value: any) => [`${value} panier${value > 1 ? 's' : ''}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10B981"
                  strokeWidth={3}
                  fill="url(#colorCount)"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Graphique montant total */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Montant total par jour</h3>
          {loadingChart ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600"></div>
              <p className="mt-4 text-gray-600 text-sm">Chargement des données...</p>
            </div>
          ) : stats.dailyStats && stats.dailyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  formatter={(value: number) => `${value.toFixed(2)} €`}
                />
                <Bar dataKey="total" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top entreprises */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Top entreprises</h3>
          {stats.topCompanies && stats.topCompanies.length > 0 ? (
            <div className="space-y-3">
              {stats.topCompanies.map((company: any, index: number) => (
                <Link
                  key={company.id}
                  href={`/admin/entreprises/${company.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{company.name}</p>
                      <p className="text-sm text-gray-600">{company.count} panier{company.count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-green-600">{company.total.toFixed(2)} €</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Aucune entreprise avec des commandes
            </div>
          )}
        </div>

        {/* Top clients */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Top clients</h3>
          {stats.topClients && stats.topClients.length > 0 ? (
            <div className="space-y-3">
              {stats.topClients.map((client: any, index: number) => (
                <Link
                  key={client.id}
                  href={`/admin/clients/${client.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{client.name}</p>
                      {client.email && (
                        <p className="text-sm text-gray-600">{client.email}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">{client.count} panier{client.count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-green-600">{client.total.toFixed(2)} €</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Aucun client avec des commandes
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

