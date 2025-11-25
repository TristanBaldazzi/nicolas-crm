'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await authApi.getUsers({ limit: 100 });
      setClients(res.data.users || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleClientClick = (client: any) => {
    router.push(`/admin/clients/${client.id || client._id}`);
  };


  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des clients</h1>
        <p className="text-gray-600">Liste des utilisateurs (hors administrateurs)</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Nom</th>
              <th className="px-6 py-3 text-left">Prénom</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Rôle</th>
              <th className="px-6 py-3 text-left">Date d'inscription</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Aucun client pour le moment</h3>
                      <p className="text-gray-600">
                        Les utilisateurs qui s'inscrivent apparaîtront ici. Les administrateurs ne sont pas inclus dans cette liste.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr 
                  key={client.id || client._id} 
                  className="border-t hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleClientClick(client)}
                >
                  <td className="px-6 py-4 font-semibold">{client.lastName}</td>
                  <td className="px-6 py-4">{client.firstName}</td>
                  <td className="px-6 py-4">{client.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      client.role === 'admin' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {client.role === 'admin' ? 'Admin' : 'Utilisateur'}
                    </span>
                    {client.isActive === false && (
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR') : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}


