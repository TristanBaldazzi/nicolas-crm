'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { customQuotesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

function AdminDemandesPersonnaliseesPageContent() {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  // Sélectionner automatiquement la demande depuis l'URL
  useEffect(() => {
    const requestId = searchParams.get('requestId');
    if (requestId && requests.length > 0) {
      const request = requests.find((req) => req._id === requestId);
      if (request) {
        setSelectedRequest(request);
        // Ajuster le filtre si nécessaire pour que la demande soit visible
        if (filter === 'unread' && request.isRead) {
          setFilter('all');
        } else if (filter === 'read' && !request.isRead) {
          setFilter('all');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, searchParams]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await customQuotesApi.getAll();
      setRequests(res.data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des demandes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await customQuotesApi.markAsRead(id);
      toast.success('Demande marquée comme traitée');
      loadRequests();
      if (selectedRequest && selectedRequest._id === id) {
        setSelectedRequest({ ...selectedRequest, isRead: true });
      }
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    try {
      await customQuotesApi.markAsUnread(id);
      toast.success('Demande marquée comme non traitée');
      loadRequests();
      if (selectedRequest && selectedRequest._id === id) {
        setSelectedRequest({ ...selectedRequest, isRead: false });
      }
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleCreateCartFromSuggestions = async (id: string) => {
    try {
      const res = await customQuotesApi.createCartFromSuggestions(id);
      toast.success('Panier créé avec succès');
      // Recharger toutes les demandes
      await loadRequests();
      // Recharger la demande sélectionnée pour voir le panier créé
      if (selectedRequest && selectedRequest._id === id) {
        const updatedRequestRes = await customQuotesApi.getById(id);
        setSelectedRequest(updatedRequestRes.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création du panier');
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'unread') return !req.isRead;
    if (filter === 'read') return req.isRead;
    return true;
  });

  const unreadCount = requests.filter((req) => !req.isRead).length;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600 mb-4"></div>
            <p className="text-gray-600">Chargement des demandes...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Demandes d'offres personnalisées</h1>
          <p className="text-gray-600">
            {requests.length} demande{requests.length > 1 ? 's' : ''} au total
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                {unreadCount} non traité{unreadCount > 1 ? 'es' : 'e'}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'all'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Toutes ({requests.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'unread'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Non traitées ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'read'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Traitées ({requests.length - unreadCount})
        </button>
      </div>

      {/* Liste des demandes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste */}
        <div className="lg:col-span-1 space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500">Aucune demande</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request._id}
                onClick={async () => {
                  // Recharger la demande complète avec toutes les données
                  try {
                    const res = await customQuotesApi.getById(request._id);
                    setSelectedRequest(res.data);
                  } catch (error) {
                    // Si erreur, utiliser les données de base
                    setSelectedRequest(request);
                  }
                }}
                className={`bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedRequest?._id === request._id
                    ? 'border-amber-500'
                    : request.isRead
                    ? 'border-gray-200'
                    : 'border-red-300'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">
                        {request.firstName} {request.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{request.email}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {request.aiSuggestions && request.aiSuggestions.suggestedProducts && request.aiSuggestions.suggestedProducts.length > 0 && (
                        <span className="flex-shrink-0 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          IA
                        </span>
                      )}
                      {!request.isRead && (
                        <span className="ml-2 flex-shrink-0 w-3 h-3 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">{request.message}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(request.createdAt)}</span>
                    {request.autoCreatedCart && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Panier créé
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Détails de la demande */}
        <div className="lg:col-span-2">
          {selectedRequest ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* En-tête */}
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedRequest.firstName} {selectedRequest.lastName}
                    </h2>
                    {!selectedRequest.isRead && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        Non traité
                      </span>
                    )}
                    {selectedRequest.isRead && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Traité
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-semibold">Email:</span> {selectedRequest.email}
                    </p>
                    {selectedRequest.phone && (
                      <p>
                        <span className="font-semibold">Téléphone:</span> {selectedRequest.phone}
                      </p>
                    )}
                    {selectedRequest.user && (
                      <p>
                        <span className="font-semibold">Compte:</span> Utilisateur connecté
                        {typeof selectedRequest.user === 'object' && selectedRequest.user.company && selectedRequest.user.company.name && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({selectedRequest.user.company.name})
                          </span>
                        )}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Date:</span> {formatDate(selectedRequest.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {!selectedRequest.isRead ? (
                    <button
                      onClick={() => handleMarkAsRead(selectedRequest._id)}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors"
                    >
                      Marquer comme traité
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkAsUnread(selectedRequest._id)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Marquer non traité
                    </button>
                  )}
                  {selectedRequest.user && (
                    <Link
                      href={`/admin/clients/${typeof selectedRequest.user === 'object' && selectedRequest.user._id ? selectedRequest.user._id : selectedRequest.user}`}
                      className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Voir le profil
                    </Link>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Demande</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.message}</p>
                </div>
              </div>

              {/* Suggestions IA */}
              {selectedRequest.aiSuggestions && selectedRequest.aiSuggestions.suggestedProducts && selectedRequest.aiSuggestions.suggestedProducts.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Suggestions IA
                    </h3>
                    {selectedRequest.user && !selectedRequest.autoCreatedCart && (
                      <button
                        onClick={() => handleCreateCartFromSuggestions(selectedRequest._id)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg"
                      >
                        Créer le panier
                      </button>
                    )}
                    {selectedRequest.autoCreatedCart && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        Panier créé
                      </span>
                    )}
                  </div>
                  
                  {selectedRequest.aiSuggestions.summary && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-purple-900">{selectedRequest.aiSuggestions.summary}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {selectedRequest.aiSuggestions.suggestedProducts.map((suggestion: any, index: number) => (
                      <div
                        key={index}
                        className="bg-white border-2 border-purple-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {suggestion.product && typeof suggestion.product === 'object' ? (
                              <>
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-bold text-gray-900">{suggestion.product.name}</h4>
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                    Quantité: {suggestion.quantity || 1}
                                  </span>
                                </div>
                                {suggestion.product.brand && typeof suggestion.product.brand === 'object' && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    Marque: {suggestion.product.brand.name}
                                  </p>
                                )}
                                {suggestion.product.price && (
                                  <p className="text-sm font-semibold text-gray-900 mb-2">
                                    Prix: {(suggestion.product.price * (suggestion.quantity || 1)).toFixed(2)} €
                                  </p>
                                )}
                                {suggestion.reason && (
                                  <p className="text-sm text-gray-600 italic mt-2">
                                    "{suggestion.reason}"
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                <h4 className="font-bold text-gray-900 mb-2">Produit ID: {suggestion.product}</h4>
                                <p className="text-sm text-gray-600">
                                  Quantité: {suggestion.quantity || 1}
                                </p>
                                {suggestion.reason && (
                                  <p className="text-sm text-gray-600 italic mt-2">
                                    "{suggestion.reason}"
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedRequest.aiSuggestions.analyzedAt && (
                    <p className="text-xs text-gray-500 mt-3">
                      Analysé le {new Date(selectedRequest.aiSuggestions.analyzedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Panier créé automatiquement */}
              {selectedRequest.autoCreatedCart && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Panier créé automatiquement
                  </h3>
                  {typeof selectedRequest.autoCreatedCart === 'object' ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-900 mb-2">
                        <span className="font-semibold">Statut:</span> {selectedRequest.autoCreatedCart.status}
                      </p>
                      <p className="text-sm text-green-900 mb-2">
                        <span className="font-semibold">Total:</span> {selectedRequest.autoCreatedCart.total?.toFixed(2) || '0.00'} €
                      </p>
                      <Link
                        href={`/admin/paniers/${selectedRequest.autoCreatedCart._id}`}
                        className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-800 font-semibold"
                      >
                        Voir le panier
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <Link
                        href={`/admin/paniers/${selectedRequest.autoCreatedCart}`}
                        className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-800 font-semibold"
                      >
                        Voir le panier
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500">Sélectionnez une demande pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminDemandesPersonnaliseesPage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600 mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    }>
      <AdminDemandesPersonnaliseesPageContent />
    </Suspense>
  );
}




