'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { productsApi } from '@/lib/api';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  const loadProduct = async () => {
    try {
      const res = await productsApi.getBySlug(slug);
      setProduct(res.data);
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
                    src={`http://localhost:5000${product.images[selectedImage]?.url}`}
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
                          selectedImage === index ? 'border-primary-600' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={`http://localhost:5000${img.url}`}
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
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            
            {product.brand && (
              <div className="mb-4">
                <span className="text-sm text-gray-600">Marque:</span>
                <span className="ml-2 font-semibold">{product.brand}</span>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-primary-600">
                  {product.price.toFixed(2)} €
                </span>
                {product.compareAtPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {product.compareAtPrice.toFixed(2)} €
                  </span>
                )}
              </div>
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
              <div className="text-sm text-gray-600">
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
          </div>
        </div>
      </div>
    </div>
  );
}

