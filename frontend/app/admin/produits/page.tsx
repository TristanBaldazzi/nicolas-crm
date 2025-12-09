'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import CustomSelect from '@/components/CustomSelect';
import { productsApi, uploadApi, productSpecsApi, brandsApi, analyticsApi } from '@/lib/api';
import { categoriesApi } from '@/lib/api';
import { getImageUrl, getLinkWithRef } from '@/lib/config';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productSpecs, setProductSpecs] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [productsStats, setProductsStats] = useState<Record<string, { views: number; processedOrders: number }>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [showSpecsManager, setShowSpecsManager] = useState(false);
  const [showBrandsManager, setShowBrandsManager] = useState(false);
  const [newSpecName, setNewSpecName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [specSearch, setSpecSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importLoading, setImportLoading] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'importing'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, specsRes, brandsRes, statsRes] = await Promise.all([
        productsApi.getAll({ limit: 1000 }),
        categoriesApi.getAll(),
        productSpecsApi.getAll(),
        brandsApi.getAll(),
        analyticsApi.getProductsSummary().catch(() => ({ data: {} })),
      ]);
      const productsList = productsRes.data.products || [];
      setAllProducts(productsList);
      setProducts(productsList);
      setCategories(categoriesRes.data || []);
      setProductSpecs(specsRes.data || []);
      setBrands(brandsRes.data || []);
      setProductsStats(statsRes.data || {});
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterProducts();
  }, [search, categoryFilter, brandFilter, stockFilter, featuredFilter, allProducts]);

  const filterProducts = () => {
    let filtered = [...allProducts];

    // Recherche textuelle
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.shortDescription?.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.brand?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre catégorie
    if (categoryFilter) {
      filtered = filtered.filter((p) => {
        const catId = p.category?._id || p.category;
        return catId === categoryFilter;
      });
    }

    // Filtre marque
    if (brandFilter) {
      filtered = filtered.filter((p) => {
        const brandId = p.brand?._id || p.brand;
        return brandId === brandFilter;
      });
    }

    // Filtre stock
    if (stockFilter === 'inStock') {
      filtered = filtered.filter((p) => p.isInStock);
    } else if (stockFilter === 'outOfStock') {
      filtered = filtered.filter((p) => !p.isInStock);
    }

    // Filtre vedette
    if (featuredFilter === 'featured') {
      filtered = filtered.filter((p) => p.isFeatured);
    } else if (featuredFilter === 'notFeatured') {
      filtered = filtered.filter((p) => !p.isFeatured);
    }

    setProducts(filtered);
  };

  // Les marques sont maintenant chargées depuis l'API

  const handleEdit = (product: any) => {
    router.push(`/admin/produits/${product._id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await productsApi.delete(id);
      toast.success('Produit supprimé');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAddSpec = async () => {
    if (!newSpecName.trim()) {
      toast.error('Le nom de la caractéristique est requis');
      return;
    }
    
    // Séparer par virgules et nettoyer chaque nom
    const specNames = newSpecName
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (specNames.length === 0) {
      toast.error('Veuillez entrer au moins une caractéristique');
      return;
    }
    
    // Vérifier les doublons (insensible à la casse)
    const normalizedNames = specNames.map(name => name.toLowerCase());
    const uniqueNames = new Set(normalizedNames);
    
    if (normalizedNames.length !== uniqueNames.size) {
      // Trouver les doublons
      const duplicates: string[] = [];
      const seen = new Set<string>();
      
      normalizedNames.forEach((normalized, index) => {
        if (seen.has(normalized)) {
          duplicates.push(specNames[index]);
        } else {
          seen.add(normalized);
        }
      });
      
      toast.error(`Impossible d'ajouter deux fois la même caractéristique : ${duplicates.join(', ')}`);
      return;
    }
    
    try {
      // Créer toutes les caractéristiques en parallèle
      const promises = specNames.map(name => productSpecsApi.create({ name }));
      await Promise.all(promises);
      
      toast.success(`${specNames.length} caractéristique${specNames.length > 1 ? 's' : ''} ajoutée${specNames.length > 1 ? 's' : ''}`);
      setNewSpecName('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajout');
    }
  };

  const handleDeleteSpec = async (id: string, name: string) => {
    if (!confirm(`Supprimer la caractéristique "${name}" ? Elle sera supprimée de tous les produits.`)) return;
    try {
      await productSpecsApi.delete(id);
      toast.success('Caractéristique supprimée');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      toast.error('Le nom de la marque est requis');
      return;
    }
    
    // Séparer par virgules et nettoyer chaque nom
    const brandNames = newBrandName
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (brandNames.length === 0) {
      toast.error('Veuillez entrer au moins une marque');
      return;
    }
    
    // Vérifier les doublons (insensible à la casse)
    const normalizedNames = brandNames.map(name => name.toLowerCase());
    const uniqueNames = new Set(normalizedNames);
    
    if (normalizedNames.length !== uniqueNames.size) {
      // Trouver les doublons
      const duplicates: string[] = [];
      const seen = new Set<string>();
      
      normalizedNames.forEach((normalized, index) => {
        if (seen.has(normalized)) {
          duplicates.push(brandNames[index]);
        } else {
          seen.add(normalized);
        }
      });
      
      toast.error(`Impossible d'ajouter deux fois la même marque : ${duplicates.join(', ')}`);
      return;
    }
    
    try {
      // Créer toutes les marques en parallèle
      const promises = brandNames.map(name => brandsApi.create({ name }));
      await Promise.all(promises);
      
      toast.success(`${brandNames.length} marque${brandNames.length > 1 ? 's' : ''} ajoutée${brandNames.length > 1 ? 's' : ''}`);
      setNewBrandName('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajout');
    }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (!confirm(`Supprimer la marque "${name}" ? Les produits utilisant cette marque seront mis à jour.`)) return;
    try {
      await brandsApi.delete(id);
      toast.success('Marque supprimée');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };


  const processFile = async (file: File) => {
    // Vérifier l'extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast.error('Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV');
      return;
    }

    setImportFile(file);
    setImportLoading(true);
    setImportStep('mapping');

    try {
      const response = await productsApi.importPreview(file);
      setImportPreview(response.data);
      // Utiliser le mapping automatique par défaut
      setColumnMapping(response.data.autoMapping || {});
      toast.success('Fichier analysé avec succès ! Configurez le mapping des colonnes.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'analyse du fichier');
      setImportFile(null);
      setImportStep('upload');
    } finally {
      setImportLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleImport = async () => {
    if (!importFile) return;

    // Vérifier qu'au moins le nom, le prix et la catégorie sont mappés
    const mappedFields = Object.values(columnMapping);
    if (!mappedFields.includes('name')) {
      toast.error('Vous devez mapper la colonne "Nom du produit" (requis)');
      return;
    }
    if (!mappedFields.includes('price')) {
      toast.error('Vous devez mapper la colonne "Prix" (requis)');
      return;
    }
    if (!mappedFields.includes('category')) {
      toast.error('Vous devez mapper la colonne "Catégorie" (requis)');
      return;
    }

    setImportLoading(true);
    setImportStep('importing');

    try {
      const response = await productsApi.import(importFile, columnMapping);
      const result = response.data;

      setImportResults(result);

      if (result.imported > 0) {
        toast.success(`${result.imported} produit(s) importé(s) avec succès${result.errors > 0 ? `, ${result.errors} erreur(s)` : ''}`);
      } else {
        toast.error(`${result.errors} erreur(s) lors de l'import`);
      }

      // Si tout s'est bien passé sans erreurs, fermer et recharger
      if (result.errors === 0) {
        setShowImportModal(false);
        resetImport();
        loadData();
      } else {
        // Sinon, rester sur la page pour voir les erreurs
        setImportStep('mapping');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'import');
      setImportStep('mapping');
    } finally {
      setImportLoading(false);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportPreview(null);
    setColumnMapping({});
    setImportStep('upload');
    setImportResults(null);
  };

  const mainCategories = categories.filter((c) => !c.parentCategory);
  const subCategories = categories.filter((c) => c.parentCategory);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gestion des produits</h1>
            <p className="text-gray-600 mt-1">{allProducts.length} produit{allProducts.length > 1 ? 's' : ''} au total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
            <button
              onClick={() => {
                setShowSpecsManager(true);
                loadData();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 text-blue-700 hover:text-blue-800 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Caractéristiques
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <button
              onClick={() => {
                setShowBrandsManager(true);
                loadData();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-purple-50 text-purple-700 hover:text-purple-800 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Marques
            </button>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importer Excel
          </button>
          <Link
            href="/admin/produits/nouveau"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouveau produit
          </Link>
        </div>
      </div>

      {/* Modal de gestion des caractéristiques */}
      {showSpecsManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 border-b border-blue-500 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white">Gestion des caractéristiques</h2>
                  <p className="text-blue-100 mt-1">Ajoutez ou supprimez les caractéristiques disponibles pour les produits</p>
                </div>
                <button
                  onClick={() => {
                    setShowSpecsManager(false);
                    setSpecSearch('');
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 flex-shrink-0 border-b border-gray-200 bg-gray-50">
              {/* Formulaire d'ajout */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Ajouter une nouvelle caractéristique</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSpecName}
                    onChange={(e) => setNewSpecName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSpec()}
                    placeholder="Nom(s) de caractéristique(s), séparés par des virgules (ex: Dimensions, Poids, Couleur)"
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                  >
                    <svg className="w-5 h-5 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Barre de recherche */}
              {productSpecs.length > 0 && (
                <div className="relative">
                  <input
                    type="text"
                    value={specSearch}
                    onChange={(e) => setSpecSearch(e.target.value)}
                    placeholder="Rechercher une caractéristique..."
                    className="w-full px-4 py-2.5 pl-10 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {specSearch && (
                    <button
                      onClick={() => setSpecSearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Liste des caractéristiques */}
              {(() => {
                const filteredSpecs = productSpecs.filter(spec =>
                  spec.name.toLowerCase().includes(specSearch.toLowerCase())
                );

                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Caractéristiques disponibles
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({filteredSpecs.length}{specSearch && ` sur ${productSpecs.length}`})
                        </span>
                      </h3>
                      {specSearch && (
                        <button
                          onClick={() => setSpecSearch('')}
                          className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Effacer la recherche
                        </button>
                      )}
                    </div>

                    {productSpecs.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 font-medium">Aucune caractéristique disponible</p>
                        <p className="text-gray-400 text-sm mt-2">Ajoutez votre première caractéristique ci-dessus</p>
                      </div>
                    ) : filteredSpecs.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-gray-500 font-medium">Aucune caractéristique trouvée</p>
                        <p className="text-gray-400 text-sm mt-1">Essayez avec d'autres mots-clés</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredSpecs.map((spec) => (
                          <div key={spec._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 truncate">{spec.name}</div>
                                <div className="text-xs text-gray-500">Type: {spec.type || 'text'}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteSpec(spec._id, spec.name)}
                              className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                              title="Supprimer cette caractéristique"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{productSpecs.length}</span> caractéristique{productSpecs.length > 1 ? 's' : ''} au total
              </div>
              <button
                onClick={() => {
                  setShowSpecsManager(false);
                  setSpecSearch('');
                }}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des marques */}
      {showBrandsManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6 border-b border-purple-500 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white">Gestion des marques</h2>
                  <p className="text-purple-100 mt-1">Ajoutez ou supprimez les marques disponibles pour les produits</p>
                </div>
                <button
                  onClick={() => {
                    setShowBrandsManager(false);
                    setBrandSearch('');
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 flex-shrink-0 border-b border-gray-200 bg-gray-50">
              {/* Formulaire d'ajout */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Ajouter une nouvelle marque</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
                    placeholder="Nom(s) de marque(s), séparés par des virgules (ex: Samsung, LG, Bosch)"
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddBrand}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-bold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                  >
                    <svg className="w-5 h-5 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Barre de recherche */}
              {brands.length > 0 && (
                <div className="relative">
                  <input
                    type="text"
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    placeholder="Rechercher une marque..."
                    className="w-full px-4 py-2.5 pl-10 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {brandSearch && (
                    <button
                      onClick={() => setBrandSearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Liste des marques */}
              {(() => {
                const filteredBrands = brands.filter(brand =>
                  brand.name.toLowerCase().includes(brandSearch.toLowerCase())
                );

                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Marques disponibles
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({filteredBrands.length}{brandSearch && ` sur ${brands.length}`})
                        </span>
                      </h3>
                      {brandSearch && (
                        <button
                          onClick={() => setBrandSearch('')}
                          className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                        >
                          Effacer la recherche
                        </button>
                      )}
                    </div>

                    {brands.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <p className="text-gray-500 font-medium">Aucune marque disponible</p>
                        <p className="text-gray-400 text-sm mt-2">Ajoutez votre première marque ci-dessus</p>
                      </div>
                    ) : filteredBrands.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-gray-500 font-medium">Aucune marque trouvée</p>
                        <p className="text-gray-400 text-sm mt-1">Essayez avec d'autres mots-clés</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredBrands.map((brand) => (
                          <div key={brand._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 truncate">{brand.name}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteBrand(brand._id, brand.name)}
                              className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                              title="Supprimer cette marque"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{brands.length}</span> marque{brands.length > 1 ? 's' : ''} au total
              </div>
              <button
                onClick={() => {
                  setShowBrandsManager(false);
                  setBrandSearch('');
                }}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      {allProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, description, SKU, marque..."
                  className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filtre catégorie */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
              <CustomSelect
                options={[
                  { value: '', label: 'Toutes' },
                  ...mainCategories.map(cat => ({ value: cat._id, label: cat.name }))
                ]}
                value={categoryFilter}
                onChange={setCategoryFilter}
                placeholder="Toutes les catégories..."
                searchable={true}
              />
            </div>

            {/* Filtre marque */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Marque</label>
              <CustomSelect
                options={[
                  { value: '', label: 'Toutes' },
                  ...brands.map(brand => ({ value: brand._id, label: brand.name }))
                ]}
                value={brandFilter}
                onChange={setBrandFilter}
                placeholder="Toutes les marques..."
                searchable={true}
              />
            </div>

            {/* Filtre stock */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
              <CustomSelect
                options={[
                  { value: 'all', label: 'Tous' },
                  { value: 'inStock', label: 'En stock' },
                  { value: 'outOfStock', label: 'Rupture' }
                ]}
                value={stockFilter}
                onChange={setStockFilter}
                placeholder="Tous"
                searchable={false}
                className="text-sm"
              />
            </div>
          </div>

          {/* Filtres supplémentaires */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Vedette:</label>
              <CustomSelect
                options={[
                  { value: 'all', label: 'Tous' },
                  { value: 'featured', label: 'Vedettes uniquement' },
                  { value: 'notFeatured', label: 'Non vedettes' }
                ]}
                value={featuredFilter}
                onChange={setFeaturedFilter}
                placeholder="Tous"
                searchable={false}
                className="w-48"
              />
            </div>

            {(search || categoryFilter || brandFilter || stockFilter !== 'all' || featuredFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('');
                  setBrandFilter('');
                  setStockFilter('all');
                  setFeaturedFilter('all');
                }}
                className="text-sm text-gray-600 hover:text-green-600 font-semibold flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Réinitialiser
              </button>
            )}

            <div className="ml-auto text-sm text-gray-600">
              <span className="font-semibold">{products.length}</span> produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Commencez votre catalogue</h3>
            <p className="text-gray-600 mb-8">
              Vous n'avez pas encore de produits. Créez votre premier produit pour commencer à construire votre catalogue.
            </p>
            <Link
              href="/admin/produits/nouveau"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Créer votre premier produit
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {products.map((product) => {
              const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
              const stats = productsStats[product._id] || { views: 0, processedOrders: 0 };
              return (
                <div 
                  key={product._id} 
                  className="flex items-center gap-3 p-3 hover:bg-gray-50/50 transition-colors group"
                >
                  {/* Miniature image */}
                  <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={getImageUrl(primaryImage.url)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Informations principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={getLinkWithRef(`/produit/${product.slug}`, user?.id)}
                            className="font-semibold text-sm text-gray-900 hover:text-green-600 transition-colors truncate"
                          >
                            {product.name}
                          </Link>
                          {product.isImported && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded border border-blue-200 flex items-center gap-1" title="Produit importé depuis Excel">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {product.brand && (
                            <span className="text-xs text-gray-500">{product.brand.name || product.brand}</span>
                          )}
                          {product.category && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-gray-500 truncate">
                                {product.category.name}
                                {product.subCategory && ` / ${product.subCategory.name}`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Statistiques */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="font-medium">{stats.views}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{stats.processedOrders}</span>
                          </div>
                        </div>

                        {/* Prix */}
                        <div className="text-right">
                          <p className="font-semibold text-sm text-green-600">{product.price.toFixed(2)} €</p>
                          {product.compareAtPrice && (
                            <p className="text-xs text-gray-400 line-through">{product.compareAtPrice.toFixed(2)} €</p>
                          )}
                        </div>
                        
                        {/* Stock */}
                        <div className="text-right w-14">
                          <p className="text-xs text-gray-500">Stock</p>
                          <p className={`font-semibold text-xs ${product.isInStock ? 'text-green-600' : 'text-red-600'}`}>
                            {product.stock}
                          </p>
                        </div>
                        
                        {/* Badges compacts */}
                        <div className="flex items-center gap-1">
                          {product.isBestSeller && (
                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded border border-orange-200">
                              🔥
                            </span>
                          )}
                          {product.isFeatured && (
                            <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs font-semibold rounded">
                              ⭐
                            </span>
                          )}
                          {!product.isInStock && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                              Rupture
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      href={`/admin/produits/${product._id}/stats`}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Statistiques"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 border-b border-blue-500 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import Excel
                  </h2>
                  <p className="text-blue-100 mt-1">Importez vos produits depuis un fichier Excel</p>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    resetImport();
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {importStep === 'upload' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                    <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Instructions
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>La première ligne de votre fichier Excel doit contenir les en-têtes de colonnes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>Les lignes suivantes contiennent les données des produits</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>Vous pourrez mapper chaque colonne à un champ produit après l'upload</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>Formats supportés : <span className="font-semibold">.xlsx, .xls, .csv</span></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>Images : Vous pouvez mapper une colonne avec des URLs d'images (séparées par virgules) OU insérer directement des images dans votre fichier Excel (comme dans Google Sheets). Les images seront automatiquement extraites et associées aux produits.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Sélectionner le fichier Excel</label>
                    <input
                      type="file"
                      id="excel-file-upload"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={importLoading}
                    />
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      className={`relative border-2 border-dashed rounded-2xl transition-all ${
                        importLoading
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                          : isDragging
                          ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg'
                          : 'border-blue-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 hover:border-blue-400 hover:bg-blue-100/50 cursor-pointer'
                      }`}
                    >
                      <label
                        htmlFor="excel-file-upload"
                        className="flex flex-col items-center justify-center gap-4 p-12 cursor-pointer"
                      >
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
                          isDragging
                            ? 'bg-blue-600 scale-110'
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        } shadow-lg`}>
                          <svg className={`w-10 h-10 ${isDragging ? 'text-white animate-bounce' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          {isDragging ? (
                            <>
                              <p className="text-lg font-bold text-blue-700 mb-1">Relâchez pour déposer le fichier</p>
                              <p className="text-sm text-blue-600">Le fichier sera analysé automatiquement</p>
                            </>
                          ) : (
                            <>
                              <p className="text-lg font-bold text-gray-900 mb-1">
                                Cliquez pour sélectionner un fichier
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                ou glissez-déposez votre fichier Excel ici
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                Formats acceptés : .xlsx, .xls, .csv
                              </p>
                            </>
                          )}
                        </div>
                        {importFile && !isDragging && (
                          <div className="mt-2 px-4 py-2 bg-blue-100 rounded-lg border border-blue-300">
                            <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {importFile.name}
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                    
                    {/* Champs obligatoires */}
                    <div className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-amber-900 mb-1 flex items-center gap-2">
                            Champs obligatoires
                          </h4>
                          <p className="text-sm text-amber-800 mb-4">Vous devez mapper au minimum ces colonnes dans votre fichier Excel :</p>
                          <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-amber-400 rounded-lg shadow-sm">
                              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span className="text-sm font-bold text-amber-900">Nom du produit</span>
                              <span className="text-xs font-bold text-red-600">*</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-amber-400 rounded-lg shadow-sm">
                              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-bold text-amber-900">Prix</span>
                              <span className="text-xs font-bold text-red-600">*</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-amber-400 rounded-lg shadow-sm">
                              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              <span className="text-sm font-bold text-amber-900">Catégorie</span>
                              <span className="text-xs font-bold text-red-600">*</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {importStep === 'mapping' && importPreview && (
                <div className="space-y-4">
                  {importResults && importResults.errors > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <h4 className="font-bold text-red-900 mb-2">
                            {importResults.errors} erreur(s) détectée(s) lors de l'import
                          </h4>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {importResults.details?.errors?.map((err: any, idx: number) => (
                              <div key={idx} className="text-sm text-red-800">
                                <span className="font-semibold">Ligne {err.row}:</span> {err.error}
                              </div>
                            ))}
                          </div>
                          {importResults.imported > 0 && (
                            <p className="text-sm text-green-700 mt-3 font-semibold">
                              ✓ {importResults.imported} produit(s) importé(s) avec succès
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Avertissements d'images */}
                  {importResults && importResults.details?.success && (
                    <>
                      {importResults.details.success
                        .filter((item: any) => item.imageWarnings && item.imageWarnings.length > 0)
                        .map((item: any, idx: number) => (
                          <div key={idx} className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <div className="flex-1">
                                <h4 className="font-bold text-yellow-900 mb-1">
                                  Avertissement - Ligne {item.row}: {item.name}
                                </h4>
                                <p className="text-sm text-yellow-800 mb-2">
                                  Certaines images n'ont pas pu être téléchargées :
                                </p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {item.imageWarnings.map((warning: any, wIdx: number) => (
                                    <div key={wIdx} className="text-xs text-yellow-700">
                                      <span className="font-semibold">{warning.url}:</span> {warning.error}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </>
                  )}
                  
                  {importResults && importResults.imported > 0 && importResults.errors === 0 && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-bold text-green-800">
                          {importResults.imported} produit(s) importé(s) avec succès !
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <span className="font-bold">{importPreview.totalRows}</span> ligne(s) de données détectée(s) (hors en-tête)
                    </p>
                    {importPreview.hasEmbeddedImages && (
                      <p className="text-sm text-blue-800 mt-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">{importPreview.embeddedImagesCount}</span> image(s) intégrée(s) détectée(s) dans le fichier - elles seront automatiquement associées aux produits
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Mapping des colonnes</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Associez chaque colonne de votre fichier Excel à un champ produit. Les mappings par défaut sont suggérés automatiquement.
                    </p>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {importPreview.headers.map((header: string, index: number) => {
                        const currentMapping = columnMapping[header] || '';
                        const isSpec = currentMapping.startsWith('spec:');
                        const specName = isSpec ? currentMapping.replace('spec:', '') : '';

                        // Construire les options pour CustomSelect
                        const mappingOptions = [
                          { value: '', label: 'Ignorer cette colonne' },
                          { value: 'name', label: 'Nom du produit *' },
                          { value: 'description', label: 'Description complète' },
                          { value: 'shortDescription', label: 'Description courte' },
                          { value: 'sku', label: 'Code barre / SKU' },
                          { value: 'price', label: 'Prix *' },
                          { value: 'compareAtPrice', label: 'Prix comparé' },
                          { value: 'brand', label: 'Marque' },
                          { value: 'category', label: 'Catégorie *' },
                          { value: 'subCategory', label: 'Sous-catégorie' },
                          { value: 'stock', label: 'Stock' },
                          { value: 'isInStock', label: 'En stock (oui/non)' },
                          { value: 'isFeatured', label: 'En vedette (oui/non)' },
                          { value: 'isBestSeller', label: 'Best Seller (oui/non)' },
                          { value: 'images', label: 'Images (URLs séparées par virgules) 🖼️' },
                          ...productSpecs.map((spec) => ({
                            value: `spec:${spec.name}`,
                            label: `Spécification: ${spec.name}`
                          }))
                        ];

                        return (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-1 min-w-0">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Colonne Excel: <span className="text-blue-600">{header}</span>
                              </label>
                              {!isSpec ? (
                                <CustomSelect
                                  options={mappingOptions}
                                  value={currentMapping}
                                  onChange={(value) => {
                                    const newMapping = { ...columnMapping };
                                    if (value) {
                                      newMapping[header] = value;
                                    } else {
                                      delete newMapping[header];
                                    }
                                    setColumnMapping(newMapping);
                                  }}
                                  placeholder="Ignorer cette colonne"
                                  searchable={true}
                                  className="text-sm"
                                />
                              ) : (
                                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                  <span className="text-sm font-medium text-blue-900">Spécification: {specName}</span>
                                  <button
                                    onClick={() => {
                                      const newMapping = { ...columnMapping };
                                      delete newMapping[header];
                                      setColumnMapping(newMapping);
                                    }}
                                    className="ml-auto text-red-600 hover:text-red-700 text-sm font-semibold px-2 py-1 hover:bg-red-50 rounded transition-colors"
                                  >
                                    Retirer
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Aperçu des données */}
                    {importPreview.preview && importPreview.preview.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Aperçu des données (5 premières lignes)</h4>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                          <table className="min-w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                {importPreview.headers.map((header: string, i: number) => (
                                  <th key={i} className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {importPreview.preview.map((row: any[], rowIndex: number) => (
                                <tr key={rowIndex} className="border-t border-gray-200">
                                  {importPreview.headers.map((header: string, colIndex: number) => (
                                    <td key={colIndex} className="px-3 py-2 text-gray-600 border-r border-gray-200">
                                      {row[colIndex] || ''}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {importStep === 'importing' && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <p className="text-lg font-semibold text-gray-900">Import en cours...</p>
                  <p className="text-sm text-gray-600 mt-2">Veuillez patienter pendant l'importation des produits</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  resetImport();
                }}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-all"
              >
                {importStep === 'upload' ? 'Fermer' : 'Annuler'}
              </button>
              {importStep === 'mapping' && (
                <div className="flex gap-3">
                  <button
                    onClick={resetImport}
                    className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-all"
                  >
                    Changer de fichier
                  </button>
                  {importResults && importResults.errors > 0 && (
                    <button
                      onClick={() => {
                        setImportResults(null);
                        setImportStep('mapping');
                      }}
                      className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition-all"
                    >
                      Réessayer l'import
                    </button>
                  )}
                  <button
                    onClick={handleImport}
                    disabled={importLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importLoading ? 'Import...' : `Importer ${importPreview.totalRows} produit(s)`}
                  </button>
                  {importResults && importResults.imported > 0 && importResults.errors === 0 && (
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        resetImport();
                        loadData();
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg"
                    >
                      Fermer
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}



