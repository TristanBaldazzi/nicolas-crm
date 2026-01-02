'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { cartsApi, productsApi, authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/config';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  brand?: { name: string } | string;
  sku?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

export default function CreateClientCartPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasActiveCart, setHasActiveCart] = useState(false);
  const [activeCart, setActiveCart] = useState<any>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [replaceActive, setReplaceActive] = useState(false);

  useEffect(() => {
    loadClient();
    loadProducts();
    checkActiveCart();
  }, [clientId]);

  const loadClient = async () => {
    try {
      const res = await authApi.getUserById(clientId);
      setClient(res.data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement du client');
      router.push('/admin/clients');
    }
  };

  const checkActiveCart = async () => {
    try {
      const res = await cartsApi.getUserActiveCart(clientId);
      if (res.data.hasActiveCart && res.data.cart) {
        setHasActiveCart(true);
        setActiveCart(res.data.cart);
        setShowWarningModal(true);
      }
    } catch (error: any) {
      console.error('Error checking active cart:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (search) params.search = search;
      const res = await productsApi.getAll(params);
      setProducts(res.data.products || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.product._id === product._id);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.product._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        product,
        quantity: 1,
        price: product.price
      }]);
    }
    toast.success('Produit ajouté au panier');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(cartItems.map(item =>
      item.product._id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.product._id !== productId));
    toast.success('Produit retiré du panier');
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      toast.error('Le panier doit contenir au moins un produit');
      return;
    }

    setSubmitting(true);
    try {
      const items = cartItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      }));

      await cartsApi.createForUser(clientId, {
        items,
        notes,
        replaceActive: replaceActive || hasActiveCart
      });

      toast.success('Panier créé avec succès');
      router.push(`/admin/clients/${clientId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création du panier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueWithWarning = () => {
    setReplaceActive(true);
    setShowWarningModal(false);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/clients/${clientId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au client
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Créer un panier</h1>
              <p className="text-gray-600 mt-1">
                {client && `Pour ${client.firstName} ${client.lastName} (${client.email})`}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Liste des produits */}
          <div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <p className="text-gray-600 mt-4">Chargement des produits...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Aucun produit trouvé</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all"
                    >
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.images && product.images.length > 0 && product.images[0]?.url ? (
                          <img
                            src={getImageUrl(product.images[0].url)}
                            alt={product.images[0].alt || product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {typeof product.brand === 'object' && product.brand !== null
                            ? product.brand.name
                            : product.brand || 'Sans marque'}
                        </p>
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          {(() => {
                            const priceHTVA = product.price;
                            const priceTVA = priceHTVA * 1.17;
                            return (
                              <>
                                <div className="text-xs text-gray-500">HTVA: {priceHTVA.toFixed(2)} €</div>
                                <div className="text-sm font-semibold text-green-600">TVA: {priceTVA.toFixed(2)} €</div>
                              </>
                            );
                          })()}
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex-shrink-0"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panier */}
          <div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-6">Panier</h2>

              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-600">Le panier est vide</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.product._id} className="bg-white border border-gray-200 rounded-lg p-2.5 hover:border-green-300 hover:shadow-md transition-all overflow-hidden">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Image produit */}
                          <div className="relative w-14 h-14 rounded-md overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-200">
                            {item.product.images && item.product.images.length > 0 && item.product.images[0]?.url ? (
                              <img
                                src={getImageUrl(item.product.images[0].url)}
                                alt={item.product.images[0].alt || item.product.name}
                                className="w-full h-full object-contain p-0.5"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Prix */}
                          <div className="flex-shrink-0">
                            <div className="bg-green-50 rounded-md px-2 py-1 border border-green-200">
                              <p className="text-xs font-bold text-green-700 whitespace-nowrap">
                                {(() => {
                                  const priceHTVA = item.price;
                                  const priceTVA = priceHTVA * 1.17;
                                  return (
                                    <>
                                      <div className="text-xs text-gray-500">HTVA: {priceHTVA.toFixed(2)} €</div>
                                      <div className="text-sm font-semibold text-green-600">TVA: {priceTVA.toFixed(2)} €</div>
                                    </>
                                  );
                                })()}
                              </p>
                            </div>
                          </div>

                          {/* Espace flexible */}
                          <div className="flex-1 min-w-0"></div>

                          {/* Contrôles quantité */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors font-semibold text-gray-700 text-xs"
                              type="button"
                              aria-label="Diminuer la quantité"
                            >
                              −
                            </button>
                            <div className="w-8 h-7 flex items-center justify-center bg-white border border-gray-300 rounded font-bold text-xs text-gray-900">
                              {item.quantity}
                            </div>
                            <button
                              onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors font-semibold text-gray-700 text-xs"
                              type="button"
                              aria-label="Augmenter la quantité"
                            >
                              +
                            </button>
                          </div>

                          {/* Bouton suppression */}
                          <button
                            onClick={() => removeFromCart(item.product._id)}
                            className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded transition-all flex-shrink-0 border border-red-300 hover:border-red-600"
                            title="Supprimer"
                            type="button"
                            aria-label="Supprimer le produit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Notes (optionnel)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all resize-none"
                        rows={3}
                        placeholder="Ajouter des notes pour ce panier..."
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <div className="text-right">
                        <span className="text-xl font-black text-green-600">
                          {(() => {
                            const totalHTVA = getTotal();
                            const totalTVA = totalHTVA * 1.17;
                            return (
                              <>
                                <div className="text-xs text-gray-500">HTVA: {totalHTVA.toFixed(2)} €</div>
                                <div className="text-lg font-bold text-green-600">TVA: {totalTVA.toFixed(2)} €</div>
                              </>
                            );
                          })()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Création...' : 'Créer le panier'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'avertissement */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-white">Attention</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Ce client a déjà un panier en cours avec <strong>{activeCart?.items?.length || 0} article(s)</strong> 
                d'une valeur de <strong>{(() => {
                  const totalHTVA = activeCart?.total || 0;
                  const totalTVA = totalHTVA * 1.17;
                  return `${totalHTVA.toFixed(2)} € HTVA (${totalTVA.toFixed(2)} € TVA)`;
                })()}</strong>.
              </p>
              <p className="text-gray-700 font-semibold mb-6">
                Si vous continuez, ce panier sera <span className="text-red-600 font-bold">écrasé</span> et remplacé par le nouveau panier.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWarningModal(false);
                    router.push(`/admin/clients/${clientId}`);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleContinueWithWarning}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
                >
                  Continuer quand même
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

