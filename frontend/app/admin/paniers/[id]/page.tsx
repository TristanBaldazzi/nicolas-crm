'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { cartsApi } from '@/lib/api';
import { getImageUrl } from '@/lib/config';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    loadCart();
  }, [id]);

  const loadCart = async () => {
    try {
      const res = await cartsApi.getById(id);
      setCart(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du chargement');
      router.push('/admin/paniers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      await cartsApi.updateStatus(id, newStatus);
      toast.success('Statut modifié avec succès');
      loadCart();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setChangingStatus(false);
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  if (!cart) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Panier non trouvé</p>
          <Link href="/admin/paniers" className="text-green-600 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const statusConfig = getStatusConfig(cart.status);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/paniers"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la liste des paniers
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              Panier #{cart._id.slice(-8)}
            </h1>
            <p className="text-gray-600 mt-2">Détails du panier de commande</p>
          </div>
          <div className={`px-4 py-2 rounded-xl border-2 ${statusConfig.bgColor} ${statusConfig.borderColor} flex items-center gap-2`}>
            {statusConfig.icon}
            <span className={`font-bold ${statusConfig.textColor}`}>{statusConfig.label}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Articles */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Articles du panier</h2>
            <div className="space-y-4">
              {cart.items.map((item: any, index: number) => {
                const productImage = item.product?.images?.find((img: any) => img.isPrimary) || item.product?.images?.[0];
                return (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    {productImage && (
                      <img
                        src={getImageUrl(productImage.url)}
                        alt={item.product?.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-lg">
                        {item.product?.name || 'Produit supprimé'}
                      </p>
                      {item.product?.brand && (
                        <p className="text-sm text-gray-500 mt-1">{item.product.brand}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">
                        Quantité: <span className="font-semibold">{item.quantity}</span> • 
                        Prix unitaire: <span className="font-semibold">{item.price.toFixed(2)} €</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-green-600">
                        {(item.price * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-3xl font-black text-green-600">{cart.total.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {cart.notes && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes du client
              </h2>
              <p className="text-gray-700 whitespace-pre-line bg-blue-50 p-4 rounded-lg border border-blue-200">
                {cart.notes}
              </p>
            </div>
          )}

          {/* Changement de statut */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Changer le statut</h2>
            <div className="flex flex-wrap gap-3">
              {statusOptions.map((option) => {
                const optionConfig = getStatusConfig(option.value);
                const isActive = cart.status === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => !isActive && handleStatusChange(option.value)}
                    disabled={changingStatus || isActive}
                    className={`
                      relative px-6 py-3 rounded-xl font-semibold text-sm
                      transition-all duration-300 transform
                      ${isActive 
                        ? `${optionConfig.bgColor} ${optionConfig.textColor} border-2 ${optionConfig.borderColor} cursor-default scale-105 shadow-md` 
                        : `bg-white border-2 border-gray-200 text-gray-700 hover:scale-105 active:scale-95`
                      }
                      ${changingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      flex items-center gap-2
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations client */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Client</h3>
            {cart.user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-black text-white">
                      {cart.user.firstName?.charAt(0)}{cart.user.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {cart.user.firstName} {cart.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{cart.user.email}</p>
                  </div>
                </div>
                <Link
                  href={`/admin/clients/${cart.user._id || cart.user}`}
                  className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Voir le profil
                </Link>
              </div>
            ) : (
              <p className="text-gray-500 italic">Utilisateur supprimé</p>
            )}
          </div>

          {/* Informations panier */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Informations</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">ID Panier</span>
                <p className="font-mono text-xs text-gray-500 mt-1 break-all">{cart._id}</p>
              </div>
              <div>
                <span className="text-gray-600">Date de création</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {new Date(cart.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Dernière modification</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {new Date(cart.updatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Nombre d'articles</span>
                <p className="font-semibold text-gray-900 mt-1">{cart.items.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

