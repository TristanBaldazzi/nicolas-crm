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
  const { user, loadFromStorage, isLoading: authLoading } = useAuthStore();
  const { items, removeItem, updateQuantity, clearCart, clearCartLocal, getTotalItems, loadCart } = useCartStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  // Charger depuis le storage au montage
  useEffect(() => {
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Attendre que le chargement soit terminé avant de vérifier
    if (authLoading) return;
    
    if (!user || user.role === 'admin') {
      router.push('/login');
      return;
    }
    // Charger le panier depuis le backend au montage
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      loadProducts();
    }
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
      // Créer ou mettre à jour la commande en statut "demande"
      // Utiliser la route POST qui gère automatiquement le statut "demande"
      await cartsApi.create({
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity
        })),
        notes
      });
      
      toast.success('Votre commande a été envoyée avec succès !');
      // Vider le panier local sans synchroniser pour éviter de supprimer la commande qui vient d'être validée
      clearCartLocal();
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

  // Afficher un loader pendant le chargement de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

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
          <div className="bg-gradient-to-br from-white via-green-50/30 to-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">
            <div className="relative p-16 text-center">
              {/* Background decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
              </div>
              
              <div className="relative max-w-md mx-auto">
                <div className="w-32 h-32 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                
                <h3 className="text-4xl font-black text-gray-900 mb-4">
                  Panier <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">vide</span>
                </h3>
                
                <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                  Votre panier attend d'être rempli !<br />
                  Découvrez notre sélection de produits professionnels.
                </p>
                
                <Link
                  href="/catalogue"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 via-green-600 to-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:from-green-700 hover:via-green-700 hover:to-emerald-700 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105 duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Parcourir le catalogue
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
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

