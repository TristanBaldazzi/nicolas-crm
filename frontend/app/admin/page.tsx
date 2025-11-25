'use client';

import AdminLayout from '@/components/AdminLayout';
import { productsApi, clientsApi, categoriesApi, emailApi } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    clients: 0,
    categories: 0,
    campaigns: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [products, clients, categories, campaigns] = await Promise.all([
        productsApi.getAll().then((res) => res.data.pagination?.total || 0).catch(() => 0),
        clientsApi.getAll().then((res) => res.data.pagination?.total || 0).catch(() => 0),
        categoriesApi.getAll().then((res) => res.data?.length || 0).catch(() => 0),
        emailApi.getAll().then((res) => res.data?.length || 0).catch(() => 0),
      ]);

      setStats({ products, clients, categories, campaigns });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 mb-2">Produits</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.products}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 mb-2">Clients</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.clients}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 mb-2">Catégories</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.categories}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 mb-2">Campagnes Email</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.campaigns}</p>
        </div>
      </div>
    </AdminLayout>
  );
}

