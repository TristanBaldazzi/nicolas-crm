'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { cartsApi, productsApi } from '@/lib/api';
import { getImageUrl } from '@/lib/config';
import toast from 'react-hot-toast';
import Link from 'next/link';
import CustomSelect from '@/components/CustomSelect';

export default function CartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editableItems, setEditableItems] = useState<any[]>([]);
  const [editableNotes, setEditableNotes] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newProductId, setNewProductId] = useState('');

  useEffect(() => {
    loadCart();
  }, [id]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const res = await cartsApi.getById(id);
      
      if (!res || !res.data) {
        throw new Error('Réponse invalide du serveur');
      }
      
      const cartData = res.data;
      
      if (!cartData) {
        throw new Error('Panier non trouvé');
      }
      
      setCart(cartData);
      
      // Gérer les items du panier de manière sécurisée
      if (cartData.items && Array.isArray(cartData.items)) {
        setEditableItems(cartData.items.map((item: any) => {
          // Gérer différents formats de product (peuplé ou non)
          let productId;
          if (item.product) {
            if (typeof item.product === 'object' && item.product._id) {
              productId = item.product._id;
            } else if (typeof item.product === 'string') {
              productId = item.product;
            } else {
              productId = item.product;
            }
          }
          
          return {
            product: productId,
            quantity: item.quantity || 1,
            price: item.price || 0
          };
        }));
      } else {
        setEditableItems([]);
      }
      
      setEditableNotes(cartData.notes || '');
    } catch (error: any) {
      console.error('Error loading cart:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors du chargement';
      toast.error(errorMessage);
      // Ne pas rediriger immédiatement, laisser l'utilisateur voir l'erreur
      setTimeout(() => {
        router.push('/admin/paniers');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await productsApi.getAll({ limit: 1000 });
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (isEditing) {
      loadProducts();
    }
  }, [isEditing]);

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

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    loadCart(); // Recharger pour annuler les modifications
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updated = [...editableItems];
    updated[index].quantity = newQuantity;
    setEditableItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = editableItems.filter((_, i) => i !== index);
    setEditableItems(updated);
  };

  const handleAddProduct = () => {
    if (!newProductId) return;
    const product = products.find(p => p._id === newProductId);
    if (!product) return;
    
    // Vérifier si le produit est déjà dans le panier
    const existingIndex = editableItems.findIndex(item => item.product === newProductId);
    if (existingIndex >= 0) {
      handleUpdateQuantity(existingIndex, editableItems[existingIndex].quantity + 1);
    } else {
      setEditableItems([...editableItems, {
        product: newProductId,
        quantity: 1,
        price: product.price
      }]);
    }
    setNewProductId('');
  };

  const handleSave = async () => {
    if (editableItems.length === 0) {
      toast.error('Le panier doit contenir au moins un produit');
      return;
    }

    setSaving(true);
    try {
      await cartsApi.update(id, {
        items: editableItems.map(item => ({
          product: item.product,
          quantity: item.quantity
        })),
        notes: editableNotes
      });
      toast.success('Panier modifié avec succès');
      setIsEditing(false);
      loadCart();
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
          <div className="flex items-center gap-4">
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier le panier
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            )}
            <div className={`px-4 py-2 rounded-xl border-2 ${statusConfig.bgColor} ${statusConfig.borderColor} flex items-center gap-2`}>
              {statusConfig.icon}
              <span className={`font-bold ${statusConfig.textColor}`}>{statusConfig.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Articles */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Articles du panier</h2>
            
            {isEditing && (
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <label className="block text-xs font-bold text-gray-700 mb-2">Ajouter un produit</label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Sélectionner un produit' },
                    ...products
                      .filter(p => !editableItems.some(item => item.product === p._id))
                      .map((product) => ({
                        value: product._id,
                        label: `${product.name}${product.brand?.name ? ` - ${product.brand.name}` : ''} - ${product.price.toFixed(2)} €`,
                      })),
                  ]}
                  value={newProductId}
                  onChange={(value) => {
                    if (value && value !== '') {
                      setNewProductId(value);
                      // Ajouter automatiquement le produit
                      const product = products.find(p => p._id === value);
                      if (product) {
                        const existingIndex = editableItems.findIndex(item => item.product === value);
                        if (existingIndex >= 0) {
                          handleUpdateQuantity(existingIndex, editableItems[existingIndex].quantity + 1);
                        } else {
                          setEditableItems([...editableItems, {
                            product: value,
                            quantity: 1,
                            price: product.price
                          }]);
                        }
                        setNewProductId(''); // Réinitialiser le select
                      }
                    } else {
                      setNewProductId('');
                    }
                  }}
                  placeholder="Rechercher un produit..."
                  searchable={true}
                  className="w-full"
                />
              </div>
            )}

            <div className="space-y-4">
              {((isEditing ? editableItems : (cart.items || [])) || []).map((item: any, index: number) => {
                let product;
                if (isEditing) {
                  product = products.find(p => p._id === item.product);
                } else {
                  // Gérer différents formats de product
                  if (item.product && typeof item.product === 'object') {
                    product = item.product;
                  } else {
                    // Si product n'est pas peuplé, on ne peut pas l'afficher
                    product = null;
                  }
                }
                
                const productImage = product?.images?.find((img: any) => img.isPrimary) || product?.images?.[0];
                const itemPrice = isEditing ? (product?.price || item.price || 0) : (item.price || 0);
                const itemQuantity = isEditing ? item.quantity : (item.quantity || 1);
                
                return (
                  <div key={index} className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isEditing 
                      ? 'bg-white border-gray-200 hover:border-green-300 shadow-sm' 
                      : 'bg-gray-50 border-transparent hover:bg-gray-100'
                  }`}>
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="absolute top-2 right-2 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    {productImage && (
                      <img
                        src={getImageUrl(productImage.url)}
                        alt={product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <p className="font-bold text-gray-900 text-sm truncate pr-8">
                          {product?.name || 'Produit supprimé'}
                        </p>
                        {product?.brand?.name && (
                          <p className="text-xs text-gray-500 mt-0.5">{product.brand.name}</p>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Quantité:</label>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateQuantity(index, itemQuantity - 1)}
                                className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center font-bold text-gray-700 transition-colors text-sm"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={itemQuantity}
                                onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 border-2 border-gray-200 rounded text-center font-semibold text-sm focus:border-green-500 focus:ring-1 focus:ring-green-100 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                onClick={() => handleUpdateQuantity(index, itemQuantity + 1)}
                                className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center font-bold text-gray-700 transition-colors text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded text-xs">
                            <span className="text-gray-600">Prix unitaire:</span>
                            <span className="font-bold text-gray-900">{itemPrice.toFixed(2)} €</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span>Quantité: <span className="font-semibold text-gray-900">{itemQuantity}</span></span>
                          <span>•</span>
                          <span>Prix unitaire: <span className="font-semibold text-gray-900">{itemPrice.toFixed(2)} €</span></span>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-black text-green-600">
                        {(itemPrice * itemQuantity).toFixed(2)} €
                      </p>
                      {isEditing && (
                        <p className="text-xs text-gray-500 mt-0.5">Sous-total</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div>
                  <span className="text-sm font-bold text-gray-700">Total du panier</span>
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-0.5">Les modifications seront enregistrées</p>
                  )}
                </div>
                <span className="text-2xl font-black text-green-700">
                  {isEditing 
                    ? editableItems.reduce((sum, item) => {
                        const product = products.find(p => p._id === item.product);
                        const price = product?.price || item.price || 0;
                        return sum + (price * (item.quantity || 1));
                      }, 0).toFixed(2)
                    : (cart.total || 0).toFixed(2)
                  } €
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Notes du client
            </h2>
            {isEditing ? (
              <textarea
                value={editableNotes}
                onChange={(e) => setEditableNotes(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all min-h-[120px]"
                placeholder="Notes du client..."
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-line bg-blue-50 p-4 rounded-lg border border-blue-200">
                {cart.notes || 'Aucune note'}
              </p>
            )}
          </div>

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

