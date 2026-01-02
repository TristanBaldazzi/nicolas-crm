'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi, categoriesApi, settingsApi, brandsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getImageUrl, getLinkWithRef } from '@/lib/config';
import CustomSelect from '@/components/CustomSelect';

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

function CataloguePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    brand: '',
    search: '',
    page: 1,
  });
  const [showFilters, setShowFilters] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [brandsLoaded, setBrandsLoaded] = useState(false);

  // Charger les settings et les marques une seule fois au montage
  useEffect(() => {
    loadSettings();
    loadBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialiser les filtres depuis l'URL une fois que les marques sont chargées
  useEffect(() => {
    // Ne s'exécuter qu'une seule fois quand les marques sont chargées
    if (initialized || !brandsLoaded) return;

    const brandParam = searchParams.get('brand');
    
    // Si on a un paramètre brand dans l'URL et des marques chargées
    if (brandParam && brands.length > 0) {
      // Vérifier si c'est déjà un ID (format ObjectId)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(brandParam);
      
      if (isObjectId) {
        // C'est déjà un ID, vérifier qu'il existe
        const foundBrand = brands.find((b) => b._id === brandParam);
        if (foundBrand) {
          setFilters((prev) => ({ ...prev, brand: brandParam }));
        }
      } else {
        // C'est un nom, chercher la marque par son nom (insensible à la casse)
        const foundBrand = brands.find(
          (b) => b.name.toLowerCase() === brandParam.toLowerCase()
        );
        if (foundBrand) {
          setFilters((prev) => ({ ...prev, brand: foundBrand._id }));
          // Mettre à jour l'URL pour utiliser l'ID au lieu du nom
          const params = new URLSearchParams(searchParams.toString());
          params.set('brand', foundBrand._id);
          router.replace(`/catalogue?${params.toString()}`, { scroll: false });
        }
      }
    }
    
    // Marquer comme initialisé (même si pas de marque dans l'URL ou pas de marques chargées)
    // Cela permet de charger les données même si l'API des marques échoue
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, brandsLoaded]);

  const loadBrands = async () => {
    try {
      const brandsRes = await brandsApi.getAll();
      setBrands(brandsRes.data || []);
    } catch (error) {
      console.error('Error loading brands:', error);
      // En cas d'erreur, initialiser quand même avec un tableau vide
      setBrands([]);
    } finally {
      // Marquer que le chargement est terminé (succès ou échec)
      setBrandsLoaded(true);
    }
  };

  // Charger les données quand les filtres changent
  useEffect(() => {
    if (initialized) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.subCategory, filters.brand, filters.search, filters.page, initialized]);

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
      // Préparer les paramètres pour l'API
      const apiFilters: any = {
        ...filters,
      };
      
      // Si une sous-catégorie est sélectionnée, l'utiliser au lieu de la catégorie
      if (filters.subCategory) {
        apiFilters.subCategory = filters.subCategory;
        delete apiFilters.category; // Ne pas envoyer la catégorie parente si on a une sous-catégorie
      }
      
      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll(apiFilters),
        categoriesApi.getAll(), // Charger toutes les catégories (parentes et sous-catégories)
      ]);
      
      // Organiser les catégories : parentes avec leurs sous-catégories
      const allCategories = categoriesRes.data || [];
      const parentCategories = allCategories.filter((cat: any) => !cat.parentCategory);
      const subCategories = allCategories.filter((cat: any) => cat.parentCategory);
      
      // Créer une structure avec les sous-catégories groupées par parent
      const organizedCategories = parentCategories.map((parent: any) => {
        const children = subCategories.filter((sub: any) => 
          (sub.parentCategory?._id || sub.parentCategory) === parent._id
        );
        return { ...parent, subCategories: children };
      });
      
      setProducts(productsRes.data.products || []);
      setCategories(organizedCategories);
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
    setFilters({ category: '', subCategory: '', brand: '', search: '', page: 1 });
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
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-visible backdrop-blur-sm bg-opacity-95">
            {/* Header des filtres */}
            <div 
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 transition-all duration-300"
              onClick={() => setShowFilters(!showFilters)}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    Filtres de recherche
                    {hasActiveFilters && (
                      <span className="px-2.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full">
                        {[filters.search && 'Recherche', filters.category && 'Catégorie', filters.brand && 'Marque'].filter(Boolean).length}
                      </span>
                    )}
                  </h2>
                  {hasActiveFilters && (
                    <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
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
                    className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Réinitialiser
                  </button>
                )}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center transition-all duration-300 ${showFilters ? 'rotate-180 bg-gradient-to-br from-green-100 to-emerald-100' : ''}`}>
                  <svg 
                    className={`w-5 h-5 text-gray-600 transition-colors ${showFilters ? 'text-green-600' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Contenu des filtres */}
            {showFilters && (
              <div className="px-6 pb-8 border-t border-gray-100 bg-gradient-to-br from-gray-50/50 to-white relative overflow-visible">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 relative z-10">
                  {/* Recherche */}
                  <div className="group">
                    <label className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Recherche
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-colors">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                        placeholder="Nom, description, SKU..."
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all bg-white font-semibold shadow-sm hover:shadow-md focus:shadow-lg"
                      />
                    </div>
                    <Link
                      href="/catalogue/recherche-avancee"
                      className="mt-2 inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      Recherche avancée
                    </Link>
                  </div>

                  {/* Catégorie */}
                  <div className="group">
                    <label className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Catégorie
                    </label>
                    <CustomSelect
                      options={[
                        { value: '', label: 'Toutes les catégories' },
                        ...categories.map((cat: any) => ({
                          value: cat._id,
                          label: cat.name,
                        })),
                      ]}
                      value={filters.category}
                      onChange={(value) => setFilters({ ...filters, category: value, subCategory: '', page: 1 })}
                      placeholder="Sélectionner une catégorie"
                      searchable={true}
                      className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                    />
                  </div>

                  {/* Sous-catégorie (affichée seulement si une catégorie est sélectionnée) */}
                  {filters.category && (() => {
                    const selectedCategory = categories.find((cat: any) => cat._id === filters.category);
                    const subCategories = selectedCategory?.subCategories || [];
                    if (subCategories.length > 0) {
                      return (
                        <div className="group">
                          <label className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Sous-catégorie
                          </label>
                          <CustomSelect
                            options={[
                              { value: '', label: 'Toutes les sous-catégories' },
                              ...subCategories.map((sub: any) => ({
                                value: sub._id,
                                label: sub.name,
                              })),
                            ]}
                            value={filters.subCategory}
                            onChange={(value) => setFilters({ ...filters, subCategory: value, page: 1 })}
                            placeholder="Sélectionner une sous-catégorie"
                            searchable={true}
                            className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                          />
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Marque */}
                  <div className="group">
                    <label className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Marque
                    </label>
                    <CustomSelect
                      options={[
                        { value: '', label: 'Toutes les marques' },
                        ...brands.map((brand) => ({
                          value: brand._id,
                          label: brand.name,
                        })),
                      ]}
                      value={filters.brand}
                      onChange={(value) => setFilters({ ...filters, brand: value, page: 1 })}
                      placeholder="Sélectionner une marque"
                      searchable={true}
                      className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                    />
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
                  href={getLinkWithRef(`/produit/${product.slug}`, user?.id)}
                  className="group relative bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500"></div>
                  <div className="relative bg-white rounded-3xl h-full flex flex-col">
                    {/* Image */}
                    {product.images?.[0] ? (
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden flex items-center justify-center">
                        <img
                          src={getImageUrl(product.images[0].url)}
                          alt={product.images[0].alt || product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                        />
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
                              {(() => {
                                const priceHTVA = product.discountedPrice || product.price;
                                const priceTVA = priceHTVA * 1.17;
                                return (
                                  <>
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="text-xs text-gray-500">HTVA:</span>
                                        <span className="text-lg font-bold text-gray-900">
                                          {priceHTVA.toFixed(2)} €
                                        </span>
                                      </div>
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="text-xs text-gray-400">TVA:</span>
                                        <span className="text-xs font-medium text-gray-500">
                                          {priceTVA.toFixed(2)} €
                                        </span>
                                      </div>
                                    </div>
                                    {product.discountPercentage > 0 && (
                                      <span className="inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold mt-1">
                                        -{product.discountPercentage}%
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
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

            {/* Bouton vers demandes personnalisées */}
            <div className="mt-12 flex justify-center">
              <Link
                href="/dashboard/demande-personnalisee"
                className="group relative inline-flex items-center gap-4 px-8 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl font-bold text-lg hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-base font-bold">Besoin d'une offre personnalisée ?</div>
                  <div className="text-sm font-normal opacity-90">Demandez un devis sur mesure</div>
                </div>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CataloguePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Chargement...</p>
        </div>
      </div>
    }>
      <CataloguePageContent />
    </Suspense>
  );
}
