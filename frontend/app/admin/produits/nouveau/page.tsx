'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import CustomSelect from '@/components/CustomSelect';
import { productsApi, uploadApi, productSpecsApi, brandsApi, categoriesApi } from '@/lib/api';
import { getImageUrl } from '@/lib/config';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [productSpecs, setProductSpecs] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
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
    brand: '',
    category: '',
    subCategory: '',
    stock: '',
    isInStock: true,
    isFeatured: false,
    isBestSeller: false,
    images: [] as any[],
    specifications: {} as Record<string, any>,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Charger la catégorie sélectionnée pour obtenir ses caractéristiques
  useEffect(() => {
    if (formData.category) {
      loadCategoryData();
    } else {
      setSelectedCategory(null);
      setShowAllSpecs(false);
    }
  }, [formData.category]);

  const loadCategoryData = async () => {
    try {
      const res = await categoriesApi.getById(formData.category);
      setSelectedCategory(res.data);
    } catch (error) {
      console.error('Error loading category:', error);
      setSelectedCategory(null);
    }
  };

  const loadData = async () => {
    try {
      const [categoriesRes, specsRes, brandsRes] = await Promise.all([
        categoriesApi.getAll(),
        productSpecsApi.getAll(),
        brandsApi.getAll(),
      ]);
      setCategories(categoriesRes.data || []);
      setProductSpecs(specsRes.data || []);
      setBrands(brandsRes.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);
    try {
      // Validation côté client pour donner un feedback immédiat
      if (!formData.name || formData.name.trim() === '') {
        toast.error('Le nom du produit est obligatoire');
        setSaving(false);
        return;
      }

      if (!formData.price || formData.price === '') {
        toast.error('Le prix du produit est obligatoire');
        setSaving(false);
        return;
      }

      if (!formData.category || formData.category === '') {
        toast.error('La catégorie est obligatoire. Veuillez sélectionner une catégorie.');
        setSaving(false);
        return;
      }

      const data = {
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        stock: parseInt(formData.stock) || 0,
        brand: formData.brand || null,
        subCategory: formData.subCategory || null,
        specifications: formData.specifications,
      };

      await productsApi.create(data);
      toast.success('Produit créé avec succès');
      router.push('/admin/produits');
    } catch (error: any) {
      // Extraire le message d'erreur de manière plus détaillée
      let errorMessage = 'Erreur lors de la création du produit';
      
      if (error.response?.data) {
        // Si l'erreur contient un champ 'details', l'utiliser
        if (error.response.data.details) {
          errorMessage = error.response.data.details;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        style: {
          maxWidth: '500px',
        },
      });
    } finally {
      setSaving(false);
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

  const updateSpecification = (specName: string, value: any, specType?: string) => {
    // Validation pour les champs de type number
    if (specType === 'number') {
      if (value === '' || value === null || value === undefined) {
        setFormData({
          ...formData,
          specifications: {
            ...formData.specifications,
            [specName]: '',
          },
        });
        return;
      }
      const numValue = value.toString().replace(',', '.');
      if (!/^-?\d*\.?\d*$/.test(numValue)) {
        return;
      }
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

      setShowAIModal(false);
      setAiDescription('');
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/produits"
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Créer un nouveau produit</h1>
            <p className="text-gray-600 mt-1">Remplissez les informations du produit</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAIModal(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Génération IA
        </button>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-black text-gray-900">Informations du produit</h2>
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
              <label className="block mb-1 text-xs font-semibold text-gray-700">Marque</label>
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
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Création...' : 'Créer le produit'}
            </button>
            <Link
              href="/admin/produits"
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-all border border-gray-200"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>

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
