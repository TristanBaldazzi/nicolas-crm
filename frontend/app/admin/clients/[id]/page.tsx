'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { authApi, cartsApi, companiesApi, clientFilesApi, contactApi } from '@/lib/api';
import { BACKEND_URL } from '@/lib/config';
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
  const [clientFiles, setClientFiles] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [clientContacts, setClientContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
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
    loadClientFiles();
    loadClientContacts();
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
      setInternalNotes(userData.internalNotes || '');
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

  const loadClientFiles = async () => {
    try {
      const res = await clientFilesApi.getByUser(id);
      setClientFiles(res.data.files || []);
    } catch (error) {
      console.error('Error loading client files:', error);
    }
  };

  const loadClientContacts = async () => {
    try {
      setLoadingContacts(true);
      const res = await contactApi.getByUser(id);
      setClientContacts(res.data || []);
    } catch (error) {
      console.error('Error loading client contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Veuillez sélectionner au moins un fichier');
      return;
    }

    setUploadingFiles(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('isPublic', isPublic.toString());

      await clientFilesApi.upload(id, formData);
      toast.success(`${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''} uploadé${selectedFiles.length > 1 ? 's' : ''} avec succès`);
      setSelectedFiles([]);
      setIsPublic(false);
      loadClientFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'upload');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleToggleVisibility = async (fileId: string, currentVisibility: boolean) => {
    try {
      await clientFilesApi.toggleVisibility(fileId, !currentVisibility);
      toast.success('Visibilité modifiée avec succès');
      loadClientFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      return;
    }

    try {
      await clientFilesApi.delete(fileId);
      toast.success('Fichier supprimé avec succès');
      loadClientFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await authApi.updateUser(id, { internalNotes });
      toast.success('Notes internes enregistrées');
      loadClient(); // Recharger pour avoir la date de mise à jour
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setSavingNotes(false);
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              Paniers du client
            </h3>
            <Link
              href={`/admin/clients/${id}/panier/nouveau`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Créer un panier
            </Link>
          </div>
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

        {/* Fichiers du client */}
        <div className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            Fichiers du client
          </h3>

          {/* Upload de fichiers */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200 mb-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Ajouter des fichiers</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sélectionner des fichiers (max 10, 100 MB par fichier)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 10) {
                        toast.error('Maximum 10 fichiers autorisés');
                        return;
                      }
                      setSelectedFiles(files);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={uploadingFiles}
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex items-center justify-between w-full px-4 py-3 bg-white border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                      selectedFiles.length > 0
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                    } ${uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedFiles.length > 0
                          ? 'bg-indigo-100'
                          : 'bg-gray-100'
                      }`}>
                        <svg className={`w-5 h-5 ${
                          selectedFiles.length > 0 ? 'text-indigo-600' : 'text-gray-500'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-semibold block ${
                          selectedFiles.length > 0 ? 'text-indigo-700' : 'text-gray-700'
                        }`}>
                          {selectedFiles.length > 0
                            ? `${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''} sélectionné${selectedFiles.length > 1 ? 's' : ''}`
                            : 'Cliquez pour sélectionner des fichiers'}
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5 block">
                          {selectedFiles.length > 0
                            ? selectedFiles.map(f => f.name).join(', ').substring(0, 50) + (selectedFiles.some(f => f.name.length > 50) ? '...' : '')
                            : 'ou glissez-déposez vos fichiers ici'}
                        </span>
                      </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedFiles.length > 0
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      Parcourir
                    </div>
                  </label>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                          }}
                          className="ml-3 p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                    />
                    {isPublic && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-gray-900">Fichier public</span>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Le client pourra voir ce fichier dans sa liste de fichiers
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    isPublic
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isPublic ? 'Public' : 'Privé'}
                  </span>
                </label>
              </div>

              <button
                onClick={handleFileUpload}
                disabled={uploadingFiles || selectedFiles.length === 0}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploadingFiles ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Uploader {selectedFiles.length > 0 ? `${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''}` : 'les fichiers'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Liste des fichiers */}
          {clientFiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-semibold">Aucun fichier pour ce client</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientFiles.map((file: any) => (
                <div
                  key={file._id}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      file.isPublic ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <svg className={`w-6 h-6 ${file.isPublic ? 'text-green-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{file.originalName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          file.isPublic
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {file.isPublic ? 'Public' : 'Privé'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(file.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`${BACKEND_URL}${file.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="Télécharger"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <button
                      onClick={() => handleToggleVisibility(file._id, file.isPublic)}
                      className={`p-2 rounded-lg transition-colors ${
                        file.isPublic
                          ? 'text-green-600 hover:bg-green-100'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={file.isPublic ? 'Rendre privé' : 'Rendre public'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {file.isPublic ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file._id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demandes de contact */}
        <div className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            Demandes de contact
            {clientContacts.length > 0 && (
              <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {clientContacts.length}
              </span>
            )}
          </h3>

          {loadingContacts ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-500 font-semibold">Chargement des demandes...</p>
            </div>
          ) : clientContacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 font-semibold">Aucune demande de contact</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientContacts.map((contact: any) => (
                <div
                  key={contact._id}
                  className={`p-5 border-2 rounded-xl transition-all ${
                    contact.isRead
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-blue-300 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </h4>
                        {!contact.isRead && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                            Non traité
                          </span>
                        )}
                        {contact.isRead && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            Traité
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">Email:</span> {contact.email}
                        {contact.phone && (
                          <span className="ml-4">
                            <span className="font-semibold">Téléphone:</span> {contact.phone}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(contact.createdAt)}
                      </p>
                    </div>
                    <Link
                      href={`/admin/contact?messageId=${contact._id}`}
                      className="ml-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Voir le message
                    </Link>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 line-clamp-3">{contact.message}</p>
                  </div>
                  {contact.files && contact.files.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a2 2 0 00-2.828-2.828L9 10.172 13.172 6l2 2z" />
                      </svg>
                      <span>{contact.files.length} fichier{contact.files.length > 1 ? 's' : ''} joint{contact.files.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consentement au tracking */}
        <div className="w-full bg-white rounded-xl shadow-md border border-gray-100 p-4 mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            Consentement au tracking
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 font-semibold">Statut</span>
                {client.trackingConsent === true ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Activé
                  </span>
                ) : client.trackingConsent === false ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Désactivé
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Non défini
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">
                {client.trackingConsent === true 
                  ? 'L\'utilisateur a accepté le suivi de ses interactions avec les produits'
                  : client.trackingConsent === false
                  ? 'L\'utilisateur a refusé le suivi de ses interactions avec les produits'
                  : 'L\'utilisateur n\'a pas encore défini ses préférences de suivi'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="mb-2">
                <span className="text-sm text-gray-700 font-semibold block mb-1">Date</span>
                {client.trackingConsentDate ? (
                  <p className="font-semibold text-gray-900 text-sm">
                    {new Date(client.trackingConsentDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    Non disponible
                  </p>
                )}
              </div>
              {client.trackingConsentDate && (
                <p className="text-xs text-gray-500">
                  Dernière modification
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes internes */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mt-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Notes internes</h3>
                <p className="text-xs text-gray-600 mt-0.5">Notes privées visibles uniquement par les administrateurs</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Ajoutez des notes internes sur ce client..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
              rows={6}
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {client?.updatedAt && internalNotes && (
                  <>Dernière modification : {formatDate(client.updatedAt)}</>
                )}
              </p>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold text-sm hover:from-amber-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingNotes ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Enregistrer les notes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

