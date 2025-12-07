'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { companiesApi, authApi, cartsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import CustomSelect from '@/components/CustomSelect';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [company, setCompany] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'LU',
    phone: '',
    email: '',
    vatNumber: '',
    notes: '',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [companyRes, membersRes, usersRes] = await Promise.all([
        companiesApi.getById(id),
        companiesApi.getMembers(id),
        authApi.getUsers({ limit: 1000 })
      ]);
      setCompany(companyRes.data);
      setMembers(membersRes.data.members || []);
      
      // Filtrer les utilisateurs qui ne sont pas déjà membres
      const memberIds = (membersRes.data.members || []).map((m: any) => m._id || m.id);
      const availableUsers = (usersRes.data.users || []).filter(
        (u: any) => !memberIds.includes(u._id || u.id)
      );
      setAllUsers(availableUsers);
      
      if (companyRes.data) {
        setFormData({
          name: companyRes.data.name || '',
          code: companyRes.data.code || '',
          address: companyRes.data.address || '',
          city: companyRes.data.city || '',
          postalCode: companyRes.data.postalCode || '',
          country: companyRes.data.country || 'LU',
          phone: companyRes.data.phone || '',
          email: companyRes.data.email || '',
          vatNumber: companyRes.data.vatNumber || '',
          notes: companyRes.data.notes || '',
          isActive: companyRes.data.isActive !== undefined ? companyRes.data.isActive : true
        });
      }
      
      // Charger les commandes de l'entreprise
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du chargement');
      router.push('/admin/entreprises');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await cartsApi.getCompanyOrders(id);
      setOrders(res.data.carts || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'traité':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'en_cours':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'annulé':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'demande':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'traité':
        return 'Traité';
      case 'en_cours':
        return 'En cours';
      case 'annulé':
        return 'Annulée';
      case 'demande':
      default:
        return 'En attente';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await companiesApi.update(id, formData);
      toast.success('Entreprise modifiée avec succès');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }
    try {
      await authApi.updateUser(selectedUserId, { company: id });
      toast.success('Membre ajouté avec succès');
      setShowAddMemberModal(false);
      setSelectedUserId('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajout');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'entreprise ?')) {
      return;
    }
    try {
      await authApi.updateUser(userId, { company: null });
      toast.success('Membre retiré avec succès');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

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

  if (!company) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Entreprise non trouvée</p>
          <Link href="/admin/entreprises" className="text-green-600 hover:underline mt-4 inline-block">
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
          href="/admin/entreprises"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la liste des entreprises
        </Link>
        <h1 className="text-4xl font-black text-gray-900">
          {company.name}
        </h1>
        <p className="text-gray-600 mt-2">Détails et gestion de l'entreprise</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulaire d'édition */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations de l'entreprise</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Pays
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Numéro TVA
                </label>
                <input
                  type="text"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  rows={3}
                />
              </div>

              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-6 h-6 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer transition-all"
                    />
                    {formData.isActive && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-base font-bold text-gray-900 block">Entreprise active</span>
                    <span className="text-xs text-gray-600 mt-0.5">
                      {formData.isActive ? 'L\'entreprise est actuellement active' : 'L\'entreprise est actuellement inactive'}
                    </span>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    formData.isActive
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </div>
                </label>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>

          {/* Commandes de l'entreprise */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Commandes de l'entreprise</h2>
              {orders.length > 1 && (
                <Link
                  href={`/admin/entreprises/${id}/commandes`}
                  className="text-green-600 hover:text-green-700 font-semibold text-sm flex items-center gap-2"
                >
                  Voir toutes les commandes
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
            
            {loadingOrders ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
                <p className="mt-4 text-gray-600">Chargement des commandes...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Aucune commande pour cette entreprise</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <div
                    key={order._id}
                    className="border-2 border-gray-100 rounded-xl p-6 hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-900">
                            Commande #{order._id.slice(-8).toUpperCase()}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.user && (
                            <>
                              Par {order.user.firstName} {order.user.lastName} ({order.user.email})
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {order.total?.toFixed(2) || '0.00'} €
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.items?.length || 0} article(s)
                        </p>
                      </div>
                    </div>
                    
                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="space-y-2">
                          {order.items.slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">
                                {item.product?.name || 'Produit supprimé'} × {item.quantity}
                              </span>
                              <span className="text-gray-600">
                                {(item.price * item.quantity).toFixed(2)} €
                              </span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-gray-500 mt-2">
                              + {order.items.length - 3} autre(s) article(s)
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {order.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Notes:</span> {order.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {orders.length > 3 && (
                  <div className="pt-4 border-t border-gray-200 text-center">
                    <Link
                      href={`/admin/entreprises/${id}/commandes`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                    >
                      Voir toutes les commandes ({orders.length})
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Liste des membres */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Membres de l'entreprise</h2>
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un membre
              </button>
            </div>

            {members.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Aucun membre dans cette entreprise</p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member._id || member.id}
                    className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                        <span className="text-xl font-black text-white">
                          {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/admin/clients/${member._id || member.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                      >
                        Voir profil
                      </Link>
                      <button
                        onClick={() => handleRemoveMember(member._id || member.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar avec informations */}
        <div className="space-y-6">
          {/* Carte entreprise */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {company.name}
              </h3>
              {company.code && (
                <p className="text-gray-600 mt-1">Code: {company.code}</p>
              )}
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Statut</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  company.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {company.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Membres</span>
                <span className="font-bold text-gray-900">
                  {members.length}
                </span>
              </div>
              {company.email && (
                <div>
                  <span className="text-gray-600 text-sm">Email</span>
                  <p className="font-semibold text-gray-900 mt-1">{company.email}</p>
                </div>
              )}
              {company.phone && (
                <div>
                  <span className="text-gray-600 text-sm">Téléphone</span>
                  <p className="font-semibold text-gray-900 mt-1">{company.phone}</p>
                </div>
              )}
              {(company.city || company.postalCode) && (
                <div>
                  <span className="text-gray-600 text-sm">Adresse</span>
                  <p className="font-semibold text-gray-900 mt-1">
                    {company.postalCode} {company.city}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Informations système */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Informations système</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Date de création</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {company.createdAt ? new Date(company.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Dernière modification</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {company.updatedAt ? new Date(company.updatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'ajout de membre */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Ajouter un membre</h2>
            </div>
            <div className="mb-6">
              <label className="block mb-3 font-semibold text-gray-700">Sélectionner un utilisateur</label>
              <CustomSelect
                options={[
                  { value: '', label: 'Sélectionner un utilisateur' },
                  ...allUsers.map((user) => ({
                    value: user._id || user.id,
                    label: `${user.firstName} ${user.lastName} (${user.email})`,
                  })),
                ]}
                value={selectedUserId}
                onChange={(value) => setSelectedUserId(value)}
                placeholder="Sélectionner un utilisateur"
                searchable={true}
                className="shadow-sm hover:shadow-md focus-within:shadow-lg"
              />
            </div>
            {allUsers.length === 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800 font-semibold">
                  Tous les utilisateurs sont déjà membres de cette entreprise ou d'une autre.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedUserId('');
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMember}
                disabled={!selectedUserId || allUsers.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter le membre
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}


