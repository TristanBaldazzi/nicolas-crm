'use client';

import AdminLayout from '@/components/AdminLayout';
import { productsApi, authApi, categoriesApi, emailApi } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    clients: 0,
    categories: 0,
    campaigns: 0,
  });
  const [userStats, setUserStats] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadUserStats();
  }, []);

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
      const res = await authApi.getUserStats();
      const stats = res.data.stats || [];
      setUserStats(stats);
      console.log('User stats loaded:', stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStats([]);
    }
  };

  const maxCount = userStats.length > 0 ? Math.max(...userStats.map((s: any) => s.count || 0), 1) : 1;

  return (
    <AdminLayout>
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
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Nouveaux utilisateurs (7 derniers jours)</h2>
        {userStats.length === 7 ? (
          <div className="relative h-80">
            {/* Grille de fond */}
            <div className="absolute inset-0 flex flex-col justify-between pb-12">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-gray-100"></div>
              ))}
            </div>
            
            {/* SVG pour la courbe */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 280" preserveAspectRatio="none" style={{ paddingBottom: '60px' }}>
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(34, 197, 94, 0.25)" />
                  <stop offset="100%" stopColor="rgba(34, 197, 94, 0.02)" />
                </linearGradient>
              </defs>
              
              {/* Zone remplie sous la courbe */}
              <polygon
                points={`0,260 ${userStats.map((stat: any, index: number) => {
                  const x = (index / 6) * 700;
                  const y = maxCount > 0 ? 260 - ((stat.count / maxCount) * 230) : 260;
                  return `${x},${y}`;
                }).join(' ')} 700,260`}
                fill="url(#areaGradient)"
              />
              
              {/* Ligne de la courbe */}
              <polyline
                points={userStats.map((stat: any, index: number) => {
                  const x = (index / 6) * 700;
                  const y = maxCount > 0 ? 260 - ((stat.count / maxCount) * 230) : 260;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Points sur la courbe */}
              {userStats.map((stat: any, index: number) => {
                const x = (index / 6) * 700;
                const y = maxCount > 0 ? 260 - ((stat.count / maxCount) * 230) : 260;
                return (
                  <g key={index} className="group">
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill="#22c55e"
                      stroke="white"
                      strokeWidth="3"
                      className="transition-all cursor-pointer group-hover:r-12"
                    />
                    {/* Tooltip au survol */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <rect
                        x={x - 35}
                        y={y - 40}
                        width="70"
                        height="28"
                        fill="#1f2937"
                        rx="6"
                      />
                      <text
                        x={x}
                        y={y - 20}
                        textAnchor="middle"
                        fill="white"
                        fontSize="13"
                        fontWeight="bold"
                      >
                        {stat.count} utilisateur{stat.count > 1 ? 's' : ''}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
            
            {/* Labels en bas */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
              {userStats.map((stat: any, index: number) => (
                <div key={index} className="flex flex-col items-center min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-900 mb-1">{stat.count}</div>
                  <div className="text-xs text-gray-500 text-center leading-tight">{stat.day}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Aucun nouvel utilisateur sur les 7 derniers jours
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

