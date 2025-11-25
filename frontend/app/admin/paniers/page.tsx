'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { cartsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminCartsPage() {
  const router = useRouter();
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [changingStatus, setChangingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadCarts();
  }, [statusFilter]);

  const loadCarts = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await cartsApi.getAll(params);
      setCarts(res.data.carts || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (cartId: string, newStatus: string) => {
    setChangingStatus(cartId);
    try {
      await cartsApi.updateStatus(cartId, newStatus);
      toast.success('Statut modifié avec succès');
      loadCarts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setChangingStatus(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'demande':
        return {
          label: 'Demande',
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'traité':
        return {
          label: 'Traité',
          color: 'blue',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'fini':
        return {
          label: 'Fini',
          color: 'green',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-300',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'annulé':
        return {
          label: 'Annulé',
          color: 'red',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-300',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
      default:
        return {
          label: status,
          color: 'gray',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          icon: null
        };
    }
  };

  const statusOptions = [
    { value: 'demande', label: 'Demande' },
    { value: 'traité', label: 'Traité' },
    { value: 'fini', label: 'Fini' },
    { value: 'annulé', label: 'Annulé' }
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des paniers</h1>
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Tous les statuts</option>
            <option value="demande">Demande</option>
            <option value="traité">Traité</option>
            <option value="fini">Fini</option>
            <option value="annulé">Annulé</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      ) : carts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucun panier</h3>
            <p className="text-gray-600">
              {statusFilter 
                ? `Aucun panier avec le statut "${getStatusLabel(statusFilter)}"` 
                : 'Aucun panier pour le moment'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {carts.map((cart) => {
            const statusConfig = getStatusConfig(cart.status);
            return (
              <div 
                key={cart._id} 
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Header avec gradient selon le statut */}
                <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-b-2 px-6 py-4`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-12 h-12 ${statusConfig.bgColor} ${statusConfig.borderColor} border-2 rounded-xl flex items-center justify-center ${statusConfig.textColor}`}>
                          {statusConfig.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Panier #{cart._id.slice(-8)}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                              {statusConfig.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(cart.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link 
                          href={`/admin/clients/${cart.user._id || cart.user}`}
                          className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {cart.user?.firstName} {cart.user?.lastName}
                        </Link>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{cart.user?.email}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-green-600 mb-1">{cart.total.toFixed(2)} €</p>
                      <p className="text-sm text-gray-500 font-medium">{cart.items.length} article{cart.items.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6">
                  {/* Articles */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Articles</h4>
                    <div className="space-y-3">
                      {cart.items.map((item: any, index: number) => {
                        const productImage = item.product?.images?.find((img: any) => img.isPrimary) || item.product?.images?.[0];
                        return (
                          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            {productImage && (
                              <img
                                src={`http://localhost:5000${productImage.url}`}
                                alt={item.product?.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {item.product?.name || 'Produit supprimé'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.product?.brand || ''} • Quantité: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">
                                {(item.price * item.quantity).toFixed(2)} €
                              </p>
                              <p className="text-xs text-gray-500">{item.price.toFixed(2)} € / unité</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  {cart.notes && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Notes du client
                      </h4>
                      <p className="text-sm text-blue-800">{cart.notes}</p>
                    </div>
                  )}

                  {/* Changement de statut - Design moderne */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-3">Changer le statut</label>
                        <div className="flex flex-wrap gap-2">
                          {statusOptions.map((option) => {
                            const optionConfig = getStatusConfig(option.value);
                            const isActive = cart.status === option.value;
                            const isChanging = changingStatus === cart._id;
                            
                            return (
                              <button
                                key={option.value}
                                onClick={() => !isActive && handleStatusChange(cart._id, option.value)}
                                disabled={isChanging || isActive}
                                className={`
                                  relative px-4 py-2.5 rounded-xl font-semibold text-sm
                                  transition-all duration-300 transform
                                  ${isActive 
                                    ? `${optionConfig.bgColor} ${optionConfig.textColor} border-2 ${optionConfig.borderColor} cursor-default scale-105 shadow-md` 
                                    : `bg-white border-2 border-gray-200 text-gray-700 hover:scale-105 active:scale-95`
                                  }
                                  ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                  flex items-center gap-2
                                  ${!isActive && optionConfig.color === 'yellow' ? 'hover:border-yellow-300 hover:bg-yellow-50' : ''}
                                  ${!isActive && optionConfig.color === 'blue' ? 'hover:border-blue-300 hover:bg-blue-50' : ''}
                                  ${!isActive && optionConfig.color === 'green' ? 'hover:border-green-300 hover:bg-green-50' : ''}
                                  ${!isActive && optionConfig.color === 'red' ? 'hover:border-red-300 hover:bg-red-50' : ''}
                                `}
                              >
                                {isActive && (
                                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                                )}
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
                      <Link
                        href={`/admin/clients/${cart.user._id || cart.user}`}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Voir le client
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

