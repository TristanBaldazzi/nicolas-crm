'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi, settingsApi, authApi } from '@/lib/api';
import { useCartStore } from '@/lib/cartStore';
import { useAuthStore } from '@/lib/store';
import { getImageUrl } from '@/lib/config';
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
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadSettings();
    loadProduct();
  }, [slug]);

  useEffect(() => {
    if (product && user) {
      checkFavorite();
    }
  }, [product, user]);

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

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour ajouter aux favoris');
      router.push('/login');
      return;
    }

    if (!product) return;

    setFavoritesLoading(true);
    try {
      if (isFavorite) {
        await authApi.removeFavorite(product._id);
        setIsFavorite(false);
        toast.success('Produit retiré des favoris');
      } else {
        await authApi.addFavorite(product._id);
        setIsFavorite(true);
        toast.success('Produit ajouté aux favoris');
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
      const res = await productsApi.getBySlug(slug);
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
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            {product.images && product.images.length > 0 ? (
              <>
                <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={getImageUrl(product.images[selectedImage]?.url)}
                    alt={product.images[selectedImage]?.alt || product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((img: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 ${
                          selectedImage === index ? 'border-green-600' : 'border-transparent'
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
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Aucune image</span>
              </div>
            )}
          </div>

          {/* Informations */}
          <div>
            <div className="flex items-start gap-4 mb-4">
              <h1 className="text-4xl font-bold flex-1">{product.name}</h1>
              {product.isBestSeller && (
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2 rounded-full text-sm font-black shadow-xl uppercase tracking-wider flex items-center gap-2 animate-pulse">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Best Seller
                </span>
              )}
            </div>
            
            {product.brand && (
              <div className="mb-4">
                <span className="text-sm text-gray-600">Marque:</span>
                <span className="ml-2 font-semibold">{product.brand}</span>
              </div>
            )}

            <div className="mb-6">
              {canSeePrice() ? (
                <>
                  <div className="flex items-baseline gap-4">
                    <span className="text-4xl font-bold text-green-600">
                      {product.discountedPrice ? product.discountedPrice.toFixed(2) : product.price.toFixed(2)} €
                    </span>
                    {(product.discountedPrice || product.originalPrice) && (product.discountedPrice || product.originalPrice) !== product.price && (
                      <span className="text-xl text-gray-400 line-through">
                        {product.price.toFixed(2)} €
                      </span>
                    )}
                    {!product.discountedPrice && !product.originalPrice && product.compareAtPrice && (
                      <span className="text-xl text-gray-400 line-through">
                        {product.compareAtPrice.toFixed(2)} €
                      </span>
                    )}
                  </div>
                  {product.discountPercentage > 0 && (
                    <div className="mt-2">
                      <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                        -{product.discountPercentage}% {product.promotion?.name && `(${product.promotion.name})`}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {settings?.priceVisibility === 'loggedIn' ? 'Connectez-vous pour voir le prix' : 'Prix sur demande'}
                    </p>
                    {settings?.priceVisibility === 'loggedIn' && !user && (
                      <Link href="/login" className="text-sm text-green-600 hover:underline mt-1 inline-block">
                        Se connecter →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-lg text-gray-700 mb-6">{product.shortDescription}</p>
            )}

            {product.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {product.sku && (
              <div className="mb-4">
                <span className="text-sm text-gray-600">Référence:</span>
                <span className="ml-2 font-mono">{product.sku}</span>
              </div>
            )}

            <div className="mb-6">
              <div className={`inline-block px-4 py-2 rounded-lg ${
                product.isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.isInStock ? 'En stock' : 'Rupture de stock'}
              </div>
            </div>

            {product.category && (
              <div className="text-sm text-gray-600 mb-6">
                <span>Catégorie: </span>
                <span className="font-semibold">{product.category.name}</span>
                {product.subCategory && (
                  <>
                    <span className="mx-2">/</span>
                    <span className="font-semibold">{product.subCategory.name}</span>
                  </>
                )}
              </div>
            )}

            {user && user.role !== 'admin' && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm font-semibold text-gray-700">Quantité:</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      addItem(product._id, quantity);
                      toast.success(`${quantity} article(s) ajouté(s) au panier`);
                      setQuantity(1);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
                  >
                    Ajouter au panier
                  </button>
                  <button
                    onClick={toggleFavorite}
                    disabled={favoritesLoading}
                    className={`p-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl ${
                      isFavorite
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    {favoritesLoading ? (
                      <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Produits recommandés */}
        {recommendedProducts.length > 0 && (
          <div className="mt-20 pt-20 border-t border-gray-200">
            {/* Header avec design moderne */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-green-500"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h2 className="text-4xl font-black text-gray-900">
                  Produits <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">recommandés</span>
                </h2>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-green-500"></div>
              </div>
              <p className="text-gray-600 text-lg">Découvrez d'autres produits qui pourraient vous intéresser</p>
            </div>

            {/* Grille de produits avec design amélioré */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendedProducts.map((recommendedProduct) => {
                const primaryImage = recommendedProduct.images?.find((img: any) => img.isPrimary) || recommendedProduct.images?.[0];
                return (
                  <Link
                    key={recommendedProduct._id}
                    href={`/produit/${recommendedProduct.slug}`}
                    className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100 transform hover:-translate-y-2 cursor-pointer"
                  >
                    {/* Effet de glow au hover */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500"></div>
                    
                    <div className="relative bg-white rounded-2xl h-full flex flex-col">
                      {/* Image avec overlay */}
                      {primaryImage ? (
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                          <img
                            src={getImageUrl(primaryImage.url)}
                            alt={primaryImage.alt || recommendedProduct.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          {/* Badge marque */}
                          {recommendedProduct.brand && (
                            <div className="absolute top-4 left-4">
                              <span className="bg-white/95 backdrop-blur-sm text-green-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                                {recommendedProduct.brand}
                              </span>
                            </div>
                          )}
                          
                          {/* Badges */}
                          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                            {recommendedProduct.isBestSeller && (
                              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-xs font-black shadow-xl uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Best Seller
                              </span>
                            )}
                            {recommendedProduct.isFeatured && (
                              <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Vedette
                              </span>
                            )}
                          </div>

                          {/* Overlay avec bouton au hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:scale-105 flex items-center gap-2">
                              <span>Découvrir</span>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Contenu */}
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors text-lg leading-tight">
                          {recommendedProduct.name}
                        </h3>
                        
                        {/* Prix avec design amélioré */}
                        <div className="mt-auto pt-4 border-t border-gray-100">
                          {canSeePrice() ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                                {recommendedProduct.discountedPrice 
                                  ? recommendedProduct.discountedPrice.toFixed(2)
                                  : recommendedProduct.price.toFixed(2)} €
                              </span>
                              {recommendedProduct.discountedPrice && recommendedProduct.discountedPrice !== recommendedProduct.price && (
                                <span className="text-sm text-gray-400 line-through">
                                  {recommendedProduct.price.toFixed(2)} €
                                </span>
                              )}
                              {recommendedProduct.discountPercentage > 0 && (
                                <span className="ml-auto bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                  -{recommendedProduct.discountPercentage}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-base font-bold text-gray-900">Disponible</span>
                              </div>
                              <div className="flex items-center gap-1 text-green-600 font-bold group-hover:gap-2 transition-all">
                                <span className="text-sm">Découvrir</span>
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



