'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useCartStore } from '@/lib/cartStore';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout, isAdmin, loadFromStorage } = useAuthStore();
  const { items, loadCart } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Calculer le nombre d'items dans le panier
  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    // Charger depuis le storage une seule fois au montage
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger le panier depuis le backend quand l'utilisateur est connecté
  useEffect(() => {
    if (user && !isAdmin()) {
      loadCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Vérifier périodiquement les changements du panier (pour détecter les changements depuis d'autres onglets)
  useEffect(() => {
    if (!user || isAdmin()) return;
    
    const interval = setInterval(() => {
      loadCart();
    }, 2000); // Vérifier toutes les 2 secondes
    
    return () => clearInterval(interval);
  }, [user, isAdmin, loadCart]);

  return (
    <>
      {/* User Dashboard Bar - En haut */}
      {user && (
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-2 shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-semibold">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold uppercase">
                    {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link 
                  href="/dashboard"
                  className="flex items-center gap-2 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Tableau de bord</span>
                </Link>
                {isAdmin() && (
                  <Link 
                    href="/admin/produits"
                    className="flex items-center gap-2 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="font-medium">Gérer les produits</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
              RCMPLAY
            </span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-green-600 font-medium transition-colors relative group"
            >
              Accueil
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
            </Link>
            <Link 
              href="/catalogue" 
              className="text-gray-700 hover:text-green-600 font-medium transition-colors relative group"
            >
              Catalogue
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
            </Link>
            <Link 
              href="/notre-societe" 
              className="text-gray-700 hover:text-green-600 font-medium transition-colors relative group"
            >
              Notre société
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
            </Link>
            {user ? (
              <>
                {!isAdmin() && (
                  <Link 
                    href="/panier" 
                    className="relative text-gray-700 hover:text-green-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemsCount}
                      </span>
                    )}
                  </Link>
                )}
                {isAdmin() && (
                  <Link 
                    href="/admin" 
                    className="text-gray-700 hover:text-green-600 font-medium transition-colors relative group"
                  >
                    Admin
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-gray-700 hover:text-green-600 font-medium transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
              >
                Connexion
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-slide-up">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-700 hover:text-green-600 font-medium">Accueil</Link>
              <Link href="/catalogue" className="text-gray-700 hover:text-green-600 font-medium">Catalogue</Link>
              <Link href="/notre-societe" className="text-gray-700 hover:text-green-600 font-medium">Notre société</Link>
              {user ? (
                <>
                  {!isAdmin() && (
                    <Link href="/panier" className="flex items-center gap-2 text-gray-700 hover:text-green-600 font-medium">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Panier {cartItemsCount > 0 && `(${cartItemsCount})`}
                    </Link>
                  )}
                  {isAdmin() && <Link href="/admin" className="text-gray-700 hover:text-green-600 font-medium">Admin</Link>}
                  <button onClick={logout} className="text-gray-700 hover:text-green-600 font-medium text-left">Déconnexion</button>
                </>
              ) : (
                <Link href="/login" className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold text-center">Connexion</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}
