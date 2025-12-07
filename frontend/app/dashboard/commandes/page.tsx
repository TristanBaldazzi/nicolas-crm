'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cartsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getImageUrl } from '@/lib/config';
import toast from 'react-hot-toast';

export default function CommandesPage() {
  const router = useRouter();
  const { user, loadFromStorage, isLoading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await cartsApi.getMyOrders();
      // Les commandes sont déjà triées par date de création (plus récent en premier) depuis le backend
      setOrders(res.data || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
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

  const getProgressSteps = (status: string) => {
    const steps = [
      { label: 'En cours', completed: false, active: false },
      { label: 'Demande', completed: false, active: false },
      { label: 'Traité', completed: false, active: false }
    ];

    if (status === 'en_cours') {
      steps[0].active = true;
      steps[0].completed = true;
    } else if (status === 'demande') {
      steps[0].completed = true;
      steps[1].active = true;
      steps[1].completed = true;
    } else if (status === 'traité') {
      steps[0].completed = true;
      steps[1].completed = true;
      steps[2].completed = true;
      steps[2].active = true;
    }

    return steps;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Afficher un loader pendant le chargement de l'auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-4xl md:text-5xl font-black">
                Historique de vos commandes
              </h1>
            </div>
            <p className="text-xl text-green-100">
              Consultez toutes vos commandes passées
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune commande</h3>
                <p className="text-gray-600 mb-8">Vous n'avez pas encore passé de commande.</p>
                <Link
                  href="/catalogue"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Découvrir le catalogue
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const totalItems = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
                  const totalPrice = order.items?.reduce((sum: number, item: any) => {
                    const price = item.product?.price || item.price || 0;
                    return sum + (price * (item.quantity || 0));
                  }, 0) || 0;

                  const progressSteps = getProgressSteps(order.status);
                  const showProgress = order.status === 'en_cours' || order.status === 'demande' || order.status === 'traité';

                  return (
                    <div key={order._id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Header */}
                      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-900">
                                Commande #{order._id.slice(-8).toUpperCase()}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                              {formatDate(order.createdAt)}
                            </p>
                            
                            {/* Indicateur de progression professionnel */}
                            {showProgress && (
                              <div className="mt-6">
                                <div className="relative">
                                  {/* Barre de progression de fond */}
                                  <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>
                                  
                                  {/* Barre de progression active */}
                                  <div 
                                    className="absolute top-5 left-0 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                                    style={{
                                      width: order.status === 'en_cours' ? '0%' : 
                                             order.status === 'demande' ? '50%' : '100%'
                                    }}
                                  ></div>
                                  
                                  {/* Étapes */}
                                  <div className="relative flex items-start justify-between">
                                    {progressSteps.map((step, index) => (
                                      <div key={index} className="flex flex-col items-center flex-1">
                                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-300 ${
                                          step.completed
                                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white scale-110'
                                            : step.active
                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white scale-110 ring-4 ring-blue-200'
                                            : 'bg-white border-2 border-gray-300 text-gray-400'
                                        }`}>
                                          {step.completed ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                          ) : step.active ? (
                                            <span className="text-white font-bold">{index + 1}</span>
                                          ) : (
                                            <span className="text-gray-400 font-semibold">{index + 1}</span>
                                          )}
                                        </div>
                                        <div className="mt-3 text-center">
                                          <p className={`text-xs font-semibold ${
                                            step.completed || step.active
                                              ? 'text-gray-900'
                                              : 'text-gray-400'
                                          }`}>
                                            {step.label}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right md:text-left md:min-w-[120px]">
                            <p className="text-2xl font-bold text-gray-900 mb-1">
                              {totalPrice.toFixed(2)} €
                            </p>
                            <p className="text-sm text-gray-500">
                              {totalItems} {totalItems > 1 ? 'articles' : 'article'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="p-6">
                        <div className="space-y-4">
                          {order.items?.map((item: any, idx: number) => {
                            const product = item.product;
                            const quantity = item.quantity || 0;
                            const price = product?.price || item.price || 0;
                            const subtotal = price * quantity;

                            return (
                              <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                {product?.images?.[0] && (
                                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                      src={getImageUrl(product.images[0].url)}
                                      alt={product.images[0].alt || product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <Link
                                    href={`/produit/${product?.slug || '#'}`}
                                    className="font-semibold text-gray-900 hover:text-green-600 transition-colors block mb-1"
                                  >
                                    {product?.name || 'Produit supprimé'}
                                  </Link>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>Quantité: {quantity}</span>
                                    <span>Prix unitaire: {price.toFixed(2)} €</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900">
                                    {subtotal.toFixed(2)} €
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {order.notes && (
                          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Notes:</p>
                            <p className="text-sm text-blue-700">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

