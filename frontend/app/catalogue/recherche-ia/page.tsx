'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi, settingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getImageUrl, getLinkWithRef } from '@/lib/config';
import toast from 'react-hot-toast';

export default function AISearchPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [appliedFilters, setAppliedFilters] = useState<any>(null);

  useEffect(() => {
    loadData();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAiQuery(text);
        toast.success('Texte collé avec succès');
      }
    } catch (error) {
      console.error('Erreur lors du collage:', error);
      toast.error('Impossible de coller le texte');
    }
  };

  const loadData = async () => {
    try {
      const res = await productsApi.getAll({ limit: 1000 });
      setAllProducts(res.data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
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

  const handleAISearch = async () => {
    if (!aiQuery.trim()) {
      toast.error('Veuillez entrer une requête de recherche');
      return;
    }

    setAiLoading(true);
    setLoading(true);
    try {
      const response = await productsApi.aiSearch(aiQuery.trim());
      const aiFilters = response.data;

      setAppliedFilters(aiFilters);

      // Filtrer les produits avec les filtres retournés par l'IA
      let filtered = [...allProducts];

      // Filtre par recherche textuelle
      if (aiFilters.search) {
        const searchLower = aiFilters.search.toLowerCase();
        filtered = filtered.filter((p) =>
          p.name?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.shortDescription?.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower)
        );
      }

      // Filtre par catégorie
      if (aiFilters.category) {
        filtered = filtered.filter((p) => {
          const catId = p.category?._id || p.category;
          return catId === aiFilters.category;
        });
      }

      // Filtre par marque
      if (aiFilters.brand) {
        filtered = filtered.filter((p) => {
          const brandId = p.brand?._id || p.brand;
          return brandId === aiFilters.brand;
        });
      }

      // Filtres par spécifications
      if (aiFilters.specifications && Object.keys(aiFilters.specifications).length > 0) {
        Object.entries(aiFilters.specifications).forEach(([specKey, specValue]) => {
          if (specValue) {
            filtered = filtered.filter((p) => {
              if (!p.specifications) return false;
              
              let productSpecValue = null;
              if (p.specifications instanceof Map) {
                productSpecValue = p.specifications.get(specKey);
              } else if (typeof p.specifications === 'object') {
                productSpecValue = p.specifications[specKey];
              }
              
              if (productSpecValue === null || productSpecValue === undefined) return false;
              
              // Comparer selon le type
              if (typeof specValue === 'number') {
                return Number(productSpecValue) === Number(specValue);
              } else if (typeof specValue === 'boolean') {
                return String(productSpecValue) === String(specValue);
              } else {
                return String(productSpecValue).toLowerCase() === String(specValue).toLowerCase();
              }
            });
          }
        });
      }

      setProducts(filtered);
      toast.success(`${filtered.length} produit${filtered.length > 1 ? 's' : ''} trouvé${filtered.length > 1 ? 's' : ''} !`);
    } catch (error: any) {
      console.error('Erreur recherche IA:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la recherche IA');
      setProducts([]);
    } finally {
      setAiLoading(false);
      setLoading(false);
    }
  };

  const canSeePrice = () => {
    if (!settings) return true;
    if (settings.priceVisibility === 'all') return true;
    if (settings.priceVisibility === 'loggedIn') return !!user;
    if (settings.priceVisibility === 'hidden') return false;
    return true;
  };

  const clearSearch = () => {
    setAiQuery('');
    setProducts([]);
    setAppliedFilters(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 via-indigo-50/50 to-purple-50 py-12 md:py-16 overflow-hidden border-b border-purple-100/50">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.05),transparent_50%)]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Recherche Intelligente</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 text-center leading-tight">
              Recherche <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">IA</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 text-center max-w-2xl mx-auto leading-relaxed">
              Décrivez ce que vous cherchez en langage naturel et notre IA trouvera les produits correspondants
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Barre de recherche IA */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-100 p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative flex items-center gap-2">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAISearch()}
                    placeholder="Ex: monobrosse pour sols durs..."
                    className="flex-1 pl-12 pr-4 py-4 text-base border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all placeholder:text-xs"
                    disabled={aiLoading}
                  />
                  <button
                    onClick={handlePaste}
                    className="px-4 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all border border-gray-300 flex items-center gap-2 whitespace-nowrap"
                    title="Coller depuis le presse-papiers"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="hidden sm:inline">Coller</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-4">
                  💡 Exemples : "monobrosse professionnelle", "aspirateur sans sac Electrolux", "machine nettoyage haute pression"
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAISearch}
                  disabled={aiLoading || !aiQuery.trim()}
                  className="px-6 md:px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {aiLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Analyse...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Rechercher</span>
                    </>
                  )}
                </button>
                {products.length > 0 && (
                  <button
                    onClick={clearSearch}
                    className="px-4 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all border border-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filtres appliqués */}
            {appliedFilters && (
              <div className="mt-6 pt-6 border-t border-purple-100">
                <p className="text-xs font-semibold text-gray-700 mb-3">Filtres appliqués par l'IA :</p>
                <div className="flex flex-wrap gap-2">
                  {appliedFilters.search && (
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                      Recherche: "{appliedFilters.search}"
                    </span>
                  )}
                  {appliedFilters.category && (
                    <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold">
                      Catégorie sélectionnée
                    </span>
                  )}
                  {appliedFilters.brand && (
                    <span className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-lg text-xs font-semibold">
                      Marque sélectionnée
                    </span>
                  )}
                  {appliedFilters.specifications && Object.keys(appliedFilters.specifications).length > 0 && (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                      {Object.keys(appliedFilters.specifications).length} spécification{Object.keys(appliedFilters.specifications).length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Résultats */}
          {loading && allProducts.length === 0 ? (
            <div className="text-center py-32">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
              <p className="mt-6 text-gray-600 text-lg font-medium">Chargement des produits...</p>
            </div>
          ) : products.length === 0 && !aiLoading ? (
            <div className="text-center py-32 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Aucune recherche effectuée</h3>
              <p className="text-gray-600 text-lg mb-8">Décrivez ce que vous cherchez dans le champ de recherche ci-dessus</p>
            </div>
          ) : products.length === 0 && aiLoading === false ? (
            <div className="text-center py-32 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Aucun produit trouvé</h3>
              <p className="text-gray-600 text-lg mb-8">Essayez de reformuler votre recherche</p>
              <button
                onClick={clearSearch}
                className="px-8 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Nouvelle recherche
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-gray-600 font-medium">
                  <span className="font-bold text-gray-900">{products.length}</span> produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/catalogue/recherche-avancee"
                    className="text-sm text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2"
                  >
                    Recherche avancée
                  </Link>
                  <Link
                    href="/catalogue"
                    className="text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Catalogue
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <Link
                    key={product._id}
                    href={getLinkWithRef(`/produit/${product.slug}`, user?.id)}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-purple-300 overflow-hidden"
                  >
                    {product.images?.[0] ? (
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden flex items-center justify-center">
                        <img
                          src={getImageUrl(product.images[0].url)}
                          alt={product.images[0].alt || product.name}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors leading-snug">
                        {product.name}
                      </h3>
                      {product.shortDescription && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          {product.shortDescription}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div>
                          {canSeePrice() ? (
                            <span className="text-sm font-semibold text-purple-600">
                              {product.discountedPrice ? product.discountedPrice.toFixed(2) : product.price.toFixed(2)} €
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-500">
                              {settings?.priceVisibility === 'loggedIn' ? 'Connectez-vous' : 'Sur demande'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-purple-600 font-medium text-xs group-hover:gap-1.5 transition-all">
                          <span>Voir</span>
                          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

