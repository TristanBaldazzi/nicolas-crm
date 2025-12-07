'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import CustomSelect from '@/components/CustomSelect';
import { productsApi, uploadApi, productSpecsApi, brandsApi } from '@/lib/api';
import { categoriesApi } from '@/lib/api';
import { getImageUrl } from '@/lib/config';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productSpecs, setProductSpecs] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    sku: '',
    price: '',
    compareAtPrice: '',
    brand: 'Autre',
    category: '',
    subCategory: '',
    stock: '',
    isInStock: true,
    isFeatured: false,
    isBestSeller: false,
    images: [] as any[],
    specifications: {} as Record<string, any>,
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, specsRes, brandsRes] = await Promise.all([
        productsApi.getAll({ limit: 1000 }),
        categoriesApi.getAll(),
        productSpecsApi.getAll(),
        brandsApi.getAll(),
      ]);
      const productsList = productsRes.data.products || [];
      setAllProducts(productsList);
      setProducts(productsList);
      setCategories(categoriesRes.data || []);
      setProductSpecs(specsRes.data || []);
      setBrands(brandsRes.data || []);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files).slice(0, 50 - formData.images.length);
    if (files.length === 0) {
      toast.error('Maximum 50 images autorisées');
      return;
    }

    setUploadingImages(true);
    try {
      const res = await uploadApi.uploadImages(files);
      const newImages = res.data.images.map((img: any, index: number) => ({
        url: img.url,
        alt: '',
        order: formData.images.length + index,
        isPrimary: formData.images.length === 0 && index === 0,
      }));
      setFormData({ ...formData, images: [...formData.images, ...newImages] });
      toast.success(`${newImages.length} image(s) uploadée(s)`);
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        stock: parseInt(formData.stock) || 0,
        specifications: formData.specifications,
      };

      await productsApi.create(data);
      toast.success('Produit créé');
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      sku: '',
      price: '',
      compareAtPrice: '',
      brand: '',
      category: '',
      subCategory: '',
      stock: '',
      isInStock: true,
      isFeatured: false,
      isBestSeller: false,
      images: [],
      specifications: {},
    });
  };

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
    try {
      await productSpecsApi.create({ name: newSpecName.trim() });
      toast.success('Caractéristique ajoutée');
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
    try {
      await brandsApi.create({ name: newBrandName.trim() });
      toast.success('Marque ajoutée');
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

  const updateSpecification = (specName: string, value: any, specType?: string) => {
    // Validation pour les champs de type number
    if (specType === 'number') {
      // Autoriser uniquement les nombres (avec points décimaux et signes négatifs)
      if (value === '' || value === null || value === undefined) {
        // Permettre les valeurs vides
        setFormData({
          ...formData,
          specifications: {
            ...formData.specifications,
            [specName]: '',
          },
        });
        return;
      }
      // Vérifier si c'est un nombre valide
      const numValue = value.toString().replace(',', '.'); // Remplacer les virgules par des points
      if (!/^-?\d*\.?\d*$/.test(numValue)) {
        // Si ce n'est pas un nombre valide, ne pas mettre à jour
        return;
      }
      // Convertir en nombre si c'est valide
      if (numValue === '' || numValue === '-') {
        setFormData({
          ...formData,
          specifications: {
            ...formData.specifications,
            [specName]: '',
          },
        });
        return;
      }
      const finalValue = parseFloat(numValue);
      if (isNaN(finalValue)) {
        return;
      }
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [specName]: finalValue,
        },
      });
    } else {
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [specName]: value,
        },
      });
    }
  };

  const handleAIGeneration = async () => {
    if (!aiDescription.trim()) {
      toast.error('Veuillez entrer une description du produit');
      return;
    }

    setAiLoading(true);
    try {
      const response = await productsApi.generateAI(aiDescription.trim());
      const generatedData = response.data;

      // Remplir le formulaire avec les données générées
      setFormData({
        name: generatedData.name || '',
        description: generatedData.description || '',
        shortDescription: generatedData.shortDescription || '',
        sku: generatedData.sku || '',
        price: generatedData.price?.toString() || '',
        compareAtPrice: generatedData.compareAtPrice?.toString() || '',
        brand: generatedData.brand || '',
        category: generatedData.category || '',
        subCategory: generatedData.subCategory || '',
        stock: generatedData.stock?.toString() || '',
        isInStock: generatedData.isInStock !== undefined ? generatedData.isInStock : true,
        isFeatured: generatedData.isFeatured || false,
        isBestSeller: generatedData.isBestSeller || false,
        images: [],
        specifications: generatedData.specifications || {},
      });

      // Fermer le modal et ouvrir le formulaire
      setShowAIModal(false);
      setAiDescription('');
      setShowForm(true);
      
      toast.success('Produit généré avec succès ! Vérifiez et complétez les informations si nécessaire.');
    } catch (error: any) {
      console.error('Erreur génération IA:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la génération IA. Vérifiez que OPENAI_API_KEY est configurée dans le backend.');
    } finally {
      setAiLoading(false);
    }
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
            onClick={() => {
              setShowForm(true);
              resetForm();
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouveau produit
          </button>
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
                    placeholder="Nom de la caractéristique (ex: Dimensions, Poids, etc.)"
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
                    placeholder="Nom de la marque (ex: Samsung, LG, etc.)"
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

      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900">
              Créer un produit
            </h2>
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Génération IA
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Ligne 1: Nom et Code barre */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-100 transition-all"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">Code barre</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-100 transition-all"
                />
              </div>
            </div>

            {/* Ligne 2: Descriptions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">Description courte</label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-100 transition-all resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">Description complète</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-100 transition-all resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Ligne 3: Prix, Prix comparé, Stock */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">Prix *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-100 transition-all"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">Prix comparé</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-100 transition-all"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-100 transition-all"
                />
              </div>
            </div>

            {/* Ligne 4: Marque, Catégorie, Sous-catégorie */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Marque</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBrandsManager(true);
                      loadData();
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    Gérer
                  </button>
                </div>
                <CustomSelect
                  options={[
                    { value: '', label: 'Aucune' },
                    ...brands.map(brand => ({ value: brand._id, label: brand.name }))
                  ]}
                  value={formData.brand}
                  onChange={(value) => setFormData({ ...formData, brand: value })}
                  placeholder="Sélectionner une marque..."
                  searchable={true}
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">Catégorie *</label>
                <CustomSelect
                  options={mainCategories.map(cat => ({ value: cat._id, label: cat.name }))}
                  value={formData.category}
                  onChange={(value) => {
                    setFormData({ ...formData, category: value, subCategory: '' });
                  }}
                  placeholder="Sélectionner une catégorie..."
                  searchable={true}
                  required={true}
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">Sous-catégorie</label>
                <CustomSelect
                  options={formData.category 
                    ? [
                        { value: '', label: 'Aucune' },
                        ...subCategories
                          .filter((c) => c.parentCategory === formData.category || c.parentCategory?._id === formData.category)
                          .map((cat) => ({ value: cat._id, label: cat.name }))
                      ]
                    : [{ value: '', label: 'Sélectionnez d\'abord une catégorie' }]
                  }
                  value={formData.subCategory}
                  onChange={(value) => setFormData({ ...formData, subCategory: value })}
                  placeholder="Sélectionner une sous-catégorie..."
                  searchable={true}
                  disabled={!formData.category}
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-700">Images (max 50)</label>
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImages || formData.images.length >= 50}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-dashed rounded-lg cursor-pointer transition-all text-sm ${
                    uploadingImages || formData.images.length >= 50
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed text-gray-400'
                      : 'border-gray-300 bg-gray-50 hover:border-green-500 hover:bg-green-50 text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">
                    {uploadingImages ? 'Upload...' : formData.images.length >= 50 ? 'Max atteint' : `Ajouter des images (${formData.images.length}/50)`}
                  </span>
                </label>
              </div>
              {formData.images.length > 0 && (
                <div className="mt-3">
                  <div className="grid grid-cols-6 gap-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 group-hover:border-green-500 transition-colors">
                          <img
                            src={getImageUrl(img.url)}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== index);
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-red-600 transition-all text-xs"
                        >
                          ×
                        </button>
                        {img.isPrimary && (
                          <div className="absolute bottom-1 left-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                            P
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Options du produit */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Options du produit</h3>
              <div className="grid grid-cols-3 gap-3">
                {/* En stock */}
                <label className="flex items-center p-3 bg-white rounded-lg border cursor-pointer transition-all hover:border-green-300 hover:bg-green-50"
                  style={{
                    borderColor: formData.isInStock ? '#10b981' : '#e5e7eb',
                    backgroundColor: formData.isInStock ? '#f0fdf4' : 'white'
                  }}>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isInStock}
                      onChange={(e) => setFormData({ ...formData, isInStock: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      formData.isInStock 
                        ? 'bg-green-600 border-green-600' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {formData.isInStock && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 flex-1">
                    <span className="text-sm font-semibold text-gray-900">En stock</span>
                  </div>
                </label>

                {/* Produit en vedette */}
                <label className="flex items-center p-3 bg-white rounded-lg border cursor-pointer transition-all hover:border-emerald-300 hover:bg-emerald-50"
                  style={{
                    borderColor: formData.isFeatured ? '#10b981' : '#e5e7eb',
                    backgroundColor: formData.isFeatured ? '#ecfdf5' : 'white'
                  }}>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      formData.isFeatured 
                        ? 'bg-emerald-600 border-emerald-600' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {formData.isFeatured && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 flex-1">
                    <span className="text-sm font-semibold text-gray-900">En vedette</span>
                  </div>
                </label>

                {/* Best Seller */}
                <label className="flex items-center p-3 bg-white rounded-lg border cursor-pointer transition-all hover:border-orange-300 hover:bg-orange-50"
                  style={{
                    borderColor: formData.isBestSeller ? '#f97316' : '#e5e7eb',
                    backgroundColor: formData.isBestSeller ? '#fff7ed' : 'white'
                  }}>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isBestSeller}
                      onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      formData.isBestSeller 
                        ? 'bg-orange-600 border-orange-600' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {formData.isBestSeller && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 flex-1">
                    <span className="text-sm font-semibold text-gray-900">Best Seller</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Caractéristiques du produit */}
            {productSpecs.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Caractéristiques du produit</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Renseignez les caractéristiques (optionnel)</p>
                </div>

                {/* Formulaire des caractéristiques en grille */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {productSpecs.map((spec) => (
                    <div key={spec._id} className="flex flex-col">
                      <label className="block mb-1 text-xs font-semibold text-gray-700">
                        {spec.name}
                      </label>
                      <input
                        type={spec.type === 'number' ? 'text' : 'text'}
                        inputMode={spec.type === 'number' ? 'decimal' : 'text'}
                        value={formData.specifications[spec.name] || ''}
                        onChange={(e) => updateSpecification(spec.name, e.target.value, spec.type)}
                        placeholder={spec.type === 'number' ? 'Nombre uniquement' : `Entrez ${spec.name.toLowerCase()}`}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer le produit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-all border border-gray-200"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      {!showForm && allProducts.length > 0 && (
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

      {products.length === 0 && !showForm ? (
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
            <button
              onClick={() => {
                setShowForm(true);
                resetForm();
              }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Créer votre premier produit
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {products.map((product) => {
              const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
              return (
                <div 
                  key={product._id} 
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Miniature image */}
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={getImageUrl(primaryImage.url)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Informations principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/produit/${product.slug}`}
                          className="font-bold text-gray-900 hover:text-green-600 transition-colors block truncate"
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Prix */}
                        <div className="text-right">
                          <p className="font-bold text-green-600">{product.price.toFixed(2)} €</p>
                          {product.compareAtPrice && (
                            <p className="text-xs text-gray-400 line-through">{product.compareAtPrice.toFixed(2)} €</p>
                          )}
                        </div>
                        {/* Stock */}
                        <div className="text-right w-16">
                          <p className="text-xs text-gray-500">Stock</p>
                          <p className={`font-semibold ${product.isInStock ? 'text-green-600' : 'text-red-600'}`}>
                            {product.stock}
                          </p>
                        </div>
                        {/* Badges */}
                        <div className="flex flex-col gap-1">
                          {product.isBestSeller && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 text-xs font-black rounded whitespace-nowrap border border-orange-300">
                              🔥 Best Seller
                            </span>
                          )}
                          {product.isFeatured && (
                            <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-lg whitespace-nowrap shadow-lg flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Vedette
                            </span>
                          )}
                          {!product.isInStock && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded whitespace-nowrap">
                              Rupture
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/produits/${product._id}/stats`}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Statistiques"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Modal Génération IA */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 border-b border-purple-500 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Génération IA
                  </h2>
                  <p className="text-purple-100 mt-1">Décrivez votre produit et l'IA remplira automatiquement les informations</p>
                </div>
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    setAiDescription('');
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description du produit
                </label>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Exemple: Aspirateur robot Nematic avec technologie ReFlo, puissance moteur 2000W, rayon d'action 50m, réservoir inclus, prise Nuplug, dimensions 35x35x10cm, poids 3.5kg..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm min-h-[200px] resize-y"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Plus vous donnez de détails, plus l'IA pourra remplir précisément les champs
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    setAiDescription('');
                  }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAIGeneration}
                  disabled={!aiDescription.trim() || aiLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Générer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}



