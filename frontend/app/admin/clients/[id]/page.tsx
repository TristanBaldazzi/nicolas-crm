'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { authApi, cartsApi, companiesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import CustomSelect from '@/components/CustomSelect';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientCarts, setClientCarts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    isActive: true,
    company: '',
  });

  useEffect(() => {
    loadClient();
    loadClientCarts();
    loadCompanies();
  }, [id]);

  const loadCompanies = async () => {
    try {
      const res = await companiesApi.getAll({ limit: 1000 });
      setCompanies(res.data.companies || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadClient = async () => {
    try {
      const res = await authApi.getUserById(id);
      const userData = res.data;
      setClient(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        role: userData.role || 'user',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        company: userData.company?._id || userData.company || '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du chargement');
      router.push('/admin/clients');
    } finally {
      setLoading(false);
    }
  };

  const loadClientCarts = async () => {
    try {
      const res = await cartsApi.getUserCarts(id);
      setClientCarts(res.data.carts || []);
    } catch (error) {
      console.error('Error loading client carts:', error);
    }
  };

  const handleStatusChange = async (cartId: string, newStatus: string) => {
    try {
      await cartsApi.updateStatus(cartId, newStatus);
      toast.success('Statut modifié avec succès');
      loadClientCarts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateUser(id, formData);
      toast.success('Utilisateur modifié avec succès');
      loadClient();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'en_cours':
        return {
          label: 'En cours',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'demande':
        return {
          label: 'Demande',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'traité':
        return {
          label: 'Traité',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'fini':
        return {
          label: 'Fini',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-300',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'annulé':
        return {
          label: 'Annulé',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-300',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
      default:
        return {
          label: status,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          icon: null
        };
    }
  };

  const statusOptions = [
    { value: 'en_cours', label: 'En cours' },
    { value: 'demande', label: 'Demande' },
    { value: 'traité', label: 'Traité' },
    { value: 'fini', label: 'Fini' },
    { value: 'annulé', label: 'Annulé' }
  ];

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

  if (!client) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Utilisateur non trouvé</p>
          <Link href="/admin/clients" className="text-green-600 hover:underline mt-4 inline-block">
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
          href="/admin/clients"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la liste des clients
        </Link>
        <h1 className="text-4xl font-black text-gray-900">
          {client.firstName} {client.lastName}
        </h1>
        <p className="text-gray-600 mt-2">Détails et modification de l'utilisateur</p>
      </div>

      <div className="space-y-8">
        {/* Informations principales */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations personnelles</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-3 font-bold text-gray-900 text-sm uppercase tracking-wide">
                    Rôle
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'user', label: 'Utilisateur' },
                      { value: 'admin', label: 'Administrateur' },
                    ]}
                    value={formData.role}
                    onChange={(value) => setFormData({ ...formData, role: value })}
                    placeholder="Sélectionner un rôle"
                    searchable={false}
                    className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                  />
                </div>
                <div>
                  <label className="block mb-3 font-bold text-gray-900 text-sm uppercase tracking-wide">
                    Statut du compte
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'active', label: 'Actif' },
                      { value: 'inactive', label: 'Inactif' },
                    ]}
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                    placeholder="Sélectionner un statut"
                    searchable={false}
                    className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-3 font-bold text-gray-900 text-sm uppercase tracking-wide">
                  Entreprise
                </label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Aucune entreprise' },
                    ...companies.map((company) => ({
                      value: company._id,
                      label: company.name,
                    })),
                  ]}
                  value={formData.company}
                  onChange={(value) => setFormData({ ...formData, company: value })}
                  placeholder="Sélectionner une entreprise"
                  searchable={true}
                  className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                />
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
                <Link
                  href="/admin/clients"
                  className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all"
                >
                  Annuler
                </Link>
              </div>
            </form>
            </div>
          </div>

          {/* Sidebar avec informations */}
          <div className="space-y-6">
          {/* Carte profil */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-4xl font-black text-white">
                  {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {client.firstName} {client.lastName}
              </h3>
              <p className="text-gray-600 mt-1">{client.email}</p>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rôle</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  client.role === 'admin' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {client.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Statut</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  client.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {client.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Entreprise</span>
                {client.company ? (
                  <Link
                    href={`/admin/entreprises/${client.company._id || client.company}`}
                    className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors flex items-center gap-1 group"
                  >
                    {client.company.name || client.company}
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <span className="font-semibold text-gray-900">Aucune</span>
                )}
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Informations système</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Date d'inscription</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR', {
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
                  {client.updatedAt ? new Date(client.updatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">ID utilisateur</span>
                <p className="font-mono text-xs text-gray-500 mt-1 break-all">
                  {client.id || client._id}
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Paniers du client - Pleine largeur */}
        <div className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            Paniers du client
          </h3>
            {clientCarts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-semibold text-lg">Aucun panier pour ce client</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {clientCarts.map((cart) => {
                  const statusConfig = getStatusConfig(cart.status);
                  return (
                    <Link
                      key={cart._id}
                      href={`/admin/paniers/${cart._id}`}
                      className={`block border-2 ${statusConfig.borderColor} rounded-xl p-6 ${statusConfig.bgColor} hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 ${statusConfig.bgColor} ${statusConfig.borderColor} border-2 rounded-xl flex items-center justify-center ${statusConfig.textColor} shadow-md`}>
                              {statusConfig.icon}
                            </div>
                            <div>
                              <p className="font-bold text-lg text-gray-900">Panier #{cart._id.slice(-8)}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(cart.createdAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/70 rounded-lg">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <span className="text-sm font-semibold text-gray-700">{cart.items.length} article{cart.items.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-bold text-green-700">{cart.total.toFixed(2)} €</span>
                            </div>
                          </div>
                          {cart.notes && (
                            <div className="text-sm text-gray-700 bg-white/70 rounded-lg p-3 mb-3 italic border-l-4 border-gray-300">
                              "{cart.notes}"
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <span className={`px-4 py-2 rounded-xl text-sm font-bold ${statusConfig.bgColor} ${statusConfig.textColor} border-2 ${statusConfig.borderColor} inline-flex items-center gap-2 shadow-md`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                      
                      {/* Boutons de changement de statut */}
                      <div className="pt-4 border-t-2 border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Changer le statut</label>
                        <div className="flex flex-wrap gap-2">
                          {statusOptions.map((option) => {
                            const optionConfig = getStatusConfig(option.value);
                            const isActive = cart.status === option.value;
                            
                            return (
                              <button
                                key={option.value}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isActive) handleStatusChange(cart._id, option.value);
                                }}
                                disabled={isActive}
                                className={`
                                  px-4 py-2 rounded-lg text-xs font-bold
                                  transition-all duration-200 transform
                                  ${isActive 
                                    ? `${optionConfig.bgColor} ${optionConfig.textColor} border-2 ${optionConfig.borderColor} cursor-default shadow-md` 
                                    : `bg-white border-2 border-gray-300 text-gray-700 hover:scale-105 active:scale-95 cursor-pointer hover:shadow-md`
                                  }
                                  flex items-center gap-2
                                  ${!isActive && option.value === 'demande' ? 'hover:border-yellow-400 hover:bg-yellow-50' : ''}
                                  ${!isActive && option.value === 'traité' ? 'hover:border-blue-400 hover:bg-blue-50' : ''}
                                  ${!isActive && option.value === 'fini' ? 'hover:border-green-400 hover:bg-green-50' : ''}
                                  ${!isActive && option.value === 'annulé' ? 'hover:border-red-400 hover:bg-red-50' : ''}
                                  ${!isActive && option.value === 'en_cours' ? 'hover:border-gray-400 hover:bg-gray-50' : ''}
                                `}
                              >
                                {optionConfig.icon && (
                                  <span className={isActive ? optionConfig.textColor : 'text-gray-400'}>
                                    {optionConfig.icon}
                                  </span>
                                )}
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-end pt-3 border-t border-gray-200">
                        <span className="text-sm text-gray-600 group-hover:text-green-600 transition-colors font-semibold flex items-center gap-2">
                          Voir les détails
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </AdminLayout>
  );
}

