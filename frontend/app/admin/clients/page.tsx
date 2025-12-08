'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('user');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterClients();
  }, [search, roleFilter, statusFilter, allClients]);

  const loadData = async () => {
    try {
      const res = await authApi.getUsers({ limit: 1000 });
      const usersList = res.data.users || [];
      setAllClients(usersList);
      setClients(usersList);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = [...allClients];

    // Recherche textuelle
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((c) =>
        c.firstName?.toLowerCase().includes(searchLower) ||
        c.lastName?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre rôle
    if (roleFilter === 'user') {
      filtered = filtered.filter((c) => c.role !== 'admin');
    } else if (roleFilter === 'admin') {
      filtered = filtered.filter((c) => c.role === 'admin');
    }

    // Filtre statut
    if (statusFilter === 'active') {
      filtered = filtered.filter((c) => c.isActive !== false);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((c) => c.isActive === false);
    }

    setClients(filtered);
  };

  const handleClientClick = (client: any) => {
    router.push(`/admin/clients/${client.id || client._id}`);
  };


  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion des clients</h1>
          <p className="text-gray-600 mt-1">{allClients.length} client{allClients.length > 1 ? 's' : ''} au total</p>
        </div>
        <Link
          href="/admin/clients/nouveau"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau client
        </Link>
      </div>

      {/* Barre de recherche et filtres */}
      {allClients.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, prénom, email..."
                  className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filtre rôle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rôle</label>
              <CustomSelect
                options={[
                  { value: 'all', label: 'Tous' },
                  { value: 'user', label: 'Utilisateurs' },
                  { value: 'admin', label: 'Administrateurs' },
                ]}
                value={roleFilter}
                onChange={(value) => setRoleFilter(value)}
                placeholder="Sélectionner un rôle"
                searchable={false}
                className="shadow-sm hover:shadow-md focus-within:shadow-lg"
              />
            </div>

            {/* Filtre statut */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
              <CustomSelect
                options={[
                  { value: 'all', label: 'Tous' },
                  { value: 'active', label: 'Actifs' },
                  { value: 'inactive', label: 'Inactifs' },
                ]}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                placeholder="Sélectionner un statut"
                searchable={false}
                className="shadow-sm hover:shadow-md focus-within:shadow-lg"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="text-sm text-gray-600 hover:text-green-600 font-semibold flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Réinitialiser
              </button>
            )}
            <div className="ml-auto text-sm text-gray-600">
              <span className="font-semibold">{clients.length}</span> client{clients.length > 1 ? 's' : ''} trouvé{clients.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

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
                        Les utilisateurs et administrateurs qui s'inscrivent apparaîtront ici.
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




