'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, productsApi, settingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useCartStore } from '@/lib/cartStore';
import { getImageUrl } from '@/lib/config';
import toast from 'react-hot-toast';

export default function FavorisPage() {
  const router = useRouter();
  const { user, loadFromStorage, isLoading: authLoading } = useAuthStore();
  const { addItem } = useCartStore();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  const loadSettings = async () => {
    try {
      const res = await settingsApi.get();
      setSettings(res.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res = await authApi.getFavorites();
      setFavorites(res.data.favorites || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Erreur lors du chargement des favoris');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Attendre que le chargement soit terminé avant de vérifier
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    loadFavorites();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Afficher un loader pendant le chargement de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  const removeFavorite = async (productId: string) => {
    try {
      await authApi.removeFavorite(productId);
      setFavorites(favorites.filter(fav => fav._id !== productId));
      toast.success('Produit retiré des favoris');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const addToCart = (product: any) => {
    addItem(product._id, 1);
    toast.success('Produit ajouté au panier');
  };

  const canSeePrice = () => {
    if (!settings) return true;
    if (settings.priceVisibility === 'all') return true;
    if (settings.priceVisibility === 'loggedIn') return !!user;
    if (settings.priceVisibility === 'hidden') return false;
    return true;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white py-12 relative overflow-hidden">
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
              <h1 className="text-3xl md:text-4xl font-black">
                Vos produits favoris
              </h1>
            </div>
            <p className="text-green-100">
              Retrouvez tous vos produits favoris en un seul endroit
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="text-center py-32">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
                <p className="mt-6 text-gray-600 text-lg font-medium">Chargement de vos favoris...</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-3xl shadow-lg border border-gray-100">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Aucun favori</h3>
                <p className="text-gray-600 text-lg mb-8">Vous n'avez pas encore de produits favoris</p>
                <Link
                  href="/catalogue"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Parcourir le catalogue
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-gray-600 font-medium">
                    <span className="font-bold text-gray-900">{favorites.length}</span> produit{favorites.length > 1 ? 's' : ''} favori{favorites.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Tableau de produits - Desktop */}
                <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Produit</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Marque</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Prix</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {favorites.map((product) => {
                          const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
                          const brandName = product.brand 
                            ? (typeof product.brand === 'object' && product.brand !== null ? product.brand.name : product.brand)
                            : null;
                          return (
                            <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                              {/* Produit */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-4">
                                  <Link href={`/produit/${product.slug}`} className="flex-shrink-0">
                                    {primaryImage ? (
                                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
                                        <img
                                          src={getImageUrl(primaryImage.url)}
                                          alt={primaryImage.alt || product.name}
                                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    )}
                                  </Link>
                                  <div className="min-w-0 flex-1">
                                    <Link href={`/produit/${product.slug}`}>
                                      <h3 className="font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-2">
                                        {product.name}
                                      </h3>
                                    </Link>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      {product.isBestSeller && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-black rounded-full">
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                          Best Seller
                                        </span>
                                      )}
                                      {product.isFeatured && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-full">
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                          Vedette
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Description */}
                              <td className="px-6 py-4">
                                <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                                  {product.shortDescription || 'Aucune description'}
                                </p>
                              </td>
                              
                              {/* Marque */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {brandName ? (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold">
                                    {brandName}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
                              </td>
                              
                              {/* Prix */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {canSeePrice() ? (
                                  <div className="flex flex-col">
                                    <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                                      {product.price?.toFixed(2)} €
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span className="text-sm font-semibold">
                                      {settings?.priceVisibility === 'loggedIn' ? 'Connectez-vous' : 'Sur demande'}
                                    </span>
                                  </div>
                                )}
                              </td>
                              
                              {/* Actions */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => addToCart(product)}
                                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-sm"
                                  >
                                    Panier
                                  </button>
                                  <button
                                    onClick={() => removeFavorite(product._id)}
                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 hover:text-red-700 transition-all border-2 border-red-200 hover:border-red-300 text-sm flex items-center gap-2"
                                    title="Retirer des favoris"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                    Retirer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cartes de produits - Mobile */}
                <div className="md:hidden space-y-4">
                  {favorites.map((product) => {
                    const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
                    const brandName = product.brand 
                      ? (typeof product.brand === 'object' && product.brand !== null ? product.brand.name : product.brand)
                      : null;
                    return (
                      <div key={product._id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="p-4">
                          <div className="flex gap-4 mb-4">
                            <Link href={`/produit/${product.slug}`} className="flex-shrink-0">
                              {primaryImage ? (
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
                                  <img
                                    src={getImageUrl(primaryImage.url)}
                                    alt={primaryImage.alt || product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link href={`/produit/${product.slug}`}>
                                <h3 className="font-bold text-gray-900 hover:text-green-600 transition-colors mb-2">
                                  {product.name}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {product.isBestSeller && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-black rounded-full">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    Best Seller
                                  </span>
                                )}
                                {product.isFeatured && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-full">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    Vedette
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.shortDescription || 'Aucune description'}
                          </p>

                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Marque</p>
                              {brandName ? (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                                  {brandName}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-1">Prix</p>
                              {canSeePrice() ? (
                                <span className="text-xl font-black bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                                  {product.price?.toFixed(2)} €
                                </span>
                              ) : (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="text-xs font-semibold">
                                    {settings?.priceVisibility === 'loggedIn' ? 'Connectez-vous' : 'Sur demande'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => addToCart(product)}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md text-sm"
                            >
                              Panier
                            </button>
                            <button
                              onClick={() => removeFavorite(product._id)}
                              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 hover:text-red-700 transition-all border-2 border-red-200 hover:border-red-300 text-sm flex items-center gap-2"
                              title="Retirer des favoris"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              <span className="hidden sm:inline">Retirer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

