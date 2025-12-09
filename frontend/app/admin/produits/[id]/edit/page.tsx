'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import CustomSelect from '@/components/CustomSelect';
import { productsApi, uploadApi, productSpecsApi, brandsApi, categoriesApi, productFilesApi } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { getImageUrl } from '@/lib/config';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [productSpecs, setProductSpecs] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [productFiles, setProductFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
    if (productId) {
      loadProduct();
      loadData();
      loadProductFiles();
    }
  }, [productId]);

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
    }
  };

  const loadProduct = async () => {
    try {
      const res = await productsApi.getById(productId);
      const productData = res.data;
      setProduct(productData);
      
      // Convertir les specifications Map en objet si nécessaire
      const specs = productData.specifications || {};
      const specsObj: Record<string, any> = {};
      if (specs instanceof Map) {
        specs.forEach((value, key) => {
          specsObj[key] = value;
        });
      } else if (typeof specs === 'object') {
        Object.assign(specsObj, specs);
      }
      
      setFormData({
        name: productData.name,
        description: productData.description || '',
        shortDescription: productData.shortDescription || '',
        sku: productData.sku || '',
        price: productData.price.toString(),
        compareAtPrice: productData.compareAtPrice?.toString() || '',
        brand: productData.brand?._id || productData.brand || '',
        category: productData.category?._id || productData.category || '',
        subCategory: productData.subCategory?._id || productData.subCategory || '',
        stock: productData.stock.toString(),
        isInStock: productData.isInStock,
        isFeatured: productData.isFeatured,
        isBestSeller: productData.isBestSeller || false,
        images: productData.images || [],
        specifications: specsObj,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du chargement');
      router.push('/admin/produits');
    } finally {
      setLoading(false);
    }
  };

  const loadProductFiles = async () => {
    if (!productId) return;
    setLoadingFiles(true);
    try {
      const res = await productFilesApi.getByProduct(productId);
      setProductFiles(res.data.files || []);
    } catch (error: any) {
      console.error('Error loading product files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileUpload = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) {
      return;
    }

    if (productFiles.length + filesToUpload.length > 30) {
      toast.error(`Limite de 30 fichiers atteinte. Vous avez ${productFiles.length} fichier(s) existant(s).`);
      return;
    }

    setUploadingFiles(true);
    try {
      const formData = new FormData();
      filesToUpload.forEach((file) => {
        formData.append('files', file);
      });

      await productFilesApi.upload(productId, formData);
      toast.success(`${filesToUpload.length} fichier${filesToUpload.length > 1 ? 's' : ''} uploadé${filesToUpload.length > 1 ? 's' : ''} avec succès`);
      loadProductFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'upload');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files).slice(0, 30 - productFiles.length);
    if (files.length === 0) {
      toast.error('Limite de 30 fichiers atteinte');
      return;
    }

    // Upload automatique
    await handleFileUpload(files);
    
    // Réinitialiser l'input
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (uploadingFiles || productFiles.length >= 30) return;

    const files = Array.from(e.dataTransfer.files).slice(0, 30 - productFiles.length);
    if (files.length === 0) {
      toast.error('Limite de 30 fichiers atteinte');
      return;
    }

    // Upload automatique
    await handleFileUpload(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      return;
    }

    try {
      await productFilesApi.delete(fileId);
      toast.success('Fichier supprimé avec succès');
      loadProductFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (mimetype === 'application/pdf') {
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
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
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        stock: parseInt(formData.stock) || 0,
        specifications: formData.specifications,
      };
      
      await productsApi.update(productId, data);
      toast.success('Produit modifié avec succès');
      router.push('/admin/produits');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const updateSpecification = (specName: string, value: any, specType?: string) => {
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

  const mainCategories = categories.filter((c) => !c.parentCategory);
  const subCategories = categories.filter((c) => c.parentCategory);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Produit non trouvé</p>
          <Link href="/admin/produits" className="text-green-600 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/produits"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la liste des produits
        </Link>
        <h1 className="text-4xl font-black text-gray-900">Modifier le produit</h1>
        <p className="text-gray-600 mt-2">{product.name}</p>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900">Modifier un produit</h2>
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
                  setShowAllSpecs(false);
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
          {productSpecs.length > 0 && (() => {
            // Filtrer les caractéristiques selon la catégorie
            const categorySpecIds = selectedCategory?.productSpecs?.map((spec: any) => spec._id || spec) || [];
            const displaySpecs = showAllSpecs || !selectedCategory || categorySpecIds.length === 0
              ? productSpecs
              : productSpecs.filter(spec => categorySpecIds.includes(spec._id));
            
            const hasMoreSpecs = !showAllSpecs && selectedCategory && categorySpecIds.length > 0 && productSpecs.length > categorySpecIds.length;

            return (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Caractéristiques du produit</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {selectedCategory && categorySpecIds.length > 0 && !showAllSpecs
                        ? `${categorySpecIds.length} caractéristique${categorySpecIds.length > 1 ? 's' : ''} de la catégorie "${selectedCategory.name}"`
                        : 'Renseignez les caractéristiques (optionnel)'}
                    </p>
                  </div>
                  {selectedCategory && categorySpecIds.length > 0 && (
                    <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                      {categorySpecIds.length} / {productSpecs.length}
                    </div>
                  )}
                </div>

                {/* Formulaire des caractéristiques en grille */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displaySpecs.map((spec) => (
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

                {/* Bouton pour voir toutes les caractéristiques */}
                {hasMoreSpecs && (
                  <div className="mt-4 pt-4 border-t border-blue-200 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAllSpecs(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Voir tous les caractéristiques ({productSpecs.length})
                    </button>
                  </div>
                )}

                {/* Bouton pour revenir aux caractéristiques de la catégorie */}
                {showAllSpecs && selectedCategory && categorySpecIds.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAllSpecs(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Voir uniquement les caractéristiques de la catégorie ({categorySpecIds.length})
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Fichiers du produit */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Fichiers téléchargeables (max 30)</label>
            <div className="relative">
              <input
                type="file"
                id="product-files-upload"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploadingFiles || productFiles.length >= 30}
              />
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                className={`relative border-2 border-dashed rounded-lg transition-all ${
                  uploadingFiles || productFiles.length >= 30
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : isDragging
                    ? 'border-purple-500 bg-purple-50 scale-[1.02]'
                    : 'border-purple-300 bg-purple-50/50 hover:border-purple-400 hover:bg-purple-100/50 cursor-pointer'
                }`}
              >
                <label
                  htmlFor="product-files-upload"
                  className={`flex flex-col items-center justify-center gap-2 w-full px-6 py-6 cursor-pointer transition-all ${
                    uploadingFiles || productFiles.length >= 30
                      ? 'cursor-not-allowed'
                      : ''
                  }`}
                >
                  {uploadingFiles ? (
                    <>
                      <svg className="w-8 h-8 text-purple-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-sm font-medium text-gray-500">Upload en cours...</span>
                    </>
                  ) : productFiles.length >= 30 ? (
                    <>
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-500">Limite de 30 fichiers atteinte</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div className="text-center">
                        <span className="text-sm font-semibold text-gray-900 block mb-0.5">
                          Cliquez ou glissez-déposez des fichiers ici
                        </span>
                        <span className="text-xs text-gray-600">
                          PDF, images, documents... ({productFiles.length}/30 fichiers)
                        </span>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Liste des fichiers */}
            {loadingFiles ? (
              <div className="text-center py-8 text-gray-500 text-sm">Chargement...</div>
            ) : productFiles.length > 0 ? (
              <div className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {productFiles.map((file: any) => (
                    <div key={file._id} className="group relative bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-all overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getFileIcon(file.mimetype)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate mb-1" title={file.originalName}>
                              {file.originalName}
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <div>{formatFileSize(file.size)}</div>
                              <div>{new Date(file.createdAt).toLocaleDateString('fr-FR')}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file._id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                        title="Supprimer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">Aucun fichier ajouté</div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
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
    </AdminLayout>
  );
}



