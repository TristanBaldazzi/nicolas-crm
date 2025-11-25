'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/lib/cartStore';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadProduct();
  }, [slug]);

  const loadProduct = async () => {
    try {
      const res = await productsApi.getBySlug(slug);
      setProduct(res.data);
      
      // Charger les produits recommandés
      if (res.data._id) {
        try {
          const recommendedRes = await productsApi.getRecommended(res.data._id);
          setRecommendedProducts(recommendedRes.data.products || []);
        } catch (error) {
          console.error('Error loading recommended products:', error);
        }
      }
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
                          selectedImage === index ? 'border-green-600' : 'border-transparent'
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
                <span className="text-4xl font-bold text-green-600">
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
              <div className="text-sm text-gray-600 mb-6">
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

            {user && user.role !== 'admin' && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm font-semibold text-gray-700">Quantité:</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    addItem(product._id, quantity);
                    toast.success(`${quantity} article(s) ajouté(s) au panier`);
                    setQuantity(1);
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
                >
                  Ajouter au panier
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Produits recommandés */}
        {recommendedProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t border-gray-200">
            <h2 className="text-3xl font-bold mb-8 text-center">Produits recommandés</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((recommendedProduct) => {
                const primaryImage = recommendedProduct.images?.find((img: any) => img.isPrimary) || recommendedProduct.images?.[0];
                return (
                  <Link
                    key={recommendedProduct._id}
                    href={`/produit/${recommendedProduct.slug}`}
                    className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    {primaryImage && (
                      <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        <img
                          src={`http://localhost:5000${primaryImage.url}`}
                          alt={primaryImage.alt || recommendedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                        {recommendedProduct.name}
                      </h3>
                      {recommendedProduct.brand && (
                        <p className="text-sm text-gray-500 mb-2">{recommendedProduct.brand}</p>
                      )}
                      <p className="text-xl font-bold text-green-600">
                        {recommendedProduct.price.toFixed(2)} €
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

