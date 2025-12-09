'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi, categoriesApi, brandsApi, settingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getImageUrl, getLinkWithRef } from '@/lib/config';
import CustomSelect from '@/components/CustomSelect';
import toast from 'react-hot-toast';

export default function AdvancedSearchPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allCategoriesFlat, setAllCategoriesFlat] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [specifications, setSpecifications] = useState<Record<string, { type: string; values: string[] }>>({});
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [filters, setFilters] = useState<Record<string, any>>({
    category: '',
    subCategory: '',
    brand: '',
    search: '',
  });
  const [specFilters, setSpecFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, specFilters, allProducts]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, brandsRes, specsRes, settingsRes] = await Promise.all([
        productsApi.getAll({ limit: 1000 }), // Charger tous les produits pour le filtrage côté client
        categoriesApi.getAll(), // Charger toutes les catégories (parentes et sous-catégories)
        brandsApi.getAll(),
        productsApi.getUniqueSpecifications(),
        settingsApi.get(),
      ]);
      const loadedProducts = productsRes.data.products || [];
      setAllProducts(loadedProducts);
      
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
      
      setCategories(organizedCategories);
      setAllCategoriesFlat(allCategories); // Garder une version plate pour le filtrage
      setBrands(brandsRes.data || []);
      setSpecifications(specsRes.data || {});
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (allProducts.length === 0) {
      setProducts([]);
      return;
    }
    
    let filtered = [...allProducts];

    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.shortDescription?.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par sous-catégorie (priorité sur la catégorie)
    if (filters.subCategory) {
      filtered = filtered.filter((p) => {
        const catId = p.category?._id || p.category;
        return catId === filters.subCategory;
      });
    } else if (filters.category) {
      // Filtre par catégorie parente (inclut toutes ses sous-catégories)
      const selectedCategory = allCategoriesFlat.find((cat: any) => 
        (cat._id || cat) === filters.category
      );
      if (selectedCategory && !selectedCategory.parentCategory) {
        // C'est une catégorie parente, récupérer toutes ses sous-catégories
        const subCategories = allCategoriesFlat.filter((cat: any) => 
          (cat.parentCategory?._id || cat.parentCategory) === filters.category
        );
        const subCategoryIds = subCategories.map((sub: any) => sub._id || sub);
        const categoryIds = [filters.category, ...subCategoryIds];
        filtered = filtered.filter((p) => {
          const catId = p.category?._id || p.category;
          return categoryIds.includes(catId);
        });
      }
    }

    // Filtre par marque
    if (filters.brand) {
      filtered = filtered.filter((p) => {
        const brandId = p.brand?._id || p.brand;
        return brandId === filters.brand;
      });
    }

    // Filtres par spécifications
    Object.entries(specFilters).forEach(([specKey, specValue]) => {
      if (specValue) {
        filtered = filtered.filter((p) => {
          if (!p.specifications) return false;
          
          let productSpecValue: any = null;
          if (p.specifications instanceof Map) {
            productSpecValue = p.specifications.get(specKey);
          } else if (typeof p.specifications === 'object') {
            productSpecValue = p.specifications[specKey];
          }
          
          if (productSpecValue === null || productSpecValue === undefined) return false;
          
          // Comparer selon le type
          const spec = specifications[specKey];
          if (spec?.type === 'number') {
            return Number(productSpecValue) === Number(specValue);
          } else if (spec?.type === 'boolean') {
            return String(productSpecValue) === specValue;
          } else {
            return String(productSpecValue).toLowerCase() === specValue.toLowerCase();
          }
        });
      }
    });

    setProducts(filtered);
  };

  // Filtrer les produits quand les données sont chargées
  useEffect(() => {
    if (allProducts.length > 0 && Object.keys(specifications).length > 0) {
      filterProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProducts, specifications]);

  const canSeePrice = () => {
    if (!settings) return true;
    if (settings.priceVisibility === 'all') return true;
    if (settings.priceVisibility === 'loggedIn') return !!user;
    if (settings.priceVisibility === 'hidden') return false;
    return true;
  };

  const clearFilters = () => {
    setFilters({ category: '', subCategory: '', brand: '', search: '' });
    setSpecFilters({});
  };

  const hasActiveFilters = filters.category || filters.subCategory || filters.brand || filters.search || Object.values(specFilters).some(v => v);

  const sortedSpecKeys = Object.keys(specifications).sort();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-emerald-50/50 to-green-50 py-8 md:py-10 overflow-hidden border-b border-green-100/50">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <div className="w-0.5 h-5 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Recherche Avancée</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 text-center leading-tight">
              Recherche <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Avancée</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 text-center max-w-lg mx-auto leading-relaxed">
              Filtrez les produits selon leurs caractéristiques techniques
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/catalogue/recherche-ia"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl relative"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Recherche IA
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white">
                  NOUVEAU
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Filtres */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900">Filtres</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Recherche classique */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Recherche</label>
                  <input
                    type="text"
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Nom, description, SKU..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Catégorie</label>
                  <CustomSelect
                    options={[
                      { value: '', label: 'Toutes les catégories' },
                      ...categories.flatMap((cat: any) => [
                        { value: cat._id, label: cat.name },
                        ...(cat.subCategories || []).map((sub: any) => ({
                          value: sub._id,
                          label: `  └ ${sub.name}`,
                        })),
                      ]),
                    ]}
                    value={filters.category || ''}
                    onChange={(value) => setFilters({ ...filters, category: value })}
                    placeholder="Sélectionner une catégorie"
                    searchable={true}
                    className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                  />
                </div>

                {/* Marque */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Marque</label>
                  <CustomSelect
                    options={[
                      { value: '', label: 'Toutes les marques' },
                      ...brands.map((brand) => ({
                        value: brand._id,
                        label: brand.name,
                      })),
                    ]}
                    value={filters.brand || ''}
                    onChange={(value) => setFilters({ ...filters, brand: value })}
                    placeholder="Sélectionner une marque"
                    searchable={true}
                    className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                  />
                </div>

                {/* Spécifications */}
                {sortedSpecKeys.length > 0 && (
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Caractéristiques</h3>
                    <div className="space-y-4">
                      {sortedSpecKeys.map((specKey) => {
                        const spec = specifications[specKey];
                        return (
                          <div key={specKey}>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                              {specKey}
                            </label>
                            {spec.type === 'boolean' ? (
                              <CustomSelect
                                options={[
                                  { value: '', label: 'Tous' },
                                  { value: 'true', label: 'Oui' },
                                  { value: 'false', label: 'Non' },
                                ]}
                                value={specFilters[specKey] || ''}
                                onChange={(value) => setSpecFilters({ ...specFilters, [specKey]: value })}
                                placeholder="Sélectionner"
                                searchable={false}
                                className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                              />
                            ) : (
                              <CustomSelect
                                options={[
                                  { value: '', label: 'Tous' },
                                  ...spec.values.map((val) => ({
                                    value: val,
                                    label: val,
                                  })),
                                ]}
                                value={specFilters[specKey] || ''}
                                onChange={(value) => setSpecFilters({ ...specFilters, [specKey]: value })}
                                placeholder="Sélectionner"
                                searchable={true}
                                className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-32">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
                <p className="mt-6 text-gray-600 text-lg font-medium">Chargement...</p>
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
                <div className="mb-8 flex items-center justify-between">
                  <p className="text-gray-600 font-medium">
                    <span className="font-bold text-gray-900">{products.length}</span> produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
                  </p>
                  <Link
                    href="/catalogue"
                    className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Retour au catalogue
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <Link
                      key={product._id}
                      href={getLinkWithRef(`/produit/${product.slug}`, user?.id)}
                      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-green-300 overflow-hidden"
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
                        <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors leading-snug">
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
                              <span className="text-sm font-semibold text-green-600">
                                {product.discountedPrice ? product.discountedPrice.toFixed(2) : product.price.toFixed(2)} €
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-gray-500">
                                {settings?.priceVisibility === 'loggedIn' ? 'Connectez-vous' : 'Sur demande'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-green-600 font-medium text-xs group-hover:gap-1.5 transition-all">
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
    </div>
  );
}

