'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { cartsApi, contactApi } from '@/lib/api';
import AdminFooter from './AdminFooter';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, loadFromStorage, isLoading: authLoading } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingContactsCount, setPendingContactsCount] = useState(0);
  const hasCheckedAuth = useRef<string | undefined | 'null'>(undefined);

  useEffect(() => {
    // Charger depuis le storage une seule fois au montage
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger le nombre de commandes en demande
  useEffect(() => {
    if (user && isAdmin()) {
      const loadPendingCount = async () => {
        try {
          const res = await cartsApi.countPending();
          setPendingOrdersCount(res.data.count || 0);
        } catch (error) {
          console.error('Error loading pending orders count:', error);
        }
      };
      
      loadPendingCount();
      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(loadPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isAdmin]);

  // Charger le nombre de contacts non traités
  useEffect(() => {
    if (user && isAdmin()) {
      const loadPendingContactsCount = async () => {
        try {
          const res = await contactApi.countPending();
          setPendingContactsCount(res.data.count || 0);
        } catch (error) {
          console.error('Error loading pending contacts count:', error);
        }
      };
      
      loadPendingContactsCount();
      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(loadPendingContactsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    // Ne rien faire si on est encore en train de charger
    if (authLoading) return;
    
    // Ne vérifier qu'une seule fois par changement d'utilisateur
    const currentUserId = user?.id;
    if (hasCheckedAuth.current === currentUserId || (hasCheckedAuth.current === 'null' && !currentUserId)) return;
    
    // Vérifier l'authentification et rediriger si nécessaire
    // Note: on vérifie pathname dans le corps mais ne l'inclut pas dans les dépendances
    // pour éviter les boucles infinies lors des redirections
    if (user === null) {
      if (pathname && !pathname.startsWith('/login')) {
        hasCheckedAuth.current = currentUserId || 'null';
        router.replace('/login');
      }
    } else if (user.role !== 'admin') {
      if (pathname && pathname.startsWith('/admin')) {
        hasCheckedAuth.current = currentUserId;
        router.replace('/');
      }
    } else {
      // Utilisateur admin valide
      hasCheckedAuth.current = currentUserId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, authLoading]);

  // Afficher un loader pendant le chargement
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

  if (!user || !isAdmin()) {
    return null;
  }

  const mainNavItems = [
    { href: '/admin', label: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
    { href: '/admin/produits', label: 'Produits', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )},
    { href: '/admin/paniers', label: 'Commandes', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { href: '/admin/clients', label: 'Clients', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { href: '/admin/contact', label: 'Contact', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )},
  ];

  const moreNavItems = [
    { href: '/admin/categories', label: 'Catégories', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    )},
    { href: '/admin/entreprises', label: 'Entreprises', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )},
    { href: '/admin/promotions', label: 'Promotions', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { href: '/admin/email', label: 'Email Marketing', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )},
    { href: '/admin/settings', label: 'Paramètres', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Bande verte Admin Mode */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-2 shadow-md">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-bold text-sm uppercase tracking-wider">Mode Administrateur</span>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold hover:bg-white/20 px-3 py-1 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour au site
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo simplifié */}
            <Link href="/admin" className="text-xl font-black bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              Admin
            </Link>

            {/* Navigation Desktop */}
            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center px-8">
              {mainNavItems.map((item) => {
                const active = isActive(item.href);
                const isCommandes = item.href === '/admin/paniers';
                const isContact = item.href === '/admin/contact';
                const showBadge = (isCommandes && pendingOrdersCount > 0) || (isContact && pendingContactsCount > 0);
                const badgeCount = isCommandes ? pendingOrdersCount : isContact ? pendingContactsCount : 0;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
                      ${active
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700'
                        : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                      }
                    `}
                    title={item.label}
                  >
                    <span className={active ? 'text-green-600' : 'text-gray-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {badgeCount > 9 ? '+9' : badgeCount}
                      </span>
                    )}
                    {active && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
              
              {/* Menu "Plus" */}
              <div className="relative">
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
                    ${moreMenuOpen
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700'
                      : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  <span>Plus</span>
                </button>
                
                {moreMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setMoreMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                      {moreNavItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMoreMenuOpen(false)}
                            className={`
                              flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                              ${active
                                ? 'bg-green-50 text-green-700 font-semibold'
                                : 'text-gray-700 hover:bg-gray-50'
                              }
                            `}
                          >
                            <span className={active ? 'text-green-600' : 'text-gray-400'}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Menu mobile button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-green-600"
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

          {/* Menu mobile */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-200">
              <div className="space-y-2">
                {mainNavItems.map((item) => {
                  const active = isActive(item.href);
                  const isCommandes = item.href === '/admin/paniers';
                  const isContact = item.href === '/admin/contact';
                  const showBadge = (isCommandes && pendingOrdersCount > 0) || (isContact && pendingContactsCount > 0);
                  const badgeCount = isCommandes ? pendingOrdersCount : isContact ? pendingContactsCount : 0;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        relative flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all
                        ${active
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700'
                          : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className={active ? 'text-green-600' : 'text-gray-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {showBadge && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                          {badgeCount > 9 ? '+9' : badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <div className="pt-2 border-t border-gray-200">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Plus
                  </div>
                  {moreNavItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                          ${active
                            ? 'bg-green-50 text-green-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        <span className={active ? 'text-green-600' : 'text-gray-400'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main className="container mx-auto px-4 sm:px-6 py-8 flex-1">{children}</main>
      
      <AdminFooter />
    </div>
  );
}



