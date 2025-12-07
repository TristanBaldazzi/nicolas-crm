'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi, settingsApi, authApi, analyticsApi } from '@/lib/api';
import { useCartStore } from '@/lib/cartStore';
import { useAuthStore } from '@/lib/store';
import { getImageUrl } from '@/lib/config';
import { useProductTracking } from '@/lib/useProductTracking';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { addItem, getItems, updateQuantity, removeItem } = useCartStore();
  const { user, isAdmin } = useAuthStore();
  const [cartItem, setCartItem] = useState<{ quantity: number } | null>(null);
  const [hasCheckedCart, setHasCheckedCart] = useState(false);

  useEffect(() => {
    loadSettings();
    loadProduct();
  }, [slug]);

  useEffect(() => {
    if (product && user) {
      checkFavorite();
    }
  }, [product, user]);

  // Tracking de la vue du produit
  useEffect(() => {
    console.log('[ProductPage] État du produit pour tracking:', { 
      hasProduct: !!product, 
      productId: product?._id, 
      productName: product?.name,
      user: user?.id,
      userConsent: user?.trackingConsent 
    });
  }, [product, user]);
  
  useProductTracking(product?._id || null, 'view');

  // Fonction pour vérifier et mettre à jour l'état du panier
  const checkCartItem = useCallback(() => {
    if (product) {
      const items = getItems();
      const item = items.find(item => item.product === product._id);
      if (item) {
        setCartItem({ quantity: item.quantity });
        setQuantity(item.quantity);
      } else {
        setCartItem(null);
        // Ne pas réinitialiser la quantité - laisser l'utilisateur modifier librement
      }
    }
  }, [product, getItems]);

  // Vérifier si le produit est dans le panier (une seule fois au chargement)
  useEffect(() => {
    if (product && !hasCheckedCart) {
      const items = getItems();
      const item = items.find(item => item.product === product._id);
      if (item) {
        setCartItem({ quantity: item.quantity });
        setQuantity(item.quantity);
      } else {
        setCartItem(null);
        setQuantity(1);
      }
      setHasCheckedCart(true);
    }
  }, [product, hasCheckedCart, getItems]);

  // Vérifier périodiquement (pour détecter les changements depuis d'autres onglets)
  // Mais seulement si le produit est déjà dans le panier
  useEffect(() => {
    if (!product) return;
    
    const interval = setInterval(() => {
      const items = getItems();
      const item = items.find(item => item.product === product._id);
      // Si le produit est dans le panier, mettre à jour la quantité
      if (item) {
        setCartItem({ quantity: item.quantity });
        setQuantity(item.quantity);
      } else if (cartItem) {
        // Si le produit était dans le panier mais ne l'est plus, réinitialiser
        setCartItem(null);
        setQuantity(1);
      }
      // Si le produit n'est pas dans le panier et n'y était pas, ne rien faire pour préserver la quantité locale
    }, 2000);
    return () => clearInterval(interval);
  }, [product, getItems, cartItem]);

  const checkFavorite = async () => {
    if (!product || !user) return;
    try {
      const res = await authApi.getFavorites();
      const favoriteIds = res.data.favorites.map((f: any) => f._id);
      setIsFavorite(favoriteIds.includes(product._id));
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  // Fonction helper pour tracker les événements
  const trackEvent = async (eventType: 'cart_add' | 'cart_remove' | 'purchase' | 'favorite_add' | 'favorite_remove') => {
    if (!product) return;
    // Vérifier le consentement - on track si l'utilisateur n'a pas explicitement refusé
    if (user && user.trackingConsent === false) {
      console.log('[Tracking] Événement refusé:', eventType);
      return;
    }
    
    try {
      console.log('[Tracking] Envoi événement:', { productId: product._id, eventType, user: user?.id, consent: user?.trackingConsent });
      await analyticsApi.track({
        productId: product._id,
        eventType,
        referrer: document.referrer || undefined,
        currentUrl: window.location.href,
      });
      console.log('[Tracking] Événement enregistré:', eventType);
    } catch (error: any) {
      console.error('[Tracking] Erreur:', error.response?.data || error.message);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!product) return;

    setFavoritesLoading(true);
    try {
      if (isFavorite) {
        await authApi.removeFavorite(product._id);
        setIsFavorite(false);
        toast.success('Produit retiré des favoris');
        trackEvent('favorite_remove');
      } else {
        await authApi.addFavorite(product._id);
        setIsFavorite(true);
        toast.success('Produit ajouté aux favoris');
        trackEvent('favorite_add');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification des favoris');
    } finally {
      setFavoritesLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await settingsApi.get();
      setSettings(res.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const canSeePrice = () => {
    if (!settings) return true; // Par défaut, afficher les prix en attendant le chargement
    if (settings.priceVisibility === 'all') return true;
    if (settings.priceVisibility === 'loggedIn') return !!user;
    if (settings.priceVisibility === 'hidden') return false;
    return true;
  };

  const loadProduct = async () => {
    try {
      console.log('[ProductPage] Chargement du produit:', slug);
      const res = await productsApi.getBySlug(slug);
      console.log('[ProductPage] Produit chargé:', res.data._id, res.data.name);
      setProduct(res.data);
      
      // Charger les produits recommandés
      if (res.data._id) {
        try {
          const recommendedRes = await productsApi.getRecommended(res.data._id);
          setRecommendedProducts(recommendedRes.data.products || []);
        } catch (error) {
          console.error('Error loading recommended products:', error);
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Produit non trouvé</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            {product.images && product.images.length > 0 ? (
              <>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                  <div className="relative w-full h-full">
                    {product.images.map((img: any, index: number) => (
                      <img
                        key={index}
                        src={getImageUrl(img.url)}
                        alt={img.alt || product.name}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                          selectedImage === index ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    ))}
                  </div>
                  {product.images.length > 1 && (
                    <>
                      {/* Flèche gauche */}
                      <button
                        onClick={() => setSelectedImage((selectedImage - 1 + product.images.length) % product.images.length)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                        aria-label="Image précédente"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      {/* Flèche droite */}
                      <button
                        onClick={() => setSelectedImage((selectedImage + 1) % product.images.length)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                        aria-label="Image suivante"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {product.images.map((img: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-square rounded overflow-hidden border transition-all ${
                          selectedImage === index 
                            ? 'border-gray-900' 
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={getImageUrl(img.url)}
                          alt={img.alt || product.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <span className="text-gray-400 text-sm">Aucune image</span>
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start gap-3 mb-3">
                <h1 className="text-2xl font-semibold text-gray-900 flex-1">{product.name}</h1>
                {product.isBestSeller && (
                  <span className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium uppercase flex-shrink-0">
                    Best Seller
                  </span>
                )}
              </div>
              
              {/* Boutons admin */}
              {user && isAdmin() && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <Link
                    href={`/admin/produits/${product._id}/stats`}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-green-50 text-green-700 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md border border-green-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Statistiques
                  </Link>
                  <Link
                    href={`/admin/produits/${product._id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-green-50 text-green-700 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md border border-green-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modifier
                  </Link>
                </div>
              )}
              
              <div className="flex items-center gap-3 flex-wrap text-sm text-gray-600">
                {product.brand && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Marque:</span>
                    <span className="font-medium text-gray-900">{product.brand.name || product.brand}</span>
                  </div>
                )}
                {product.category && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Catégorie:</span>
                    <span className="font-medium text-gray-900">{product.category.name}</span>
                    {product.subCategory && (
                      <>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">{product.subCategory.name}</span>
                      </>
                    )}
                  </div>
                )}
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  product.isInStock 
                    ? 'bg-gray-100 text-gray-700' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {product.isInStock ? 'En stock' : 'Rupture de stock'}
                </div>
              </div>
            </div>

            {/* Prix */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              {canSeePrice() ? (
                <>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-semibold text-gray-900">
                      {product.discountedPrice ? product.discountedPrice.toFixed(2) : product.price.toFixed(2)} €
                    </span>
                    {(product.discountedPrice || product.originalPrice) && (product.discountedPrice || product.originalPrice) !== product.price && (
                      <span className="text-lg text-gray-400 line-through">
                        {product.price.toFixed(2)} €
                      </span>
                    )}
                    {!product.discountedPrice && !product.originalPrice && product.compareAtPrice && (
                      <span className="text-lg text-gray-400 line-through">
                        {product.compareAtPrice.toFixed(2)} €
                      </span>
                    )}
                  </div>
                  {product.discountPercentage > 0 && (
                    <div className="inline-block bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium">
                      -{product.discountPercentage}% {product.promotion?.name && `(${product.promotion.name})`}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-white rounded border border-gray-200">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {settings?.priceVisibility === 'loggedIn' ? 'Connectez-vous pour voir le prix' : 'Prix sur demande'}
                    </p>
                    {settings?.priceVisibility === 'loggedIn' && !user && (
                      <Link href="/login" className="text-xs text-gray-600 hover:text-gray-900 mt-1 inline-block">
                        Se connecter →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Référence */}
            {product.sku && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Référence:</span>
                  <span className="font-mono text-sm font-medium text-gray-900">{product.sku}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              {user && user.role !== 'admin' && (
                <>
                  {cartItem ? (
                    // Produit déjà dans le panier
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-medium text-emerald-700">
                            Produit dans le panier ({cartItem.quantity} {cartItem.quantity > 1 ? 'articles' : 'article'})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <label className="text-sm font-medium text-gray-700">Quantité:</label>
                          <button
                            onClick={async () => {
                              const newQuantity = Math.max(1, cartItem.quantity - 1);
                              await updateQuantity(product._id, newQuantity);
                              checkCartItem();
                            }}
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors text-sm"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={cartItem.quantity}
                            onChange={async (e) => {
                              const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                              await updateQuantity(product._id, newQuantity);
                              checkCartItem();
                            }}
                            className="w-16 px-2 py-1.5 border border-gray-300 rounded text-center text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                          />
                          <button
                            onClick={async () => {
                              const newQuantity = cartItem.quantity + 1;
                              await updateQuantity(product._id, newQuantity);
                              checkCartItem();
                            }}
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors text-sm"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={async () => {
                            await removeItem(product._id);
                            toast.success('Produit retiré du panier');
                            trackEvent('cart_remove');
                            checkCartItem();
                          }}
                          className="px-4 py-2.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Retirer
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Produit pas dans le panier
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <label className="text-sm font-medium text-gray-700">Quantité:</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors text-sm"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 px-2 py-1.5 border border-gray-300 rounded text-center text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                          />
                          <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            await addItem(product._id, quantity);
                            toast.success(`${quantity} article(s) ajouté(s) au panier`);
                            trackEvent('cart_add');
                            // Mettre à jour l'état immédiatement après l'ajout
                            const items = getItems();
                            const item = items.find(item => item.product === product._id);
                            if (item) {
                              setCartItem({ quantity: item.quantity });
                              setQuantity(item.quantity);
                            }
                          }}
                          className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Ajouter au panier
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
              <div className={`flex items-center gap-2 ${user && user.role !== 'admin' ? 'mt-3' : ''}`}>
                <button
                  onClick={toggleFavorite}
                  disabled={favoritesLoading}
                  className={`p-2.5 rounded border transition-colors ${
                    isFavorite
                      ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  {favoritesLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Caractéristiques en pleine largeur */}
        {(() => {
          // Convertir les specifications Map en objet si nécessaire
          let specs: Record<string, any> = {};
          if (product.specifications) {
            if (product.specifications instanceof Map) {
              product.specifications.forEach((value: any, key: string) => {
                if (value !== null && value !== undefined && value !== '') {
                  specs[key] = value;
                }
              });
            } else if (typeof product.specifications === 'object') {
              specs = product.specifications;
            }
          }
          
          const validSpecs = Object.entries(specs).filter(
            ([key, value]) => value !== null && value !== undefined && value !== ''
          );

          if (validSpecs.length === 0) return null;

          const displaySpecs = showAllSpecs ? validSpecs : validSpecs.slice(0, 9);
          const hasMore = validSpecs.length > 9;

          return (
            <div className="mt-12 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Caractéristiques</h2>
              </div>
              <div className="relative">
                <div className={`p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!showAllSpecs && hasMore ? 'pb-20' : ''}`}>
                  {displaySpecs.map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-0">
                      <div className="text-xs text-gray-500 font-medium">{key}</div>
                      <div className="text-sm font-semibold text-gray-900">{String(value)}</div>
                    </div>
                  ))}
                </div>
                {!showAllSpecs && hasMore && (
                  <>
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <button
                        onClick={() => setShowAllSpecs(true)}
                        className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors"
                      >
                        Voir plus ({validSpecs.length - 9} autres)
                      </button>
                    </div>
                  </>
                )}
                {showAllSpecs && hasMore && (
                  <div className="px-6 pb-6 flex justify-center border-t border-gray-200 pt-4">
                    <button
                      onClick={() => setShowAllSpecs(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
                    >
                      Voir moins
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Produits recommandés */}
        {recommendedProducts.length > 0 && (
          <div className="mt-12 pt-12 border-t border-gray-200">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Produits recommandés</h2>
              <p className="text-sm text-gray-600">Découvrez d'autres produits qui pourraient vous intéresser</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedProducts.map((recommendedProduct) => {
                const primaryImage = recommendedProduct.images?.find((img: any) => img.isPrimary) || recommendedProduct.images?.[0];
                return (
                  <Link
                    key={recommendedProduct._id}
                    href={`/produit/${recommendedProduct.slug}`}
                    className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors"
                  >
                    {primaryImage ? (
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        <img
                          src={getImageUrl(primaryImage.url)}
                          alt={primaryImage.alt || recommendedProduct.name}
                          className="w-full h-full object-cover"
                        />
                        {recommendedProduct.isBestSeller && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-xs font-medium uppercase">
                              Best Seller
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    <div className="p-3 flex flex-col">
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm leading-tight">
                        {recommendedProduct.name}
                      </h3>
                      
                      <div className="mt-auto pt-2 border-t border-gray-100">
                        {canSeePrice() ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-semibold text-gray-900">
                              {recommendedProduct.discountedPrice 
                                ? recommendedProduct.discountedPrice.toFixed(2)
                                : recommendedProduct.price.toFixed(2)} €
                            </span>
                            {recommendedProduct.discountedPrice && recommendedProduct.discountedPrice !== recommendedProduct.price && (
                              <span className="text-xs text-gray-400 line-through">
                                {recommendedProduct.price.toFixed(2)} €
                              </span>
                            )}
                            {recommendedProduct.discountPercentage > 0 && (
                              <span className="ml-auto bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                -{recommendedProduct.discountPercentage}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600">Prix sur demande</div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de connexion pour les favoris */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowLoginModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Connectez-vous pour sauvegarder
              </h3>
              <p className="text-gray-600">
                Créez un compte ou connectez-vous pour ajouter ce produit à vos favoris et y accéder facilement plus tard.
              </p>
            </div>
            
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-center hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                onClick={() => setShowLoginModal(false)}
              >
                Se connecter
              </Link>
              <Link
                href="/login"
                className="block w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-center hover:border-gray-400 hover:bg-gray-50 transition-all"
                onClick={() => setShowLoginModal(false)}
              >
                Créer un compte
              </Link>
            </div>
            
            <button
              onClick={() => setShowLoginModal(false)}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Continuer sans compte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



