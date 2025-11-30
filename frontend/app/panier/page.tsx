'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/lib/cartStore';
import { useAuthStore } from '@/lib/store';
import { productsApi, cartsApi } from '@/lib/api';
import { getImageUrl } from '@/lib/config';
import toast from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, removeItem, updateQuantity, clearCart, getTotalItems } = useCartStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user || user.role === 'admin') {
      router.push('/login');
      return;
    }
    loadProducts();
  }, [items, user]);

  const loadProducts = async () => {
    if (items.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // Récupérer tous les produits et filtrer ceux du panier
      const res = await productsApi.getAll({ limit: 1000 });
      const allProducts = res.data.products || [];
      
      const productData = items.map((item) => {
        const product = allProducts.find((p: any) => p._id === item.product);
        return product ? { ...product, cartQuantity: item.quantity } : null;
      }).filter(p => p !== null);

      setProducts(productData);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    setSubmitting(true);
    try {
      await cartsApi.create({
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity
        })),
        notes
      });
      
      toast.success('Votre commande a été envoyée avec succès !');
      clearCart();
      setNotes('');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  const total = products.reduce((sum, product) => {
    const item = items.find(i => i.product === product._id);
    return sum + (product.price * (item?.quantity || 0));
  }, 0);

  if (!user || user.role === 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Mon panier</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Votre panier est vide</h3>
              <p className="text-gray-600 mb-8">
                Ajoutez des produits à votre panier pour commencer vos achats.
              </p>
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
              >
                Parcourir le catalogue
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {products.map((product) => {
                const item = items.find(i => i.product === product._id);
                if (!item) return null;

                const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];

                return (
                  <div key={product._id} className="bg-white rounded-xl shadow-md p-6 flex gap-6">
                    {primaryImage && (
                      <img
                        src={getImageUrl(primaryImage.url)}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                      <p className="text-gray-600 mb-4">{product.brand}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(product._id, item.quantity - 1)}
                              className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(product._id, item.quantity + 1)}
                              className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              removeItem(product._id);
                              toast.success('Produit retiré du panier');
                            }}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Supprimer
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {(product.price * item.quantity).toFixed(2)} €
                          </p>
                          <p className="text-sm text-gray-500">{product.price.toFixed(2)} € / unité</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
                <h2 className="text-2xl font-bold mb-6">Résumé de la commande</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-semibold">{total.toFixed(2)} €</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-green-600">{total.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ajoutez des notes pour votre commande..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || items.length === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Envoi en cours...' : 'Valider la commande'}
                </button>

                <Link
                  href="/catalogue"
                  className="block text-center text-gray-600 hover:text-green-600 mt-4 text-sm font-medium"
                >
                  Continuer les achats
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

