'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productsApi, categoriesApi, settingsApi, brandsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getImageUrl } from '@/lib/config';

export default function CataloguePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    search: '',
    page: 1,
  });
  const [showFilters, setShowFilters] = useState(true);

  // Charger les settings une seule fois au montage
  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger les données quand les filtres changent
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.brand, filters.search, filters.page]);

  const loadSettings = async () => {
    try {
      const res = await settingsApi.get();
      setSettings(res.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        productsApi.getAll(filters),
        categoriesApi.getAll({ parentOnly: 'true' }),
        brandsApi.getAll(),
      ]);
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data || []);
      setBrands(brandsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canSeePrice = () => {
    if (!settings) return true; // Par défaut, afficher les prix en attendant le chargement
    if (settings.priceVisibility === 'all') return true;
    if (settings.priceVisibility === 'loggedIn') return !!user;
    if (settings.priceVisibility === 'hidden') return false;
    return true;
  };


  const clearFilters = () => {
    setFilters({ category: '', brand: '', search: '', page: 1 });
  };

  const hasActiveFilters = filters.category || filters.brand || filters.search;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero Section - Moderne et Compacte */}
      <section className="relative bg-gradient-to-br from-green-50 via-emerald-50/50 to-green-50 py-8 md:py-10 overflow-hidden border-b border-green-100/50">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <div className="w-0.5 h-5 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Notre Catalogue</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 text-center leading-tight">
              Produits <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Professionnels</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 text-center max-w-lg mx-auto leading-relaxed">
              Trouvez l'équipement qu'il vous faut parmi notre sélection
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {/* Filtres - Design Moderne */}
        <div className="mb-12">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header des filtres */}
            <div 
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setShowFilters(!showFilters)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Filtres de recherche</h2>
                  {hasActiveFilters && (
                    <p className="text-sm text-gray-500 mt-1">
                      {[filters.search && 'Recherche', filters.category && 'Catégorie', filters.brand && 'Marque'].filter(Boolean).join(', ')} actifs
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {hasActiveFilters && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilters();
                    }}
                    className="px-4 py-2 text-sm font-semibold text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    Réinitialiser
                  </button>
                )}
                <svg 
                  className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Contenu des filtres */}
            {showFilters && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                  {/* Recherche */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Recherche</label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                        placeholder="Nom, description, SKU..."
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all bg-white font-medium"
                      />
                    </div>
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Catégorie</label>
                    <div className="relative">
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all appearance-none bg-white font-medium cursor-pointer"
                      >
                        <option value="">Toutes les catégories</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Marque */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Marque</label>
                    <div className="relative">
                      <select
                        value={filters.brand}
                        onChange={(e) => setFilters({ ...filters, brand: e.target.value, page: 1 })}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all appearance-none bg-white font-medium cursor-pointer"
                      >
                        <option value="">Toutes les marques</option>
                        {brands.map((brand) => (
                          <option key={brand._id} value={brand._id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                      <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Résultats */}
        {loading ? (
          <div className="text-center py-32">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Chargement des produits...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl shadow-lg border border-gray-100">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Aucun produit trouvé</h3>
            <p className="text-gray-600 text-lg mb-8">Essayez de modifier vos filtres de recherche</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Compteur de résultats */}
            <div className="mb-8 flex items-center justify-between">
              <p className="text-gray-600 font-medium">
                <span className="font-bold text-gray-900">{products.length}</span> produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Grille de produits - Design Moderne */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <Link
                  key={product._id}
                  href={`/produit/${product.slug}`}
                  className="group relative bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500"></div>
                  <div className="relative bg-white rounded-3xl h-full flex flex-col">
                    {/* Image */}
                    {product.images?.[0] ? (
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        <img
                          src={getImageUrl(product.images[0].url)}
                          alt={product.images[0].alt || product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        {product.brand && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-white/90 backdrop-blur-sm text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">
                              {product.brand.name || product.brand}
                            </span>
                          </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                          {product.isBestSeller && (
                            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-xs font-black shadow-xl uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Best Seller
                            </span>
                          )}
                          {product.isFeatured && (
                            <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Vedette
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Contenu */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors leading-tight">
                        {product.name}
                      </h3>
                      {product.shortDescription && (
                        <p className="text-sm text-gray-600 mb-6 line-clamp-2 leading-relaxed flex-1">
                          {product.shortDescription}
                        </p>
                      )}
                      
                      {/* Prix et CTA */}
                      <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-auto">
                        <div>
                          {canSeePrice() ? (
                            <>
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                                  {product.discountedPrice ? product.discountedPrice.toFixed(2) : product.price.toFixed(2)} €
                                </span>
                                {(product.discountedPrice || product.originalPrice) && (product.discountedPrice || product.originalPrice) !== product.price && (
                                  <span className="text-sm text-gray-400 line-through">
                                    {product.price.toFixed(2)} €
                                  </span>
                                )}
                              </div>
                              {product.discountPercentage > 0 && (
                                <span className="inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold mt-1">
                                  -{product.discountPercentage}%
                                </span>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-sm font-semibold">
                                {settings?.priceVisibility === 'loggedIn' ? 'Connectez-vous pour voir le prix' : 'Prix sur demande'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-green-600 font-semibold group-hover:gap-3 transition-all">
                          <span className="text-sm">Voir</span>
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
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
  );
}
